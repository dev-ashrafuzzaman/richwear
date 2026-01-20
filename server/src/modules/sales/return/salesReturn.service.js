import { ObjectId } from "mongodb";
import { RETURN_STATUS } from "./salesReturn.constants.js";
import { salesReturnAccounting } from "../../accounting/accounting.adapter.js";
import { roundMoney } from "../../../utils/money.js";

export const createSalesReturnService = async ({
  db,
  saleId,
  payload,
  user,
}) => {
  const session = db.client.startSession();

  try {
    session.startTransaction();

    /* -------------------- 1. Validate Sale -------------------- */
    const sale = await db
      .collection("sales")
      .findOne({ _id: new ObjectId(saleId) }, { session });

    if (!sale) throw new Error("Sale not found");
    if (sale.status === "CANCELLED") {
      throw new Error("Cancelled sale cannot be returned");
    }

    const saleItems = await db
      .collection("sale_items")
      .find({ saleId: sale._id })
      .toArray();

    const saleItemMap = {};
    saleItems.forEach((i) => (saleItemMap[i._id.toString()] = i));

    let totalRefund = 0;

    /* -------------------- 2. Create Return Header -------------------- */
    const returnDoc = {
      saleId: sale._id,
      invoiceNo: sale.invoiceNo,
      branchId: sale.branchId,
      refundMethod: payload.refundMethod,
      createdBy: new ObjectId(user._id),
      createdAt: new Date(),
    };

    const { insertedId } = await db
      .collection("sales_returns")
      .insertOne(returnDoc, { session });

    returnDoc._id = insertedId;

    /* -------------------- 3. Process Items -------------------- */
    for (const rItem of payload.items) {
      const saleItem = saleItemMap[rItem.saleItemId];
      if (!saleItem) throw new Error("Invalid saleItemId");

      if (rItem.qty > saleItem.qty) {
        throw new Error("Return qty exceeds sold qty");
      }

      const refundAmount = roundMoney(
        (saleItem.lineTotal / saleItem.qty) * rItem.qty,
      );

      totalRefund += refundAmount;

      await db.collection("sales_return_items").insertOne(
        {
          returnId: insertedId,
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

      /* Stock Back */
      await db.collection("stocks").updateOne(
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

      /* Stock Ledger */
      await db.collection("stock_ledgers").insertOne(
        {
          branchId: sale.branchId,
          variantId: saleItem.variantId,
          sku: saleItem.sku,
          source: "SALE_RETURN",
          sourceId: insertedId,
          qtyIn: rItem.qty,
          createdAt: new Date(),
        },
        { session },
      );
    }

    totalRefund = roundMoney(totalRefund);

    /* -------------------- 4. Update Sale Status -------------------- */
    const status =
      totalRefund >= sale.grandTotal
        ? RETURN_STATUS.FULL
        : RETURN_STATUS.PARTIAL;

    await db.collection("sales").updateOne(
      { _id: sale._id },
      {
        $set: {
          status: status === RETURN_STATUS.FULL ? "RETURNED" : "PARTIAL_RETURN",
          updatedAt: new Date(),
        },
      },
      { session },
    );

    /* -------------------- 5. Accounting Entry -------------------- */
    const cashRefund = payload.refundMethod === "CASH" ? totalRefund : 0;

    const dueAdjust = payload.refundMethod === "ADJUST_DUE" ? totalRefund : 0;

    await salesReturnAccounting({
      db,
      salesReturnId: insertedId,
      returnAmount: totalRefund,
      cashRefund,
      dueAdjust,
      accounts: {
        salesIncome: "SALES_INCOME",
        cash: "CASH",
        customer: sale.customerAccountId,
      },
      branchId: sale.branchId,
      session,
    });

    /* -------------------- 6. Audit Log -------------------- */
    await writeAuditLog({
      db,
      userId: user._id,
      action: "SALE_RETURN_CREATE",
      collection: "sales_returns",
      documentId: insertedId,
      refType: "SALE_RETURN",
      refId: insertedId,
      branchId: sale.branchId,
      payload: {
        saleId,
        refundAmount: totalRefund,
        refundMethod: payload.refundMethod,
      },
      ipAddress: user.ip || null,
      userAgent: user.userAgent || null,
      session,
    });

    await session.commitTransaction();

    return {
      returnId: insertedId,
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
