import { getDB } from "../../../config/db.js";


export const COLLECTIONS = {
  AUDITS: "stock_audits",
  AUDIT_ITEMS: "stock_audit_items",
  ADJUSTMENTS: "stock_adjustments",
  STOCKS: "stocks",
  TRANSFERS: "stock_transfers"
};

export const audits = () => getDB().collection(COLLECTIONS.AUDITS);
export const auditItems = () => getDB().collection(COLLECTIONS.AUDIT_ITEMS);
export const adjustments = () => getDB().collection(COLLECTIONS.ADJUSTMENTS);
export const stocks = () => getDB().collection(COLLECTIONS.STOCKS);
export const transfers = () => getDB().collection(COLLECTIONS.TRANSFERS);










//stock_audits {
//   _id,
//   auditNo,

//   branchId,
//   branchName,

//   status: "DRAFT" | "SUBMITTED" | "APPROVED",

//   startedBy: {
//     userId,
//     name,
//     role
//   },

//   startedAt,
//   closedAt,

//   summary: {
//     totalSystemQty,
//     totalScannedQty,
//     totalMissingQty,
//     totalExtraQty,

//     totalStockValue,
//     missingStockValue,
//     variancePercent
//   }
// }

// Indexes

// { branchId: 1, startedAt: -1 }
// { auditNo: 1 }


// 📌 stock_audit_items
// {
//   _id,
//   auditId,

//   branchId,
//   productId,
//   variantId,

//   sku,
//   productName,
//   attributes: { size, color },

//   systemQty,
//   scannedQty,
//   diffQty,

//   unitPrice,
//   diffValue,

//   status: "MATCH" | "MISSING" | "EXTRA"
// }


// Indexes

// { auditId: 1 }
// { branchId: 1, sku: 1 }


// 📌 stock_adjustments
// {
//   _id,
//   auditId,
//   branchId,
//   variantId,

//   beforeQty,
//   afterQty,
//   diffQty,

//   approvedBy,
//   approvedAt,
//   reason: "STOCK_AUDIT"
// }