import { toObjectId } from "../../utils/safeObjectId.js";
import { generateCode } from "../../utils/codeGenerator.js";
import { nowDate } from "../../utils/date.js";
import { writeAuditLog } from "../../utils/logger.js";
import { COLLECTIONS } from "../../database/collections.js";
import { getMainBranch } from "../../utils/getMainWarehouse.js";

export const createPurchase = async ({ db, body, req }) => {
  const session = db.client.startSession();

  let purchaseNo;
  let totalQty = 0;
  let totalAmount = 0;
  let mainBranch;

  try {
    session.startTransaction();

    mainBranch = await getMainBranch(db, session);
    const branchId = mainBranch._id;

    const supplierId = toObjectId(body.supplierId, "supplierId");

    purchaseNo = await generateCode({
      db,
      module: "PURCHASE",
      prefix: "PUR",
      scope: "YEAR",
      branch: mainBranch.code,
      session
    });

    for (const item of body.items) {
      const variantId = toObjectId(item.variantId, "variantId");

      const variant = await db
        .collection(COLLECTIONS.VARIANTS)
        .findOne({ _id: variantId }, { session });

      if (!variant) throw new Error("Variant not found");

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
            createdAt: nowDate()
          },
          { session }
        );
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

      if (item.salePrice && item.salePrice !== variant.salePrice) {
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
                source: "PURCHASE",
                date: nowDate()
              }
            }
          },
          { session }
        );
      }

      totalQty += item.qty;
      totalAmount += item.qty * item.costPrice;
    }

    const insertResult = await db
      .collection(COLLECTIONS.PURCHASES)
      .insertOne(
        {
          purchaseNo,
          supplierId,
          branchId,

          invoiceNumber: body.invoiceNumber,
          invoiceDate: body.invoiceDate,

          items: body.items,
          totalQty,
          totalAmount,
          notes: body.notes || null,
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
      documentId: insertResult.insertedId,
      referenceNo: purchaseNo,
      payload: {
        branch: mainBranch.code,
        supplierId,
        totalQty,
        totalAmount,
        invoiceNumber: body.invoiceNumber
      },
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      createdAt: nowDate()
    });

    return {
      purchaseNo,
      branch: mainBranch.code,
      invoiceNumber: body.invoiceNumber,
      totalQty,
      totalAmount
    };

  } catch (error) {
    await session.abortTransaction();

    await writeAuditLog({
      db,
      userId: req?.user?._id,
      action: "PURCHASE_CREATE_FAILED",
      collection: COLLECTIONS.PURCHASES,
      referenceNo: purchaseNo || null,
      payload: { error: error.message },
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      createdAt: nowDate()
    });

    throw error;

  } finally {
    await session.endSession();
  }
};


export const createPurchaseReturn = async ({ db, body, req }) => {
  const session = db.client.startSession();

  let returnNo;
  let totalQty = 0;
  let totalAmount = 0;
  let mainBranch;

  try {
    session.startTransaction();

    mainBranch = await getMainBranch(db, session);
    const branchId = mainBranch._id;

    /* =====================
       2️⃣ PURCHASE FETCH
    ====================== */
    const purchaseId = toObjectId(body.purchaseId, "purchaseId");

    const purchase = await db
      .collection(COLLECTIONS.PURCHASES)
      .findOne({ _id: purchaseId }, { session });

    if (!purchase) throw new Error("Purchase not found");

    /* =====================
       3️⃣ RETURN NUMBER
    ====================== */
    returnNo = await generateCode({
      db,
      module: "PURCHASE_RETURN",
      prefix: "PRT",
      scope: "YEAR",
      branch: mainBranch.code,
      session
    });

    /* =====================
       4️⃣ ITEM LOOP
    ====================== */
    for (const item of body.items) {
      const variantId = toObjectId(item.variantId, "variantId");

      const purchaseItem = purchase.items.find(
        (i) => i.variantId.toString() === variantId.toString()
      );

      if (!purchaseItem) {
        throw new Error("Variant not found in purchase");
      }

      if (item.qty > purchaseItem.qty) {
        throw new Error("Return qty exceeds purchase qty");
      }

      /* ---------- STOCK DECREASE ---------- */
      const stock = await db.collection(COLLECTIONS.STOCKS).findOne(
        { branchId, variantId },
        { session }
      );

      if (!stock || stock.qty < item.qty) {
        throw new Error("Insufficient stock for return");
      }

      await db.collection(COLLECTIONS.STOCKS).updateOne(
        { _id: stock._id },
        {
          $inc: { qty: -item.qty },
          $set: { updatedAt: nowDate() }
        },
        { session }
      );

      totalQty += item.qty;
      totalAmount += item.qty * purchaseItem.costPrice;
    }

    /* =====================
       5️⃣ RETURN DOCUMENT
    ====================== */
    const insertResult = await db
      .collection(COLLECTIONS.PURCHASE_RETURNS)
      .insertOne(
        {
          returnNo,
          purchaseId,
          supplierId: purchase.supplierId,
          branchId,

          returnDate: body.returnDate,
          reason: body.reason,

          items: body.items,
          totalQty,
          totalAmount,

          createdAt: nowDate()
        },
        { session }
      );

    /* =====================
       6️⃣ SUPPLIER LEDGER (CREDIT)
    ====================== */
    await db.collection(COLLECTIONS.SUPPLIER_LEDGER).insertOne(
      {
        supplierId: purchase.supplierId,
        referenceType: "PURCHASE_RETURN",
        referenceId: insertResult.insertedId,
        referenceNo: returnNo,
        credit: totalAmount,
        date: nowDate()
      },
      { session }
    );

    await session.commitTransaction();

    /* =====================
       7️⃣ AUDIT LOG
    ====================== */
    await writeAuditLog({
      db,
      userId: req?.user?._id,
      action: "PURCHASE_RETURN_CREATE",
      collection: COLLECTIONS.PURCHASE_RETURNS,
      documentId: insertResult.insertedId,
      referenceNo: returnNo,
      payload: {
        purchaseId,
        supplierId: purchase.supplierId,
        totalQty,
        totalAmount
      },
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      createdAt: nowDate()
    });

    return {
      returnNo,
      totalQty,
      totalAmount
    };

  } catch (error) {
    await session.abortTransaction();

    await writeAuditLog({
      db,
      userId: req?.user?._id,
      action: "PURCHASE_RETURN_FAILED",
      collection: COLLECTIONS.PURCHASE_RETURNS,
      referenceNo: returnNo || null,
      payload: { error: error.message },
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      createdAt: nowDate()
    });

    throw error;

  } finally {
    await session.endSession();
  }
};