import { ObjectId } from "mongodb";
import { generateCode } from "../../utils/codeGenerator.js";
import { nowBD } from "../../utils/date.js";
import { writeAuditLog } from "../../utils/logger.js";

export const createPurchase = async ({ db, body }) => {
    const session = db.client.startSession();

    try {
        session.startTransaction();

        const branchId = new ObjectId(body.branchId);
        const supplierId = new ObjectId(body.supplierId);

        const purchaseNo = await generateCode({
            db,
            scope: "PURCHASE",
            prefix: "PUR"
        });

        let totalQty = 0;
        let totalAmount = 0;

        for (const item of body.items) {
            const variantId = new ObjectId(item.variantId);

            const variant = await db.collection("variants").findOne(
                { _id: variantId },
                { session }
            );
            if (!variant) throw new Error("Invalid variant");

            /* =====================
               1️⃣ STOCK UPDATE
            ====================== */
            const stock = await db.collection("stocks").findOne(
                { branchId, variantId },
                { session }
            );

            if (!stock) {
                await db.collection("stocks").insertOne(
                    {
                        branchId,
                        variantId,
                        sku: variant.sku,
                        qty: item.qty,
                        avgCost: item.costPrice,
                        updatedAt: nowBD()
                    },
                    { session }
                );
            } else {
                const newQty = stock.qty + item.qty;
                const newAvg =
                    (stock.qty * stock.avgCost + item.qty * item.costPrice) / newQty;

                await db.collection("stocks").updateOne(
                    { _id: stock._id },
                    {
                        $set: {
                            qty: newQty,
                            avgCost: Number(newAvg.toFixed(2)),
                            updatedAt: nowBD()
                        }
                    },
                    { session }
                );
            }

            /* =====================
               2️⃣ VARIANT PRICE UPDATE (OPTIONAL)
            ====================== */
            if (item.salePrice) {
                await db.collection("variants").updateOne(
                    { _id: variantId },
                    {
                        $set: {
                            mrp: item.salePrice,
                            salePrice: item.salePrice,
                            updatedAt: nowBD()
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
        await db.collection("purchases").insertOne(
            {
                purchaseNo,
                branchId,
                supplierId,
                items: body.items,
                totalQty,
                totalAmount,
                createdAt: nowBD()
            },
            { session }
        );

        await session.commitTransaction();
        await writeAuditLog({
            db,
            userId: req.user?._id,
            action: "PURCHASE_CREATE",
            collection: "purchases",
            documentId: purchaseNo,
            payload: {
                totalQty,
                totalAmount,
                supplierId: body.supplierId
            },
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"]
        });
        return { purchaseNo };


    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};
