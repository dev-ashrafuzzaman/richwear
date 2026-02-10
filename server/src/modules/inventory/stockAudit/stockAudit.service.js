import { getDB, getClient } from "../../../config/db.js";
import {
  audits,
  auditItems,
  stocks,
  adjustments
} from "./stockAudit.collection.js";
import {
  toId,
  resolveStatus,
  calculateSummary,
  generateAuditNo
} from "./stockAudit.utils.js";

/* =====================================================
   START AUDIT
===================================================== */
export const startAudit = async ({ user, body }) => {
  const db = getDB();

  const branchId =
    user.role === "MANAGER" ? user.branchId : body.branchId;

  if (!branchId) throw new Error("Branch required");

  const auditNo = await generateAuditNo(db);

  const doc = {
    auditNo,
    branchId: toId(branchId, "branchId"),
    status: "DRAFT",
    startedBy: {
      userId: user._id,
      name: user.name,
      role: user.role
    },
    startedAt: new Date()
  };

  await audits().insertOne(doc);
  return doc;
};

/* =====================================================
   SCAN ITEM (BARCODE SAFE)
===================================================== */
export const scanItem = async ({ params, body }) => {
  const auditId = toId(params.auditId);
  const { sku } = body;

  const audit = await audits().findOne({ _id: auditId });
  if (!audit || audit.status !== "DRAFT") {
    throw new Error("Audit locked or not found");
  }

  const stock = await stocks().findOne({
    branchId: audit.branchId,
    sku
  });

  if (!stock) throw new Error("Invalid SKU");

  const existing = await auditItems().findOne({
    auditId,
    variantId: stock.variantId
  });

  if (!existing) {
    await auditItems().insertOne({
      auditId,
      branchId: audit.branchId,
      productId: stock.productId,
      variantId: stock.variantId,
      sku: stock.sku,
      productName: stock.productName,
      attributes: stock.attributes,
      systemQty: stock.qty,
      scannedQty: 1,
      diffQty: 1 - stock.qty,
      unitPrice: stock.salePrice,
      diffValue: (1 - stock.qty) * stock.salePrice,
      status: resolveStatus(1, stock.qty)
    });
  } else {
    const scannedQty = existing.scannedQty + 1;

    await auditItems().updateOne(
      { _id: existing._id },
      {
        $set: {
          scannedQty,
          diffQty: scannedQty - existing.systemQty,
          diffValue:
            (scannedQty - existing.systemQty) *
            existing.unitPrice,
          status: resolveStatus(
            scannedQty,
            existing.systemQty
          )
        }
      }
    );
  }

  return { success: true };
};

/* =====================================================
   MANUAL QTY UPDATE
===================================================== */
export const updateQty = async ({ params, body }) => {
  const itemId = toId(params.itemId);
  const { scannedQty } = body;

  const item = await auditItems().findOne({ _id: itemId });
  if (!item) throw new Error("Item not found");

  await auditItems().updateOne(
    { _id: itemId },
    {
      $set: {
        scannedQty,
        diffQty: scannedQty - item.systemQty,
        diffValue:
          (scannedQty - item.systemQty) * item.unitPrice,
        status: resolveStatus(scannedQty, item.systemQty)
      }
    }
  );

  return { success: true };
};

/* =====================================================
   SUBMIT AUDIT
===================================================== */
export const submitAudit = async ({ params }) => {
  const auditId = toId(params.auditId);

  const items = await auditItems()
    .find({ auditId })
    .toArray();

  const summary = calculateSummary(items);

  await audits().updateOne(
    { _id: auditId },
    {
      $set: {
        status: "SUBMITTED",
        summary,
        closedAt: new Date()
      }
    }
  );

  return { success: true };
};

/* =====================================================
   APPROVE AUDIT (TRANSACTION SAFE)
===================================================== */
export const approveAudit = async ({ params, user }) => {
  const client = getClient();
  const session = client.startSession();

  const auditId = toId(params.auditId);

  await session.withTransaction(async () => {
    const audit = await audits().findOne({ _id: auditId });
    if (audit.status !== "SUBMITTED") {
      throw new Error("Audit not ready");
    }

    const items = await auditItems()
      .find({
        auditId,
        status: { $ne: "MATCH" }
      })
      .toArray();

    for (const it of items) {
      const newQty = it.systemQty + it.diffQty;

      await stocks().updateOne(
        {
          branchId: audit.branchId,
          variantId: it.variantId
        },
        { $set: { qty: newQty } },
        { session }
      );

      await adjustments().insertOne(
        {
          auditId,
          branchId: audit.branchId,
          variantId: it.variantId,
          beforeQty: it.systemQty,
          afterQty: newQty,
          diffQty: it.diffQty,
          approvedBy: user._id,
          approvedAt: new Date(),
          reason: "STOCK_AUDIT"
        },
        { session }
      );
    }

    await audits().updateOne(
      { _id: auditId },
      { $set: { status: "APPROVED" } },
      { session }
    );
  });

  return { success: true };
};
