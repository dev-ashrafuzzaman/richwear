// modules/accounting/reports/customerStatement/customerStatement.report.js
import { ObjectId } from "mongodb";

/**
 * Customer Statement (Invoice Grouped)
 */
export const customerStatementReport = async ({
  db,
  customerAccountId,
  fromDate,
  toDate,
  branchId
}) => {
  const match = {
    accountId: new ObjectId(customerAccountId)
  };

  if (branchId) match.branchId = new ObjectId(branchId);

  if (fromDate || toDate) {
    match.date = {};
    if (fromDate) match.date.$gte = fromDate;
    if (toDate) match.date.$lte = toDate;
  }

  const rows = await db.collection("ledgers")
    .find(match)
    .sort({ date: 1 })
    .toArray();

  const invoices = {};
  let runningBalance = 0;

  for (const r of rows) {
    const invoiceId =
      r.refType === "SALE" || r.refType === "SALE_RETURN"
        ? r.refId?.toString()
        : "PAYMENT";

    if (!invoices[invoiceId]) {
      invoices[invoiceId] = {
        invoiceId: invoiceId === "PAYMENT" ? null : invoiceId,
        date: r.date,
        invoiceAmount: 0,
        paidAmount: 0,
        adjustments: 0,
        balance: 0,
        transactions: []
      };
    }

    runningBalance += (r.debit || 0) - (r.credit || 0);

    // SALE → debit customer
    if (r.refType === "SALE") {
      invoices[invoiceId].invoiceAmount += r.debit;
    }

    // CUSTOMER_PAYMENT → credit customer
    if (r.refType === "CUSTOMER_PAYMENT") {
      invoices[invoiceId].paidAmount += r.credit;
    }

    // SALE_RETURN → credit customer
    if (r.refType === "SALE_RETURN") {
      invoices[invoiceId].adjustments += r.credit;
    }

    invoices[invoiceId].balance =
      invoices[invoiceId].invoiceAmount -
      invoices[invoiceId].paidAmount -
      invoices[invoiceId].adjustments;

    invoices[invoiceId].transactions.push({
      date: r.date,
      refType: r.refType,
      debit: r.debit,
      credit: r.credit,
      narration: r.narration
    });
  }

  return {
    customerAccountId,
    fromDate,
    toDate,
    invoices: Object.values(invoices),
    closingBalance: runningBalance
  };
};
