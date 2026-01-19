import { nowDate } from "../../utils/date.js";
import { postJournalEntry } from "./journals/journals.service.js";
import { resolveSystemAccounts } from "./account.resolver.js";
import { roundMoney } from "../../utils/money.js";

/* ======================================================
   SALES ACCOUNTING
====================================================== */
export const salesAccounting = async ({
  db,
  session,
  saleId,
  total,
  payments,              // [{ method, amount }]
  customerAccountId,
  branchId
}) => {
  const SYS = await resolveSystemAccounts(db);

  const entries = [];
  let paidTotal = 0;

  for (const p of payments) {
    if (p.amount <= 0) continue;
    paidTotal += p.amount;

    if (p.method === "CASH") {
      entries.push({ accountId: SYS.CASH, debit: p.amount });
    }

    if (["BKASH", "NAGAD", "ROCKET", "UPAY", "BANK", "CARD"].includes(p.method)) {
      entries.push({ accountId: SYS.BANK, debit: p.amount });
    }
  }

  const dueAmount = total - paidTotal;
  if (dueAmount > 0) {
    entries.push({ accountId: customerAccountId, debit: dueAmount });
  }

  entries.push({ accountId: SYS.SALES_INCOME, credit: total });

  return postJournalEntry({
    db,
    session,
    date: nowDate(),
    refType: "SALE",
    refId: saleId,
    narration: "Sales Invoice",
    entries,
    branchId
  });
};

/* ======================================================
   SALES RETURN ACCOUNTING
====================================================== */
export const salesReturnAccounting = async ({
  db,
  session,
  salesReturnId,
  returnAmount,
  cashRefund = 0,
  dueAdjust = 0,
  customerAccountId,
  branchId
}) => {
  if (cashRefund + dueAdjust !== returnAmount) {
    throw new Error("Sales return amount mismatch");
  }

  const SYS = await resolveSystemAccounts(db);
  const entries = [];

  // Reverse income
  entries.push({
    accountId: SYS.SALES_INCOME,
    debit: returnAmount
  });

  if (cashRefund > 0) {
    entries.push({
      accountId: SYS.CASH,
      credit: cashRefund
    });
  }

  if (dueAdjust > 0) {
    entries.push({
      accountId: customerAccountId,
      credit: dueAdjust
    });
  }

  return postJournalEntry({
    db,
    session,
    date: nowDate(),
    refType: "SALE_RETURN",
    refId: salesReturnId,
    narration: "Sales Return",
    entries,
    branchId
  });
};

/* ======================================================
   PURCHASE ACCOUNTING
====================================================== */
export const purchaseAccounting = async ({
  db,
  session,
  purchaseId,
  totalAmount,
  cashPaid = 0,
  dueAmount = 0,
  supplierAccountId,
  branchId
}) => {
  if (cashPaid + dueAmount !== totalAmount) {
    throw new Error("Purchase amount mismatch");
  }

  const SYS = await resolveSystemAccounts(db);
  const entries = [];

  entries.push({
    accountId: SYS.INVENTORY,
    debit: totalAmount
  });

  if (cashPaid > 0) {
    entries.push({
      accountId: SYS.CASH,
      credit: cashPaid
    });
  }

  if (dueAmount > 0) {
    entries.push({
      accountId: supplierAccountId,
      credit: dueAmount
    });
  }

  return postJournalEntry({
    db,
    session,
    date: nowDate(),
    refType: "PURCHASE",
    refId: purchaseId,
    narration: "Purchase Invoice",
    entries,
    branchId
  });
};

