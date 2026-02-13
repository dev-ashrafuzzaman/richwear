import { ObjectId } from "mongodb";
import { resolveSystemAccounts } from "../../accounting/account.resolver.js";
import { postJournalEntry } from "../../accounting/journals/journals.service.js";
import { roundMoney } from "../../../utils/money.js";

export const createSalarySheet = async ({
  db,
  session,
  branchId,
  month,
  employees,
  userId,
}) => {
  if (!branchId) throw new Error("Branch required");
  if (!month) throw new Error("Month required");
  if (!employees?.length) throw new Error("No employees selected");

  const branchObjectId = new ObjectId(branchId);
  const userObjectId = new ObjectId(userId);

  const SYS = await resolveSystemAccounts(db);

  /* ===============================
     DUPLICATE PROTECTION
  =============================== */

  const existing = await db
    .collection("salary_sheets")
    .findOne({ branchId: branchObjectId, month }, { session });

  if (existing) throw new Error("Salary sheet already exists for this month");

  const sheetId = new ObjectId();
  let totalNet = 0;
  const journalEntries = [];

  /* ===============================
     LOOP EMPLOYEES
  =============================== */

  for (const emp of employees) {
    const employee = await db.collection("employees").findOne(
      {
        _id: new ObjectId(emp.employeeId),
        status: "active",
      },
      { session },
    );

    if (!employee) throw new Error("Employee not found");

    const base = roundMoney(employee?.payroll?.baseSalary || 0);
    const bonus = roundMoney(emp.bonus || 0);
    const deduction = roundMoney(emp.deduction || 0);

    const net = roundMoney(base + bonus - deduction);

    if (net < 0) throw new Error("Net salary cannot be negative");

    totalNet += net;

    /* Accounting Entries */

    journalEntries.push({
      accountId: SYS.SALARY_EXPENSE,
      debit: net,
    });

    journalEntries.push({
      accountId: SYS.SALARY_PAYABLE,
      credit: net,
      partyType: "EMPLOYEE",
      partyId: employee._id,
    });

    /* Insert Item */

    await db.collection("salary_sheet_items").insertOne(
      {
        salarySheetId: sheetId,
        employeeId: employee._id,
        baseSalary: base,
        bonus,
        deduction,
        netSalary: net,
        payableRemaining: net,
        status: "UNPAID",
        createdAt: new Date(),
      },
      { session },
    );
  }

  /* ===============================
     POST ACCRUAL JOURNAL
  =============================== */

  const journal = await postJournalEntry({
    db,
    session,
    date: new Date(),
    refType: "SALARY_ACCRUAL",
    refId: sheetId,
    narration: `Salary Sheet ${month}`,
    entries: journalEntries,
    branchId: branchObjectId,
  });

  if (!journal?._id) throw new Error("Journal failed");

  /* ===============================
     INSERT MAIN SHEET
  =============================== */

  await db.collection("salary_sheets").insertOne(
    {
      _id: sheetId,
      month,
      branchId: branchObjectId,
      totalNet,
      status: "POSTED",
      journalId: journal._id,
      createdBy: userObjectId,
      createdAt: new Date(),
    },
    { session },
  );

  return sheetId;
};

export const processSalaryPayment = async ({
  db,
  session,
  salarySheetItemId,
  amountPaid,
  paymentAccountId,
  payment,
  userId,
}) => {

  if (!ObjectId.isValid(salarySheetItemId))
    throw new Error("Invalid Salary Item ID");

  if (!ObjectId.isValid(paymentAccountId))
    throw new Error("Invalid Payment Account");

  if (amountPaid <= 0) throw new Error("Invalid payment amount");

  const SYS = await resolveSystemAccounts(db);

  /* ===============================
     FETCH SALARY ITEM (WITH SESSION)
  =============================== */

  const item = await db
    .collection("salary_sheet_items")
    .findOne({ _id: new ObjectId(salarySheetItemId) }, { session });

  if (!item) throw new Error("Salary item not found");

  if (amountPaid > item.payableRemaining)
    throw new Error("Payment exceeds remaining amount");

  /* ===============================
     FETCH SHEET (FOR BRANCH)
  =============================== */

  const sheet = await db
    .collection("salary_sheets")
    .findOne({ _id: item.salarySheetId }, { session });

  if (!sheet) throw new Error("Salary sheet not found");

  /* ===============================
     ATOMIC UPDATE (RACE SAFE)
  =============================== */

  const updated = await db.collection("salary_sheet_items").findOneAndUpdate(
    {
      _id: item._id,
      payableRemaining: { $gte: amountPaid },
    },
    [
      {
        $set: {
          payableRemaining: {
            $subtract: ["$payableRemaining", amountPaid],
          },
        },
      },
      {
        $set: {
          status: {
            $cond: [
              { $eq: [{ $subtract: ["$payableRemaining", amountPaid] }, 0] },
              "PAID",
              "PARTIAL",
            ],
          },
        },
      },
    ],
    {
      session,
      returnDocument: "after",
    },
  );

  if (!updated?._id) {
    throw new Error(
      "Payment could not be processed. Please refresh and try again.",
    );
  }

  const newRemaining = updated.payableRemaining;

  const newStatus = newRemaining === 0 ? "PAID" : "PARTIAL";

  await db
    .collection("salary_sheet_items")
    .updateOne({ _id: item._id }, { $set: { status: newStatus } }, { session });

  /* ===============================
     ACCOUNTING ENTRY
  =============================== */

  const entries = [
    {
      accountId: SYS.SALARY_PAYABLE,
      debit: amountPaid,
      partyType: "EMPLOYEE",
      partyId: item.employeeId,
    },
    {
      accountId: paymentAccountId,
      credit: amountPaid,
    },
  ];

  const journal = await postJournalEntry({
    db,
    session,
    date: new Date(),
    refType: "SALARY_PAYMENT",
    refId: item._id,
    narration: `Salary Payment for ${sheet.month} via ${payment}`,
    entries,
    branchId: sheet.branchId,
  });

  /* ===============================
     INSERT PAYMENT RECORD
  =============================== */

  await db.collection("payroll_payments").insertOne(
    {
      salarySheetId: item.salarySheetId,
      salarySheetItemId: item._id,
      employeeId: item.employeeId,
      branchId: sheet.branchId,
      paymentAccountId: new ObjectId(paymentAccountId),
      payment,
      amountPaid,
      journalId: journal._id,
      createdBy: new ObjectId(userId),
      createdAt: new Date(),
    },
    { session },
  );

  /* ===============================
     AUTO COMPLETE SHEET
  =============================== */

  const remainingCount = await db
    .collection("salary_sheet_items")
    .countDocuments(
      {
        salarySheetId: item.salarySheetId,
        status: { $ne: "PAID" },
      },
      { session },
    );

  if (remainingCount === 0) {
    await db
      .collection("salary_sheets")
      .updateOne(
        { _id: item.salarySheetId },
        { $set: { status: "COMPLETED" } },
        { session },
      );
  }

  return journal._id;
};
