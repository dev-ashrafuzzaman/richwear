import { ObjectId } from "mongodb";
import { RETURN_STATUS } from "./salesReturn.constants.js";
import {
  salesReturnAccounting,
  salesReturnCogsAccounting,
} from "../../accounting/accounting.adapter.js";
import { roundMoney } from "../../../utils/money.js";
import { writeAuditLog } from "../../../utils/logger.js";
import { COLLECTIONS } from "../../../database/collections.js";
import { restoreStockFIFO } from "../../inventory/restoreStockFIFO.js";
import { reverseSaleCommission } from "../commission.service.js";
import { createSaleService } from "../sales.service.js";
import { ensureObjectId } from "../../../utils/ensureObjectId.js";
import { resolveBranch } from "../../../utils/resolveBranch.js";
import { generateCode } from "../../../utils/codeGenerator.js";

export const createSalesReturnService = async ({
  db,
  saleId,
  payload,
  user,
  session: externalSession,
}) => {
  const session = externalSession || db.client.startSession();
  const ownSession = !externalSession;

  try {
    if (ownSession) session.startTransaction();

    /* ---------- NORMALIZE IDS ---------- */
    const saleObjectId = ensureObjectId(saleId, "saleId");
    const userId = ensureObjectId(user._id, "userId");

    /* ---------- LOAD SALE ---------- */
    const sale = await db
      .collection(COLLECTIONS.SALES)
      .findOne({ _id: saleObjectId }, { session });
    if (!sale) throw new Error("Sale not found");

    const branch = await resolveBranch({ db, user, session });
    const branchId = ensureObjectId(sale.branchId, "branchId");
    const customerId = ensureObjectId(sale.customerId, "customerId");

    const returnInvoiceNo = await generateCode({
      db,
      module: "SALES_RETURN",
      prefix: "SR",
      scope: "YEAR",
      branch: branch.code,
      padding: 5,
      session,
    });

    const saleItems = await db
      .collection(COLLECTIONS.SALE_ITEMS)
      .find({ saleId: sale._id }, { session })
      .toArray();

    const saleItemMap = new Map(
      saleItems.map((i) => [
        i._id.toString(),
        {
          ...i,
          _id: ensureObjectId(i._id),
          productId: ensureObjectId(i.productId),
          variantId: ensureObjectId(i.variantId),
        },
      ]),
    );

    let totalRefund = 0;
    let totalReturnQty = 0;
    let totalReturnCogs = 0;

    /* ---------- SALE STATUS ---------- */
    const status =
      totalRefund + (sale.returnedAmount || 0) >= sale.grandTotal
        ? RETURN_STATUS.FULL
        : RETURN_STATUS.PARTIAL;

    /* ---------- CREATE RETURN ---------- */
    const { insertedId: salesReturnId } = await db
      .collection(COLLECTIONS.SALES_RETURNS)
      .insertOne(
        {
          saleId: sale._id,
          invoiceNo: sale.invoiceNo,
          returnInvoiceNo,
          branchId,
          refundMethod: payload.refundMethod,
          createdBy: userId,
          refundAmount: totalRefund,
          status,
          createdAt: new Date(),
        },
        { session },
      );

    /* ---------- PROCESS ITEMS ---------- */
    for (const r of payload.items) {
      const saleItem = saleItemMap.get(r.saleItemId?.toString());
      if (!saleItem) throw new Error("Invalid saleItemId");

      const returnQty = Number(r.qty);
      if (returnQty <= 0) throw new Error("Invalid return qty");

      const unitPrice = roundMoney(saleItem.lineTotal / saleItem.qty);
      const refundAmount = roundMoney(unitPrice * returnQty);

      totalRefund += refundAmount;
      totalReturnQty += returnQty;

      await db.collection(COLLECTIONS.SALES_RETURN_ITEMS).insertOne(
        {
          salesReturnId,
          saleItemId: saleItem._id,
          productId: saleItem.productId,
          variantId: saleItem.variantId,
          sku: saleItem.sku,
          qty: returnQty,
          refundAmount,
          reason: r.reason || null,
          createdAt: new Date(),
        },
        { session },
      );

      /* ---------- FIFO RESTORE ---------- */
      const cogs = await restoreStockFIFO({
        db,
        session,
        branchId,
        variantId: saleItem.variantId,
        returnQty,
        salesReturnId,
      });

      totalReturnCogs += cogs;

      /* ---------- STOCK CACHE ---------- */
      await db
        .collection(COLLECTIONS.STOCKS)
        .updateOne(
          { branchId, variantId: saleItem.variantId },
          { $inc: { qty: returnQty }, $set: { updatedAt: new Date() } },
          { session },
        );
    }

    totalRefund = roundMoney(totalRefund);

    await db.collection(COLLECTIONS.SALES).updateOne(
      { _id: sale._id },
      {
        $set: { status, updatedAt: new Date() },
        $inc: { returnedAmount: totalRefund },
      },
      { session },
    );

    /* ---------- ACCOUNTING ---------- */
    await salesReturnAccounting({
      db,
      session,
      salesReturnId,
      returnAmount: totalRefund,
      dueAdjust: payload.refundMethod === "ADJUST_DUE" ? totalRefund : 0,
      customerId,
      branchId,
    });

    await salesReturnCogsAccounting({
      db,
      session,
      salesReturnId,
      cogsAmount: totalReturnCogs,
      branchId,
    });

    /* ---------- COMMISSION ---------- */
    const returnRatio = totalRefund / sale.grandTotal;

    await reverseSaleCommission({
      db,
      session,
      saleId: sale._id,
      salesReturnId,
      returnRatio,
      branchId,
    });

    /* ---------- AUDIT ---------- */
    await writeAuditLog({
      db,
      session,
      userId,
      action: "SALE_RETURN_CREATE",
      collection: COLLECTIONS.SALES_RETURNS,
      documentId: salesReturnId,
      refType: "SALE_RETURN",
      refId: salesReturnId,
      branchId,
      payload: {
        saleId: sale._id,
        refundAmount: totalRefund,
        returnQty: totalReturnQty,
        status,
      },
      status: "SUCCESS",
    });

    if (ownSession) await session.commitTransaction();

    return {
      salesReturnId,
      refundAmount: totalRefund,
      status,
      totalReturnCogs,
    };
  } catch (err) {
    if (ownSession) await session.abortTransaction();
    throw err;
  } finally {
    if (ownSession) session.endSession();
  }
};

