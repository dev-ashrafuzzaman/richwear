import { nowDate } from "../../utils/date.js";
import { postJournalEntry } from "./journals/journals.service.js";

export const salesAccounting = async ({
  db,
  session,
  saleId,
  total,
  cash,
  due,
  accounts,
  branchId,
}) => {
  const entries = [];

  if (cash > 0) {
    entries.push({ accountId: accounts.cash, debit: cash });
  }

  if (due > 0) {
    entries.push({ accountId: accounts.customer, debit: due });
  }

  entries.push({
    accountId: accounts.salesIncome,
    credit: total,
  });

  return postJournalEntry({
    db,
    session,
    date: nowDate(),
    refType: "SALE",
    refId: saleId,
    narration: "Sales Invoice",
    entries,
    branchId,
  });
};

export const salesReturnAccounting = async ({
  db,
  session,
  salesReturnId,
  returnAmount,
  cashRefund = 0,
  dueAdjust = 0,
  accounts,
  branchId,
}) => {
  if (cashRefund + dueAdjust !== returnAmount) {
    throw new Error("Sales return amount mismatch");
  }

  const entries = [];

  entries.push({
    accountId: accounts.salesIncome,
    debit: returnAmount,
  });

  if (cashRefund > 0) {
    entries.push({
      accountId: accounts.cash,
      credit: cashRefund,
    });
  }

  if (dueAdjust > 0) {
    entries.push({
      accountId: accounts.customer,
      credit: dueAdjust,
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
    branchId,
  });
};

export const purchaseAccounting = async ({
  db,
  session,
  purchaseId,
  totalAmount,
  cashPaid = 0,
  dueAmount = 0,
  accounts,
  branchId,
}) => {
  /**
   * Safety check
   */
  if (cashPaid + dueAmount !== totalAmount) {
    throw new Error("Purchase amount mismatch");
  }

  const entries = [];

  // 📦 Inventory increase
  entries.push({
    accountId: accounts.inventory,
    debit: totalAmount,
  });

  // 💸 Cash payment
  if (cashPaid > 0) {
    entries.push({
      accountId: accounts.cash,
      credit: cashPaid,
    });
  }

  // 🧾 Supplier due
  if (dueAmount > 0) {
    entries.push({
      accountId: accounts.supplier,
      credit: dueAmount,
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
    branchId,
  });
};

export const purchaseReturnAccounting = async ({
  db,
  session,
  purchaseReturnId,
  returnAmount,
  cashRefund = 0,
  dueAdjust = 0,
  accounts,
  branchId,
}) => {
  /**
   * Safety validation
   */
  if (cashRefund + dueAdjust !== returnAmount) {
    throw new Error("Purchase return amount mismatch");
  }

  const entries = [];

  // 📉 Reduce inventory
  entries.push({
    accountId: accounts.inventory,
    credit: returnAmount,
  });

  // 💰 Cash received back
  if (cashRefund > 0) {
    entries.push({
      accountId: accounts.cash,
      debit: cashRefund,
    });
  }

  // 📄 Reduce supplier payable
  if (dueAdjust > 0) {
    entries.push({
      accountId: accounts.supplier,
      debit: dueAdjust,
    });
  }

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

export const supplierPaymentAccounting = async ({
  db,
  session,
  paymentId,
  amount,
  paymentMethod, // "CASH" | "BANK"
  accounts,
  branchId,
}) => {
  if (!["CASH", "BANK"].includes(paymentMethod)) {
    throw new Error("Invalid payment method for supplier payment");
  }

  const entries = [];

  // 🧾 Reduce supplier payable
  entries.push({
    accountId: accounts.supplier,
    debit: amount,
  });

  // 💸 Payment source
  entries.push({
    accountId: paymentMethod === "CASH" ? accounts.cash : accounts.bank,
    credit: amount,
  });

  return postJournalEntry({
    db,
    session,
    date: nowDate(),
    refType: "SUPPLIER_PAYMENT",
    refId: paymentId,
    narration: "Supplier Payment",
    entries,
    branchId,
  });
};

export const customerPaymentAccounting = async ({
  db,
  session,
  paymentId,
  amount,
  paymentMethod, // "CASH" | "BANK"
  accounts,
  branchId,
}) => {
  if (!["CASH", "BANK"].includes(paymentMethod)) {
    throw new Error("Invalid payment method for customer payment");
  }

  const entries = [];

  // 💰 Receive payment
  entries.push({
    accountId: paymentMethod === "CASH" ? accounts.cash : accounts.bank,
    debit: amount,
  });

  // 📉 Reduce customer due
  entries.push({
    accountId: accounts.customer,
    credit: amount,
  });

  return postJournalEntry({
    db,
    session,
    date: nowDate(),
    refType: "CUSTOMER_PAYMENT",
    refId: paymentId,
    narration: "Customer Payment",
    entries,
    branchId,
  });
};

export const salaryPaymentAccounting = async ({
  db,
  session,
  salaryPaymentId,
  amount,
  paymentMethod, // "CASH" | "BANK"
  accounts,
  branchId,
}) => {
  if (!["CASH", "BANK"].includes(paymentMethod)) {
    throw new Error("Invalid payment method for salary payment");
  }

  const entries = [];

  // 💼 Salary expense
  entries.push({
    accountId: accounts.salaryExpense,
    debit: amount,
  });

  // 💸 Payment source
  entries.push({
    accountId: paymentMethod === "CASH" ? accounts.cash : accounts.bank,
    credit: amount,
  });

  return postJournalEntry({
    db,
    date: nowDate(),
    refType: "SALARY_PAYMENT",
    refId: salaryPaymentId,
    narration: "Salary Payment",
    entries,
    branchId,
  });
};

export const commissionAccounting = async ({
  db,
  session,
  commissionId,
  amount,
  paymentMethod, // "CASH" | "BANK"
  accounts,
  branchId,
}) => {
  if (!["CASH", "BANK"].includes(paymentMethod)) {
    throw new Error("Invalid payment method for commission");
  }

  const entries = [];

  // 📊 Commission expense
  entries.push({
    accountId: accounts.commissionExpense,
    debit: amount,
  });

  // 💸 Payment source
  entries.push({
    accountId: paymentMethod === "CASH" ? accounts.cash : accounts.bank,
    credit: amount,
  });

  return postJournalEntry({
    db,
    session,
    date: nowDate(),
    refType: "COMMISSION_PAYMENT",
    refId: commissionId,
    narration: "Commission Payment",
    entries,
    branchId,
  });
};

export const inventoryAdjustmentAccounting = async ({
  db,
  session,
  adjustmentId,
  adjustmentType, // "INCREASE" | "DECREASE"
  amount,
  reason,
  accounts,
  branchId,
}) => {
  if (!["INCREASE", "DECREASE"].includes(adjustmentType)) {
    throw new Error("Invalid inventory adjustment type");
  }

  const entries = [];

  if (adjustmentType === "INCREASE") {
    // 📦 Inventory increase
    entries.push({
      accountId: accounts.inventory,
      debit: amount,
    });

    // 📈 Adjustment gain
    entries.push({
      accountId: accounts.adjustmentIncome,
      credit: amount,
    });
  }

  if (adjustmentType === "DECREASE") {
    // 📉 Adjustment loss
    entries.push({
      accountId: accounts.adjustmentExpense,
      debit: amount,
    });

    // 📦 Inventory decrease
    entries.push({
      accountId: accounts.inventory,
      credit: amount,
    });
  }

  return postJournalEntry({
    db,
    session,
    date: nowDate(),
    refType: "INVENTORY_ADJUSTMENT",
    refId: adjustmentId,
    narration: reason || "Inventory Adjustment",
    entries,
    branchId,
  });
};

export const openingBalanceAccounting = async ({
  db,
  session,
  openingDate,
  balances, // [{ accountId, amount, type }]
  openingOffsetAccountId, // system equity account
  branchId,
}) => {
  if (!openingDate) {
    throw new Error("Opening date is required");
  }

  if (!Array.isArray(balances) || balances.length === 0) {
    throw new Error("Opening balances required");
  }

  const entries = [];

  let totalDebit = 0;
  let totalCredit = 0;

  for (const b of balances) {
    if (b.amount <= 0) continue;

    // ASSET → Debit
    if (b.type === "ASSET") {
      entries.push({
        accountId: b.accountId,
        debit: b.amount,
      });
      totalDebit += b.amount;
    }

    // LIABILITY / EQUITY → Credit
    if (["LIABILITY", "EQUITY"].includes(b.type)) {
      entries.push({
        accountId: b.accountId,
        credit: b.amount,
      });
      totalCredit += b.amount;
    }
  }

  const diff = totalDebit - totalCredit;

  // Balance with Opening Offset Account
  if (diff > 0) {
    // Excess debit → credit offset
    entries.push({
      accountId: openingOffsetAccountId,
      credit: diff,
    });
  }

  if (diff < 0) {
    // Excess credit → debit offset
    entries.push({
      accountId: openingOffsetAccountId,
      debit: Math.abs(diff),
    });
  }

  return postJournalEntry({
    db,
    session,
    date: openingDate,
    refType: "OPENING_BALANCE",
    refId: null,
    narration: `Opening Balance as of ${openingDate.toISOString().slice(0, 10)}`,
    entries,
    branchId,
  });
};
