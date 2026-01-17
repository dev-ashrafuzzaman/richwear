import { toObjectId } from "../../utils/safeObjectId.js";
import { generateCode } from "../../utils/codeGenerator.js";
import { nowDate } from "../../utils/date.js";
import { writeAuditLog } from "../../utils/logger.js";
import { COLLECTIONS } from "../../database/collections.js";

export const createPurchase = async ({ db, body, req }) => {
    const session = db.client.startSession();

    try {
        session.startTransaction();

        const branchId = toObjectId(body.branchId, "branchId");
        const supplierId = toObjectId(body.supplierId, "supplierId");

        const purchaseNo = await generateCode({
            db,
            scope: "PURCHASE",
            prefix: "PUR"
        });

        let totalQty = 0;
        let totalAmount = 0;

        for (const item of body.items) {
            const variantId = toObjectId(item.variantId, "variantId");

            const variant = await db
                .collection(COLLECTIONS.VARIANTS)
                .findOne({ _id: variantId }, { session });

            if (!variant) throw new Error("Variant not found");

            /* =====================
               1️⃣ STOCK UPDATE
            ====================== */
            const stock = await db
                .collection(COLLECTIONS.STOCKS)
                .findOne({ branchId, variantId }, { session });

            if (!stock) {
                await db.collection(COLLECTIONS.STOCKS).insertOne(
                    {
                        branchId,
                        variantId,
                        sku: variant.sku,
                        qty: item.qty,
                        avgCost: item.costPrice,
                        updatedAt: nowDate()
                    },
                    { session }
                );
            } else {
                const newQty = stock.qty + item.qty;
                const newAvg =
                    (stock.qty * stock.avgCost + item.qty * item.costPrice) /
                    newQty;

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
               2️⃣ VARIANT PRICE UPDATE (OPTIONAL)
            ====================== */
            if (item.salePrice) {
                await db.collection(COLLECTIONS.VARIANTS).updateOne(
                    { _id: variantId },
                    {
                        $set: {
                            mrp: item.salePrice,
                            salePrice: item.salePrice,
                            updatedAt: nowDate()
                        }
                    },
                    { session }
                );
            }

            totalQty += item.qty;
            totalAmount += item.qty * item.costPrice;
        }

        /* =====================
           3️⃣ PURCHASE DOCUMENT
        ====================== */
        await db.collection(COLLECTIONS.PURCHASES).insertOne(
            {
                purchaseNo,
                branchId,
                supplierId,
                items: body.items,
                totalQty,
                totalAmount,
                createdAt: nowDate()
            },
            { session }
        );

        await session.commitTransaction();

        await writeAuditLog({
            db,
            userId: req?.user?._id,
            action: "PURCHASE_CREATE",
            collection: COLLECTIONS.PURCHASES,
            documentId: purchaseNo,
            payload: {
                totalQty,
                totalAmount,
                supplierId
            },
            ipAddress: req?.ip,
            userAgent: req?.headers?.["user-agent"]
        });

        return { purchaseNo };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};