export const createSalesExchangeService = async ({
  db,
  saleId,
  payload,
  user,
}) => {
  const session = db.client.startSession();

  try {
    session.startTransaction();

    /* ========= 1️⃣ SALES RETURN PART ========= */
    const returnResult = await createSalesReturnService({
      db,
      saleId,
      payload: {
        items: payload.returnItems,
        refundMethod: "ADJUST_DUE", // 🔥 no cash
      },
      user,
      session, // 🔥 reuse same transaction
    });

    const returnAmount = returnResult.refundAmount;

    /* ========= 2️⃣ NEW SALE PART ========= */
    const newSaleResult = await createSaleService({
      db,
      payload: payload.newSale,
      user,
      session,
      isExchange: true, // optional flag
    });

    const newSaleTotal = newSaleResult.data.summary.grandTotal;

    /* ========= 3️⃣ NET ADJUST ========= */
    const net = roundMoney(newSaleTotal - returnAmount);

    let settlement = null;

    if (net > 0) {
      settlement = {
        type: "CUSTOMER_PAY",
        amount: net,
      };
    } else if (net < 0) {
      settlement = {
        type: "STORE_CREDIT",
        amount: Math.abs(net),
      };

      await db.collection("store_credits").insertOne(
        {
          customerId: newSaleResult.data.customer.customerId,
          amount: Math.abs(net),
          source: "EXCHANGE",
          refSaleId: newSaleResult.data.sale.saleId,
          createdAt: new Date(),
        },
        { session },
      );
    } else {
      settlement = { type: "EVEN" };
    }

    await session.commitTransaction();

    return {
      success: true,
      message: "Exchange completed successfully",
      data: {
        return: returnResult,
        newSale: newSaleResult.data,
        settlement,
      },
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const getSalesReturns = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const { page = 1, limit = 20, branchId, from, to, status } = req.query;

    const match = {};

    /* ---------- Filters ---------- */
    if (branchId) {
      match.branchId = ensureObjectId(branchId, "branchId");
    }

    if (status) {
      match.status = status; // FULL | PARTIAL
    }

    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const data = await db
      .collection(COLLECTIONS.SALES_RETURNS)
      .aggregate([
        { $match: match },

        /* ---------- Minimal Projection ---------- */
        {
          $project: {
            _id: 1,
            returnInvoiceNo: 1,
            saleInvoiceNo: 1,
            refundAmount: 1,
            status: 1,
            branchId: 1,
            createdAt: 1,
            customerId: 1,
          },
        },

        /* ---------- Optional: customer name only ---------- */
        {
          $lookup: {
            from: COLLECTIONS.CUSTOMERS,
            localField: "customerId",
            foreignField: "_id",
            as: "customer",
          },
        },
        {
          $unwind: {
            path: "$customer",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            customerName: "$customer.name",
          },
        },
        {
          $project: {
            customer: 0,
          },
        },

        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: Number(limit) },
      ])
      .toArray();

    const total = await db
      .collection(COLLECTIONS.SALES_RETURNS)
      .countDocuments(match);

    res.json({
      success: true,
      data,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getSingleSalesReturn = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const salesReturnId = ensureObjectId(
      req.params.salesReturnId,
      "salesReturnId",
    );

    const data = await db
      .collection(COLLECTIONS.SALES_RETURNS)
      .aggregate([
        { $match: { _id: salesReturnId } },

        /* ---------- SALE ---------- */
        {
          $lookup: {
            from: COLLECTIONS.SALES,
            localField: "saleId",
            foreignField: "_id",
            as: "sale",
          },
        },
        { $unwind: "$sale" },

        /* ---------- CUSTOMER ---------- */
        {
          $lookup: {
            from: COLLECTIONS.CUSTOMERS,
            localField: "sale.customerId",
            foreignField: "_id",
            as: "customer",
          },
        },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },

        /* ---------- RETURN ITEMS ---------- */
        {
          $lookup: {
            from: COLLECTIONS.SALES_RETURN_ITEMS,
            localField: "_id",
            foreignField: "salesReturnId",
            as: "items",
          },
        },

        /* ---------- PRODUCT INFO ---------- */
        {
          $lookup: {
            from: COLLECTIONS.PRODUCTS,
            localField: "items.productId",
            foreignField: "_id",
            as: "products",
          },
        },

        /* ---------- SHAPE FOR PRINT ---------- */
        {
          $addFields: {
            refundAmount: "$refundAmount",
            originalInvoiceNo: "$sale.invoiceNo",
          },
        },
      ])
      .toArray();

    if (!data.length) {
      return res.status(404).json({
        success: false,
        message: "Sales return not found",
      });
    }

    res.json({
      success: true,
      data: data[0],
    });
  } catch (err) {
    next(err);
  }
};
