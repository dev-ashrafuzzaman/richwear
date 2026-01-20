import { postJournalEntry } from "./journals/journals.service.js";
import { resolveSystemAccounts } from "./account.resolver.js";
import { roundMoney } from "../../utils/money.js";

const resolveAccountByCode = async (db, code) => {
  const acc = await db.collection("accounts").findOne({ code });
  if (!acc) {
    throw new Error(`Account not found: ${code}`);
  }
  return acc._id;
};

/* ======================================================
   SALES ACCOUNTING
====================================================== */
export const salesAccounting = async ({
  db,
  session,
  saleId,
  total,
  payments = [],
  customerId,
  branchId,
  narration = "Sales Invoice",
}) => {
  const amount = roundMoney(total);

  const SYS = await resolveSystemAccounts(db);

  const customerControlAccountId = await resolveAccountByCode(
    db,
    "1004", // Accounts Receivable
  );

  const entries = [];
  let paidTotal = 0;

  /* =====================
     PAYMENTS (LEAF ACCOUNTS)
  ====================== */
  for (const p of payments) {
    const payAmount = roundMoney(p.amount || 0);
    if (payAmount <= 0) continue;

    if (!p.accountId) {
      throw new Error("Payment accountId is required");
    }

    paidTotal += payAmount;

    entries.push({
      accountId: p.accountId, // 🔥 bKash / Nagad / DBBL
      debit: payAmount,
    });
  }

  /* =====================
     SAFETY
  ====================== */
  if (paidTotal > amount) {
    throw new Error("Paid amount exceeds invoice total");
  }

  /* =====================
     CUSTOMER DUE (AR)
  ====================== */
  const dueAmount = roundMoney(amount - paidTotal);
  if (dueAmount > 0) {
    entries.push({
      accountId: customerControlAccountId,
      debit: dueAmount,
      partyType: "CUSTOMER",
      partyId: customerId,
    });
  }

  /* =====================
     SALES INCOME
  ====================== */
  entries.push({
    accountId: SYS.SALES_INCOME,
    credit: amount,
  });

  return postJournalEntry({
    db,
    session,
    date: new Date(),
    refType: "SALE",
    refId: saleId,
    narration,
    entries,
    branchId,
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
  refunds = [], 
  dueAdjust = 0,
  customerId,
  branchId,
  narration = "Sales Return",
}) => {
  const total = roundMoney(returnAmount);
  const due = roundMoney(dueAdjust);

  const SYS = await resolveSystemAccounts(db);

  const customerControlAccountId = await resolveAccountByCode(
    db,
    "1004" // Accounts Receivable
  );

  const entries = [];
  let refundTotal = 0;

  entries.push({
    accountId: SYS.SALES_INCOME,
    debit: total,
  });


  for (const r of refunds) {
    const amt = roundMoney(r.amount || 0);
    if (amt <= 0) continue;

    if (!r.accountId) {
      throw new Error("Refund accountId is required");
    }

    refundTotal += amt;

    entries.push({
      accountId: r.accountId,
      credit: amt,
    });
  }

  if (due > 0) {
    entries.push({
      accountId: customerControlAccountId,
      credit: due,
      partyType: "CUSTOMER",
      partyId: customerId,
    });
  }


  if (roundMoney(refundTotal + due) !== total) {
    throw new Error("Sales return settlement mismatch");
  }

  return postJournalEntry({
    db,
    session,
    date: new Date(), // UTC
    refType: "SALE_RETURN",
    refId: salesReturnId,
    narration,
    entries,
    branchId,
  });
};

/* ======================================================
   PURCHASE ACCOUNTING V0.1
====================================================== */
export const purchaseAccounting = async ({
  db,
  session,
  purchaseId,
  totalAmount,
  cashPaid = 0,
  dueAmount = 0,
  supplierId,
  branchId,
  narration,
}) => {
  if (cashPaid + dueAmount !== totalAmount) {
    throw new Error("Purchase amount mismatch");
  }

  const SYS = await resolveSystemAccounts(db);

  const supplierControlAccountId = await resolveAccountByCode(
    db,
    "2001", // Accounts Payable
  );

  const entries = [];

  // Inventory
  entries.push({
    accountId: SYS.INVENTORY,
    debit: totalAmount,
  });

  // Cash
  if (cashPaid > 0) {
    entries.push({
      accountId: SYS.CASH,
      credit: cashPaid,
    });
  }

  // Supplier Due
  if (dueAmount > 0) {
    entries.push({
      accountId: supplierControlAccountId,
      credit: dueAmount,
      partyType: "SUPPLIER",
      partyId: supplierId,
    });
  }

  return postJournalEntry({
    db,
    session,
    date: new Date(),
    refType: "PURCHASE",
    refId: purchaseId,
    narration,
    entries,
    branchId,
  });
};

/* ======================================================
   PURCHASE RETURN ACCOUNTING V0.1
====================================================== */
export const purchaseReturnAccounting = async ({
  db,
  session,
  purchaseReturnId,
  returnAmount,
  cashRefund = 0,
  dueAdjust = 0,
  supplierId,
  branchId,
  narration = "Purchase Return",
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

  /* =====================
     2️⃣ SYSTEM ACCOUNTS
  ====================== */
  const SYS = await resolveSystemAccounts(db);

  const supplierControlAccountId = await resolveAccountByCode(
    db,
    "2001", // Accounts Payable (Supplier Control)
  );

  const entries = [];

  /* =====================
     3️⃣ INVENTORY DECREASE
  ====================== */
  entries.push({
    accountId: SYS.INVENTORY,
    credit: total,
  });

  /* =====================
     4️⃣ CASH REFUND
  ====================== */
  if (cash > 0) {
    entries.push({
      accountId: SYS.CASH,
      debit: cash,
    });
  }

  /* =====================
     5️⃣ SUPPLIER DUE ADJUST
     (AP debit reduces supplier balance)
  ====================== */
  if (due > 0) {
    entries.push({
      accountId: supplierControlAccountId,
      debit: due,
      partyType: "SUPPLIER",
      partyId: supplierId,
    });
  }

  /* =====================
     6️⃣ JOURNAL POST
  ====================== */
  return postJournalEntry({
    db,
    session,
    date: new Date(),
    refType: "PURCHASE_RETURN",
    refId: purchaseReturnId,
    narration,
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
  branchId,
}) => {
  const SYS = await resolveSystemAccounts(db);

  if (!["CASH", "BANK"].includes(paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  const entries = [
    { accountId: supplierAccountId, debit: amount },
    {
      accountId: paymentMethod === "CASH" ? SYS.CASH : SYS.BANK,
      credit: amount,
    },
  ];

  return postJournalEntry({
    db,
    session,
    date: new Date(),
    refType: "SUPPLIER_PAYMENT",
    refId: paymentId,
    narration: "Supplier Payment",
    entries,
    branchId,
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
  branchId,
}) => {
  const SYS = await resolveSystemAccounts(db);

  if (!["CASH", "BANK"].includes(paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  const entries = [
    {
      accountId: paymentMethod === "CASH" ? SYS.CASH : SYS.BANK,
      debit: amount,
    },
    { accountId: customerAccountId, credit: amount },
  ];

  return postJournalEntry({
    db,
    session,
    date: new Date(),
    refType: "CUSTOMER_PAYMENT",
    refId: paymentId,
    narration: "Customer Payment",
    entries,
    branchId,
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
  branchId,
}) => {
  const SYS = await resolveSystemAccounts(db);

  const entries = [
    { accountId: SYS.SALARY_EXPENSE, debit: amount },
    {
      accountId: paymentMethod === "CASH" ? SYS.CASH : SYS.BANK,
      credit: amount,
    },
  ];

  return postJournalEntry({
    db,
    session,
    date: new Date(),
    refType: "SALARY_PAYMENT",
    refId: salaryPaymentId,
    narration: "Salary Payment",
    entries,
    branchId,
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
  branchId,
}) => {
  const SYS = await resolveSystemAccounts(db);

  const entries = [
    { accountId: SYS.COMMISSION_EXPENSE, debit: amount },
    {
      accountId: paymentMethod === "CASH" ? SYS.CASH : SYS.BANK,
      credit: amount,
    },
  ];

  return postJournalEntry({
    db,
    session,
    date: new Date(),
    refType: "COMMISSION_PAYMENT",
    refId: commissionId,
    narration: "Commission Payment",
    entries,
    branchId,
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
  branchId,
}) => {
  const SYS = await resolveSystemAccounts(db);
  const entries = [];

  if (adjustmentType === "INCREASE") {
    entries.push(
      { accountId: SYS.INVENTORY, debit: amount },
      { accountId: SYS.OTHER_INCOME, credit: amount },
    );
  }

  if (adjustmentType === "DECREASE") {
    entries.push(
      { accountId: SYS.PURCHASE_EXPENSE, debit: amount },
      { accountId: SYS.INVENTORY, credit: amount },
    );
  }

  return postJournalEntry({
    db,
    session,
    date: new Date(),
    refType: "INVENTORY_ADJUSTMENT",
    refId: adjustmentId,
    narration: reason || "Inventory Adjustment",
    entries,
    branchId,
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
  branchId,
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
    branchId,
  });
};
