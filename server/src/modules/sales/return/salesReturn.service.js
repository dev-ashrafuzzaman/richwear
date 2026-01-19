import { ObjectId } from "mongodb";
import { RETURN_STATUS } from "./salesReturn.constants.js";
import { nowDate } from "../../../utils/date.js";

export const createSalesReturnService = async ({
  db,
  saleId,
  payload,
  user,
}) => {
  const session = db.client.startSession();

  try {
    session.startTransaction();

    /* -------------------------------------------------
     * 1. Validate Sale
     * ------------------------------------------------- */
    const sale = await db.collection("sales").findOne(
      { _id: new ObjectId(saleId) },
      { session },
    );

    if (!sale) throw new Error("Sale not found");

    if (sale.status === "CANCELLED") {
      throw new Error("Cancelled sale cannot be returned");
    }

    /* -------------------------------------------------
     * 2. Fetch Sale Items
     * ------------------------------------------------- */
    const saleItems = await db
      .collection("sale_items")
      .find({ saleId: new ObjectId(saleId) })
      .toArray();

    const saleItemMap = {};
    saleItems.forEach((i) => (saleItemMap[i._id.toString()] = i));

    let totalRefund = 0;

    /* -------------------------------------------------
     * 3. Create Return Header
     * ------------------------------------------------- */
    const { insertedId: returnId } = await db
      .collection("sales_returns")
      .insertOne(
        {
          saleId: new ObjectId(saleId),
          invoiceNo: sale.invoiceNo,
          branchId: sale.branchId,
          refundMethod: payload.refundMethod,
          createdBy: new ObjectId(user._id),
          createdAt: nowDate(),
        },
        { session },
      );

    /* -------------------------------------------------
     * 4. Process Each Return Item
     * ------------------------------------------------- */
    for (const rItem of payload.items) {
      const saleItem = saleItemMap[rItem.saleItemId];

      if (!saleItem) {
        throw new Error("Invalid saleItemId");
      }

      if (rItem.qty > saleItem.qty) {
        throw new Error("Return qty exceeds sold qty");
      }

      const refundAmount =
        (saleItem.lineTotal / saleItem.qty) * rItem.qty;

      totalRefund += refundAmount;

      /* ---- Save return item ---- */
      await db.collection("sales_return_items").insertOne(
        {
          returnId,
          saleItemId: saleItem._id,
          productId: saleItem.productId,
          variantId: saleItem.variantId,
          sku: saleItem.sku,
          qty: rItem.qty,
          refundAmount,
          reason: rItem.reason || null,
          createdAt: nowDate(),
        },
        { session },
      );

      /* ---- Stock back ---- */
      await db.collection("stocks").updateOne(
        {
          branchId: sale.branchId,
          variantId: saleItem.variantId,
        },
        {
          $inc: { qty: rItem.qty },
          $set: { updatedAt: nowDate() },
        },
        { session },
      );

      /* ---- Stock Ledger ---- */
      await db.collection("stock_ledgers").insertOne(
        {
          branchId: sale.branchId,
          variantId: saleItem.variantId,
          sku: saleItem.sku,
          source: "SALE_RETURN",
          sourceId: returnId,
          qtyIn: rItem.qty,
          createdAt: nowDate(),
        },
        { session },
      );
    }

    /* -------------------------------------------------
     * 5. Update Sale Status
     * ------------------------------------------------- */
    const status =
      totalRefund >= sale.grandTotal
        ? RETURN_STATUS.FULL
        : RETURN_STATUS.PARTIAL;

    await db.collection("sales").updateOne(
      { _id: sale._id },
      {
        $set: {
          status: status === RETURN_STATUS.FULL ? "RETURNED" : "PARTIAL_RETURN",
          updatedAt: nowDate(),
        },
      },
      { session },
    );

    /* -------------------------------------------------
     * 6. Accounting Reverse Queue
     * ------------------------------------------------- */
    await db.collection("accounting_queue").insertOne(
      {
        source: "SALE_RETURN",
        sourceId: returnId,
        saleId: sale._id,
        amount: totalRefund,
        createdAt: nowDate(),
      },
      { session },
    );

    await session.commitTransaction();

    return {
      returnId,
      refundAmount: totalRefund,
      status,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
