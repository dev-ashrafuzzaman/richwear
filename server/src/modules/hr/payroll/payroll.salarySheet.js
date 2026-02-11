import { ObjectId } from "mongodb";
import { resolveSystemAccounts } from "../../accounting/account.resolver.js";
import { postJournalEntry } from "../../accounting/journals/journals.service.js";
import { roundMoney } from "../../../utils/money.js";

export const createSalarySheet = async ({
  db,
  session,
  branchId,
  month,
  employees, // [{ employeeId, bonus, deduction }]
  userId,
}) => {
  console.log("Branch", branchId);
  if (!branchId) {
    throw new Error("No Branch selected");
  }

  const SYS = await resolveSystemAccounts(db);

  /* =====================================================
     PREVENT DUPLICATE SHEET
  ===================================================== */
  const existing = await db
    .collection("salary_sheets")
    .findOne({ branchId, month }, { session });

  if (existing) {
    throw new Error("Salary sheet already created for this month");
  }

  if (!employees || employees.length === 0) {
    throw new Error("No employees selected");
  }

  let totalExpense = 0;
  const entries = [];

  const sheetId = new ObjectId();

  /* =====================================================
     LOOP EMPLOYEES
  ===================================================== */

  for (const emp of employees) {
    const employee = await db.collection("employees").findOne(
      {
        _id: new ObjectId(emp.employeeId),
        status: "active",
      },
      { session },
    );

    if (!employee) throw new Error("Employee not found");

    if (!employee?.payroll?.baseSalary) {
      throw new Error("Base salary not configured");
    }

    const base = roundMoney(employee.payroll.baseSalary);
    const bonus = roundMoney(emp.bonus || 0);
    const deduction = roundMoney(emp.deduction || 0);

    const net = roundMoney(base + bonus - deduction);

    if (net < 0) {
      throw new Error("Net salary cannot be negative");
    }

    totalExpense += net;

    /* ---------------- Accounting Entries ---------------- */

    entries.push({
      accountId: SYS.SALARY_EXPENSE,
      debit: net,
    });

    entries.push({
      accountId: SYS.SALARY_PAYABLE,
      credit: net,
      partyType: "EMPLOYEE",
      partyId: employee._id,
    });

    /* ---------------- Insert Sheet Item ---------------- */

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

  /* =====================================================
     POST JOURNAL ENTRY (WITH SESSION)
  ===================================================== */

  const journal = await postJournalEntry({
    db,
    session, // make sure postJournalEntry also uses session internally
    date: new Date(),
    refType: "SALARY_ACCRUAL",
    refId: sheetId,
    narration: `Salary Sheet ${month}`,
    entries,
    branchId,
  });

  if (!journal?._id) {
    throw new Error("Journal entry failed");
  }

  console.log("journal", journal);
  /* =====================================================
     INSERT MAIN SHEET
  ===================================================== */

  await db.collection("salary_sheets").insertOne(
    {
      _id: sheetId,
      month,
      branchId : new ObjectId(branchId),
      status: "POSTED",
      totalNet: totalExpense,
      journalId: journal?._id,
      createdBy: new ObjectId(userId),
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
  paymentMethod,
  branchId,
  userId,
}) => {
  const SYS = await resolveSystemAccounts(db);

  const item = await db.collection("salary_sheet_items").findOne({
    _id: new ObjectId(salarySheetItemId),
  });

  if (!item) throw new Error("Salary item not found");

  if (amountPaid <= 0) throw new Error("Invalid payment amount");

  if (amountPaid > item.payableRemaining)
    throw new Error("Payment exceeds remaining amount");

  /* ---------------- Accounting Entry ---------------- */

  const entries = [
    {
      accountId: SYS.SALARY_PAYABLE,
      debit: amountPaid,
      partyType: "EMPLOYEE",
      partyId: item.employeeId,
    },
    {
      accountId: paymentMethod === "CASH" ? SYS.CASH : SYS.BANK,
      credit: amountPaid,
    },
  ];

  const journal = await postJournalEntry({
    db,
    session,
    date: new Date(),
    refType: "SALARY_PAYMENT",
    refId: item._id,
    narration: "Salary Payment",
    entries,
    branchId,
  });

  /* ---------------- Update Salary Item ---------------- */

  const remaining = item.payableRemaining - amountPaid;

  await db.collection("salary_sheet_items").updateOne(
    { _id: item._id },
    {
      $set: {
        payableRemaining: remaining,
        status: remaining === 0 ? "PAID" : "PARTIAL",
      },
    },
  );

  /* ---------------- Insert Payment Record ---------------- */

  const result = await db.collection("payroll_payments").insertOne({
    salarySheetId: item.salarySheetId,
    salarySheetItemId: item._id,
    employeeId: item.employeeId,
    branchId,
    amountPaid,
    paymentMethod,
    paymentDate: new Date(),
    journalId: journal._id,
    createdBy: userId,
    createdAt: new Date(),
  });

  return result.insertedId;
};
