import { ObjectId } from "mongodb";
import { RETURN_STATUS } from "./salesReturn.constants.js";
import { salesReturnAccounting } from "../../accounting/accounting.adapter.js";
import { roundMoney } from "../../../utils/money.js";
import { writeAuditLog } from "../../../utils/logger.js";
import { COLLECTIONS } from "../../../database/collections.js";

export const createSalesReturnService = async ({
  db,
  saleId,
  payload,
  user,
}) => {
  const session = db.client.startSession();

  try {
    session.startTransaction();

    /* ===============================
       1️⃣ LOAD SALE
    =============================== */
    const sale = await db.collection(COLLECTIONS.SALES).findOne(
      { _id: new ObjectId(saleId) },
      { session },
    );

    if (!sale) throw new Error("Sale not found");
    if (["CANCELLED", "FULL_RETURN"].includes(sale.status)) {
      throw new Error("Sale cannot be returned");
    }

    /* ===============================
       2️⃣ LOAD SALE ITEMS
    =============================== */
    const saleItems = await db
      .collection(COLLECTIONS.SALE_ITEMS)
      .find({ saleId: sale._id }, { session })
      .toArray();

    const saleItemMap = new Map(
      saleItems.map((i) => [i._id.toString(), i]),
    );

    let totalRefund = 0;
    let totalReturnQty = 0;

    /* ===============================
       3️⃣ CREATE RETURN HEADER
    =============================== */
    const returnDoc = {
      saleId: sale._id,
      invoiceNo: sale.invoiceNo,
      branchId: sale.branchId,
      refundMethod: payload.refundMethod,
      createdBy: new ObjectId(user._id),
      createdAt: new Date(),
    };

    const { insertedId: salesReturnId } = await db
      .collection(COLLECTIONS.SALES_RETURNS)
      .insertOne(returnDoc, { session });

    /* ===============================
       4️⃣ PROCESS RETURN ITEMS
    =============================== */
    for (const rItem of payload.items) {
      const saleItem = saleItemMap.get(rItem.saleItemId);
      if (!saleItem) throw new Error("Invalid saleItemId");

      /* 🔒 Remaining qty check (multi-return safe) */
      const alreadyReturnedQty = await db
        .collection(COLLECTIONS.SALES_RETURN_ITEMS)
        .aggregate([
          { $match: { saleItemId: saleItem._id } },
          { $group: { _id: null, qty: { $sum: "$qty" } } },
        ])
        .toArray();

      const returnedQty = alreadyReturnedQty[0]?.qty || 0;
      const remainingQty = saleItem.qty - returnedQty;

      if (rItem.qty > remainingQty) {
        throw new Error(`Return qty exceeds remaining qty for SKU ${saleItem.sku}`);
      }

      const unitPrice = roundMoney(saleItem.lineTotal / saleItem.qty);
      const refundAmount = roundMoney(unitPrice * rItem.qty);

      totalRefund += refundAmount;
      totalReturnQty += rItem.qty;
      /* ---- Return Item ---- */
      await db.collection(COLLECTIONS.SALES_RETURN_ITEMS).insertOne(
        {
          salesReturnId,
          saleItemId: saleItem._id,
          productId: saleItem.productId,
          variantId: saleItem.variantId,
          sku: saleItem.sku,
          qty: rItem.qty,
          refundAmount,
          reason: rItem.reason || null,
          createdAt: new Date(),
        },
        { session },
      );

      /* ---- Stock Back ---- */
      await db.collection(COLLECTIONS.STOCKS).updateOne(
        {
          branchId: sale.branchId,
          variantId: saleItem.variantId,
        },
        {
          $inc: { qty: rItem.qty },
          $set: { updatedAt: new Date() },
        },
        { session },
      );

      /* ---- Stock Ledger ---- */
      await db.collection(COLLECTIONS.STOCK_LEDGERS).insertOne(
        {
          branchId: sale.branchId,
          variantId: saleItem.variantId,
          sku: saleItem.sku,
          source: "SALE_RETURN",
          sourceId: salesReturnId,
          qtyIn: rItem.qty,
          createdAt: new Date(),
        },
        { session },
      );
    }

    totalRefund = roundMoney(totalRefund);

    /* ===============================
       5️⃣ UPDATE SALE STATUS
    =============================== */
    const status =
      totalRefund + (sale.returnedAmount || 0) >= sale.grandTotal
        ? RETURN_STATUS.FULL
        : RETURN_STATUS.PARTIAL;

    await db.collection(COLLECTIONS.SALES).updateOne(
      { _id: sale._id },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
        $inc: {
          returnedAmount: totalRefund,
        },
      },
      { session },
    );

    /* ===============================
       6️⃣ ACCOUNTING
    =============================== */
    await salesReturnAccounting({
      db,
      session,
      salesReturnId,
      returnAmount: totalRefund,
      cashRefund: payload.refundMethod === "CASH" ? totalRefund : 0,
      dueAdjust: payload.refundMethod === "ADJUST_DUE" ? totalRefund : 0,
      customerId: sale.customerId,
      branchId: sale.branchId,
      narration: `Sales Return - ${sale.invoiceNo}`,
    });

    /* ===============================
       7️⃣ AUDIT LOG
    =============================== */
    await writeAuditLog({
      db,
      session,
      userId: user._id,
      action: "SALE_RETURN_CREATE",
      collection: COLLECTIONS.SALES_RETURNS,
      documentId: salesReturnId,
      refType: "SALE_RETURN",
      refId: salesReturnId,
      branchId: sale.branchId,
      payload: {
        saleId,
        invoiceNo: sale.invoiceNo,
        refundAmount: totalRefund,
        refundMethod: payload.refundMethod,
        itemCount: payload.items.length,
        totalReturnQty,
        status,
      },
      ipAddress: user.ip || null,
      userAgent: user.userAgent || null,
      status: "SUCCESS",
    });

    await session.commitTransaction();

    /* ===============================
       8️⃣ FINAL RESPONSE (REPRINT-READY)
    =============================== */
    return {
      success: true,
      message: "Sales return completed successfully",
      data: {
        salesReturnId,
        saleId,
        invoiceNo: sale.invoiceNo,
        refundAmount: totalRefund,
        refundMethod: payload.refundMethod,
        status,
        print: {
          currency: "BDT",
          note: "Returned items received in good condition",
        },
      },
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
