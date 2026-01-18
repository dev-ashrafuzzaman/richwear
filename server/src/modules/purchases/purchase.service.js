import { toObjectId } from "../../utils/safeObjectId.js";
import { generateCode } from "../../utils/codeGenerator.js";
import { nowDate } from "../../utils/date.js";
import { writeAuditLog } from "../../utils/logger.js";
import { COLLECTIONS } from "../../database/collections.js";

export const createPurchase = async ({ db, body, req }) => {
  const session = db.client.startSession();

  try {
    session.startTransaction();

    const branchId = toObjectId(body.branchId);
    const supplierId = toObjectId(body.supplierId);

    const purchaseNo = await generateCode({
      db,
      module: "PURCHASE",
      prefix: "PUR",
      scope: "YEAR",
      session
    });

    let totalQty = 0;
    let totalAmount = 0;

    for (const item of body.items) {
      const variantId = toObjectId(item.variantId);

      const variant = await db
        .collection(COLLECTIONS.VARIANTS)
        .findOne({ _id: variantId }, { session });

      if (!variant) throw new Error("Variant not found");

      /* =====================
         STOCK + AVG COST
      ====================== */
      const stock = await db.collection(COLLECTIONS.STOCKS)
        .findOne({ branchId, variantId }, { session });

      if (!stock) {
        await db.collection(COLLECTIONS.STOCKS).insertOne({
          branchId,
          variantId,
          sku: variant.sku,
          qty: item.qty,
          avgCost: item.costPrice,
          createdAt: nowDate()
        }, { session });
      } else {
        const newQty = stock.qty + item.qty;
        const newAvg =
          (stock.qty * stock.avgCost + item.qty * item.costPrice) / newQty;

        await db.collection(COLLECTIONS.STOCKS).updateOne(
          { _id: stock._id },
          {
            $set: {
              qty: newQty,
              avgCost: Number(newAvg.toFixed(2)),
              updatedAt: nowDate()
            }
          },
          { session }
        );
      }

      /* =====================
         SALE PRICE UPDATE (CONTROLLED)
      ====================== */
      if (item.updateSalePrice) {
        await db.collection(COLLECTIONS.VARIANTS).updateOne(
          { _id: variantId },
          {
            $set: {
              salePrice: item.salePrice,
              mrp: item.salePrice,
              updatedAt: nowDate()
            },
            $push: {
              priceHistory: {
                oldPrice: variant.salePrice,
                newPrice: item.salePrice,
                date: nowDate(),
                reason: "PURCHASE_UPDATE"
              }
            }
          },
          { session }
        );
      }

      totalQty += item.qty;
      totalAmount += item.qty * item.costPrice;
    }

    /* =====================
       PURCHASE DOCUMENT
    ====================== */
    await db.collection(COLLECTIONS.PURCHASES).insertOne({
      purchaseNo,
      branchId,
      supplierId,
      items: body.items,
      totalQty,
      totalAmount,
      createdAt: nowDate()
    }, { session });

    await session.commitTransaction();

    return { purchaseNo };

  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
};