/* ======================================================
   PURCHASE RETURN ACCOUNTING
====================================================== */
export const purchaseReturnAccounting = async ({
  db,
  session,
  purchaseReturnId,
  returnAmount,
  cashRefund = 0,
  dueAdjust = 0,
  supplierAccountId,
  branchId,
}) => {
  const total = roundMoney(returnAmount);
  const cash = roundMoney(cashRefund);
  const due = roundMoney(dueAdjust);

  /* =====================
     1️⃣ SAFETY CHECK
  ====================== */
  if (roundMoney(cash + due) !== total) {
    throw new Error("Purchase return amount mismatch");
  }

  const SYS = await resolveSystemAccounts(db);
  const entries = [];

  /* =====================
     2️⃣ INVENTORY DECREASE
  ====================== */
  entries.push({
    accountId: SYS.INVENTORY,
    credit: total,
  });

  /* =====================
     3️⃣ CASH REFUND
  ====================== */
  if (cash > 0) {
    entries.push({
      accountId: SYS.CASH,
      debit: cash,
    });
  }

  /* =====================
     4️⃣ SUPPLIER DUE ADJUST
  ====================== */
  if (due > 0) {
    entries.push({
      accountId: supplierAccountId,
      debit: due,
    });
  }

  /* =====================
     5️⃣ JOURNAL POST
  ====================== */
  return postJournalEntry({
    db,
    session,
    date: nowDate(),
    refType: "PURCHASE_RETURN",
    refId: purchaseReturnId,
    narration: "Purchase Return",
    entries,
    branchId,
  });
};
/* ======================================================
   SUPPLIER PAYMENT
====================================================== */
export const supplierPaymentAccounting = async ({
  db,
  session,
  paymentId,
  amount,
  paymentMethod,
  supplierAccountId,
  branchId
}) => {
  const SYS = await resolveSystemAccounts(db);

  if (!["CASH", "BANK"].includes(paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  const entries = [
    { accountId: supplierAccountId, debit: amount },
    {
      accountId: paymentMethod === "CASH" ? SYS.CASH : SYS.BANK,
      credit: amount
    }
  ];

  return postJournalEntry({
    db,
    session,
    date: nowDate(),
    refType: "SUPPLIER_PAYMENT",
    refId: paymentId,
    narration: "Supplier Payment",
    entries,
    branchId
  });
};

/* ======================================================
   CUSTOMER PAYMENT
====================================================== */
export const customerPaymentAccounting = async ({
  db,
  session,
  paymentId,
  amount,
  paymentMethod,
  customerAccountId,
  branchId
}) => {
  const SYS = await resolveSystemAccounts(db);

  if (!["CASH", "BANK"].includes(paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  const entries = [
    {
      accountId: paymentMethod === "CASH" ? SYS.CASH : SYS.BANK,
      debit: amount
    },
    { accountId: customerAccountId, credit: amount }
  ];

  return postJournalEntry({
    db,
    session,
    date: nowDate(),
    refType: "CUSTOMER_PAYMENT",
    refId: paymentId,
    narration: "Customer Payment",
    entries,
    branchId
  });
};

/* ======================================================
   SALARY PAYMENT
====================================================== */
export const salaryPaymentAccounting = async ({
  db,
  session,
  salaryPaymentId,
  amount,
  paymentMethod,
  branchId
}) => {
  const SYS = await resolveSystemAccounts(db);

  const entries = [
    { accountId: SYS.SALARY_EXPENSE, debit: amount },
    {
      accountId: paymentMethod === "CASH" ? SYS.CASH : SYS.BANK,
      credit: amount
    }
  ];

  return postJournalEntry({
    db,
    session,
    date: nowDate(),
    refType: "SALARY_PAYMENT",
    refId: salaryPaymentId,
    narration: "Salary Payment",
    entries,
    branchId
  });
};

/* ======================================================
   COMMISSION PAYMENT
====================================================== */
export const commissionAccounting = async ({
  db,
  session,
  commissionId,
  amount,
  paymentMethod,
  branchId
}) => {
  const SYS = await resolveSystemAccounts(db);

  const entries = [
    { accountId: SYS.COMMISSION_EXPENSE, debit: amount },
    {
      accountId: paymentMethod === "CASH" ? SYS.CASH : SYS.BANK,
      credit: amount
    }
  ];

  return postJournalEntry({
    db,
    session,
    date: nowDate(),
    refType: "COMMISSION_PAYMENT",
    refId: commissionId,
    narration: "Commission Payment",
    entries,
    branchId
  });
};

/* ======================================================
   INVENTORY ADJUSTMENT
====================================================== */
export const inventoryAdjustmentAccounting = async ({
  db,
  session,
  adjustmentId,
  adjustmentType,
  amount,
  reason,
  branchId
}) => {
  const SYS = await resolveSystemAccounts(db);
  const entries = [];

  if (adjustmentType === "INCREASE") {
    entries.push(
      { accountId: SYS.INVENTORY, debit: amount },
      { accountId: SYS.OTHER_INCOME, credit: amount }
    );
  }

  if (adjustmentType === "DECREASE") {
    entries.push(
      { accountId: SYS.PURCHASE_EXPENSE, debit: amount },
      { accountId: SYS.INVENTORY, credit: amount }
    );
  }

  return postJournalEntry({
    db,
    session,
    date: nowDate(),
    refType: "INVENTORY_ADJUSTMENT",
    refId: adjustmentId,
    narration: reason || "Inventory Adjustment",
    entries,
    branchId
  });
};

/* ======================================================
   OPENING BALANCE
====================================================== */
export const openingBalanceAccounting = async ({
  db,
  session,
  openingDate,
  balances,
  openingOffsetAccountId,
  branchId
}) => {
  const entries = [];
  let debit = 0;
  let credit = 0;

  for (const b of balances) {
    if (b.amount <= 0) continue;

    if (b.type === "ASSET") {
      entries.push({ accountId: b.accountId, debit: b.amount });
      debit += b.amount;
    }

    if (["LIABILITY", "EQUITY"].includes(b.type)) {
      entries.push({ accountId: b.accountId, credit: b.amount });
      credit += b.amount;
    }
  }

  const diff = debit - credit;

  if (diff > 0) {
    entries.push({ accountId: openingOffsetAccountId, credit: diff });
  }

  if (diff < 0) {
    entries.push({ accountId: openingOffsetAccountId, debit: Math.abs(diff) });
  }

  return postJournalEntry({
    db,
    session,
    date: openingDate,
    refType: "OPENING_BALANCE",
    refId: null,
    narration: "Opening Balance",
    entries,
    branchId
  });
};
