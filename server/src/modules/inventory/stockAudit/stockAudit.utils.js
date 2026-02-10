import { ObjectId } from "mongodb";

export const toId = (id, label = "id") => {
  if (!ObjectId.isValid(id)) {
    throw new Error(`Invalid ${label}`);
  }
  return new ObjectId(id);
};

export const resolveStatus = (scanned, system) => {
  if (scanned === system) return "MATCH";
  if (scanned < system) return "MISSING";
  return "EXTRA";
};

export const calculateSummary = (items) => {
  let totalSystemQty = 0;
  let totalScannedQty = 0;
  let totalMissingQty = 0;
  let totalExtraQty = 0;
  let totalStockValue = 0;
  let missingStockValue = 0;

  for (const it of items) {
    totalSystemQty += it.systemQty;
    totalScannedQty += it.scannedQty;
    totalStockValue += it.systemQty * it.unitPrice;

    if (it.diffQty < 0) {
      totalMissingQty += Math.abs(it.diffQty);
      missingStockValue += Math.abs(it.diffValue);
    }

    if (it.diffQty > 0) {
      totalExtraQty += it.diffQty;
    }
  }

  const variancePercent =
    totalStockValue === 0
      ? 0
      : (missingStockValue / totalStockValue) * 100;

  return {
    totalSystemQty,
    totalScannedQty,
    totalMissingQty,
    totalExtraQty,
    totalStockValue,
    missingStockValue,
    variancePercent: Number(variancePercent.toFixed(2))
  };
};

export const generateAuditNo = async (db) => {
  const count = await db.collection("stock_audits").countDocuments();
  return `AUD-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
};
