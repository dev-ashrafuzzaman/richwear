import { toObjectId } from "../../utils/safeObjectId.js";
import { generateCode } from "../../utils/codeGenerator.js";
import { nowDate } from "../../utils/date.js";
import { writeAuditLog } from "../../utils/logger.js";
import { COLLECTIONS } from "../../database/collections.js";
import { getMainBranch } from "../../utils/getMainWarehouse.js";
import {
  purchaseAccounting,
  purchaseReturnAccounting,
} from "../accounting/accounting.adapter.js";
import { roundMoney } from "../../utils/money.js";

export const createPurchase = async ({ db, body, req }) => {
  const session = db.client.startSession();

  let purchaseNo;
  let totalQty = 0;
  let totalAmount = 0;
  let mainBranch;

  try {
    session.startTransaction();

    /* =====================
       1️⃣ MAIN WAREHOUSE
    ====================== */
    mainBranch = await getMainBranch(db, session);
    const branchId = mainBranch._id;

    /* =====================
       2️⃣ CORE DATA
    ====================== */
    const supplierId = toObjectId(body.supplierId, "supplierId");
    const paidAmount = Number(body.paidAmount || 0);

    /* =====================
       3️⃣ PURCHASE NO
    ====================== */
    purchaseNo = await generateCode({
      db,
      module: "PURCHASE",
      prefix: "PUR",
      scope: "YEAR",
      branch: mainBranch.code,
      session,
    });

    /* =====================
       4️⃣ ITEM LOOP
    ====================== */
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
            avgCost: roundMoney(item.costPrice),
            createdAt: nowDate(),
          },
          { session },
        );
      } else {
        const newQty = stock.qty + item.qty;
        const newAvg =
          (stock.qty * stock.avgCost + item.qty * item.costPrice) / newQty;
        const roundedAvg = roundMoney(newAvg);
        await db.collection(COLLECTIONS.STOCKS).updateOne(
          { _id: stock._id },
          {
            $set: {
              qty: newQty,
              avgCost: roundedAvg,
              updatedAt: nowDate(),
            },
          },
          { session },
        );
      }

      /* ---------- SALE PRICE UPDATE ---------- */
      if (item.salePrice && item.salePrice !== variant.salePrice) {
        await db.collection(COLLECTIONS.VARIANTS).updateOne(
          { _id: variantId },
          {
            $set: {
              salePrice: item.salePrice,
              updatedAt: nowDate(),
            },
            $push: {
              priceHistory: {
                oldPrice: variant.salePrice,
                newPrice: item.salePrice,
                source: "PURCHASE",
                date: nowDate(),
              },
            },
          },
          { session },
        );
      }

      totalQty += item.qty;
      totalAmount += item.qty * item.costPrice;
    }

    totalAmount = roundMoney(totalAmount);

    /* =====================
       5️⃣ PAYMENT CALCULATION
    ====================== */
    const dueAmount = roundMoney(Math.max(totalAmount - paidAmount, 0), 2);

    const paidRounded = roundMoney(paidAmount, 2);

    const paymentStatus =
      dueAmount === 0 ? "PAID" : paidRounded > 0 ? "PARTIAL" : "DUE";

    /* =====================
       6️⃣ PURCHASE INSERT
    ====================== */
    const insertResult = await db.collection(COLLECTIONS.PURCHASES).insertOne(
      {
        purchaseNo,
        supplierId,
        branchId,

        invoiceNumber: body.invoiceNumber,
        invoiceDate: body.invoiceDate,

        items: body.items,
        totalQty,
        totalAmount,

        paidAmount,
        dueAmount,
        paymentStatus,

        notes: body.notes || null,
        createdAt: nowDate(),
      },
      { session },
    );

    /* =====================
       7️⃣ ACCOUNTING (TX SAFE)
    ====================== */
    await purchaseAccounting({
      db,
      session,
      purchaseId: insertResult.insertedId,
      totalAmount,
      cashPaid: paidAmount,
      dueAmount,
      supplierId,
      branchId,
      narration: `Purchase #${purchaseNo}`,
    });

    /* =====================
       8️⃣ AUDIT LOG
    ====================== */
    await writeAuditLog({
      db,
      session,
      userId: toObjectId(req?.user?.id),
      action: "PURCHASE_CREATE",
      collection: COLLECTIONS.PURCHASES,
      documentId: insertResult.insertedId,
      referenceNo: purchaseNo,
      payload: {
        branch: mainBranch.code,
        supplierId,
        totalQty,
        totalAmount,
        paidAmount,
        dueAmount,
      },
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      createdAt: nowDate(),
    });

    await session.commitTransaction();

    return {
      purchaseNo,
      branch: mainBranch.code,
      invoiceNumber: body.invoiceNumber,
      totalQty,
      totalAmount,
      paidAmount,
      dueAmount,
    };
  } catch (error) {
    await session.abortTransaction();
    await writeAuditLog({
      db,
      userId: toObjectId(req?.user?.id),
      action: "PURCHASE_CREATE_FAILED",
      collection: COLLECTIONS.PURCHASES,
      referenceNo: purchaseNo || null,
      payload: { error: error.message },
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      createdAt: nowDate(),
      status: "ERROR",
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

    /* =====================
       1️⃣ MAIN BRANCH
    ====================== */
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
      session,
    });

    /* =====================
       4️⃣ ITEM LOOP
    ====================== */
    for (const item of body.items) {
      const variantId = toObjectId(item.variantId, "variantId");

      const purchaseItem = purchase.items.find(
        (i) => i.variantId.toString() === variantId.toString(),
      );

      if (!purchaseItem) {
        throw new Error("Variant not found in purchase");
      }

      if (item.qty <= 0 || item.qty > purchaseItem.qty) {
        throw new Error("Invalid return quantity");
      }

      /* ---------- STOCK CHECK ---------- */
      const stock = await db
        .collection(COLLECTIONS.STOCKS)
        .findOne({ branchId, variantId }, { session });

      if (!stock || stock.qty < item.qty) {
        throw new Error("Insufficient stock for return");
      }

      /* ---------- STOCK UPDATE ---------- */
      await db.collection(COLLECTIONS.STOCKS).updateOne(
        { _id: stock._id },
        {
          $inc: { qty: -item.qty },
          $set: { updatedAt: nowDate() },
        },
        { session },
      );

      totalQty += item.qty;
      totalAmount += item.qty * purchaseItem.costPrice;
    }

    totalAmount = roundMoney(totalAmount);

    /* =====================
       5️⃣ PURCHASE RETURN INSERT
    ====================== */
    const insertResult = await db
      .collection(COLLECTIONS.PURCHASE_RETURNS)
      .insertOne(
        {
          returnNo,
          purchaseId,
          supplierId: purchase.supplierId,
          branchId,

          returnDate: body.returnDate || nowDate(),
          reason: body.reason || null,

          items: body.items,
          totalQty,
          totalAmount,

          createdAt: nowDate(),
        },
        { session },
      );

    /* =====================
       6️⃣ PURCHASE BALANCE UPDATE
    ====================== */
    const newTotalAmount = roundMoney(
      Math.max(purchase.totalAmount - totalAmount, 0),
    );

    const newDueAmount = roundMoney(
      Math.max(newTotalAmount - purchase.paidAmount, 0),
    );

    const newPaymentStatus =
      newDueAmount === 0 ? "PAID" : purchase.paidAmount > 0 ? "PARTIAL" : "DUE";

    await db.collection(COLLECTIONS.PURCHASES).updateOne(
      { _id: purchaseId },
      {
        $set: {
          totalAmount: newTotalAmount,
          dueAmount: newDueAmount,
          paymentStatus: newPaymentStatus,
          updatedAt: nowDate(),
        },
      },
      { session },
    );

    /* =====================
       7️⃣ ACCOUNTING (TX SAFE)
    ====================== */
    await purchaseReturnAccounting({
      db,
      session,
      purchaseReturnId: insertResult.insertedId,
      returnAmount: totalAmount,
      cashRefund: body.cashRefund || 0,
      dueAdjust: body.dueAdjust || totalAmount,
      supplierAccountId: purchase.supplierId,
      branchId,
    });

    /* =====================
       8️⃣ AUDIT LOG
    ====================== */
    await writeAuditLog({
      db,
      session,
      userId: toObjectId(req?.user?.id),
      action: "PURCHASE_RETURN_CREATE",
      collection: COLLECTIONS.PURCHASE_RETURNS,
      documentId: insertResult.insertedId,
      referenceNo: returnNo,
      payload: {
        purchaseId,
        supplierId: purchase.supplierId,
        totalQty,
        totalAmount,
      },
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      createdAt: nowDate(),
    });

    await session.commitTransaction();

    return {
      returnNo,
      purchaseId,
      totalQty,
      totalAmount,
      branch: mainBranch.code,
    };
  } catch (error) {
    await session.abortTransaction();

    await writeAuditLog({
      db,
      userId: toObjectId(req?.user?.id),
      action: "PURCHASE_RETURN_FAILED",
      collection: COLLECTIONS.PURCHASE_RETURNS,
      referenceNo: returnNo || null,
      payload: { error: error.message },
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      createdAt: nowDate(),
      status: "ERROR",
    });

    throw error;
  } finally {
    await session.endSession();
  }
};
