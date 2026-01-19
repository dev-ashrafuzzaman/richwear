import { ObjectId } from "mongodb";
import { generateCode } from "../../utils/codeGenerator.js";
import { SALE_STATUS } from "./sales.constants.js";
import { nowDate } from "../../utils/date.js";
import { salesAccounting } from "../accounting/accounting.adapter.js";
import { writeAuditLog } from "../../utils/logger.js";

export const createSaleService = async ({ db, payload, user, accounts }) => {
  const session = db.client.startSession();

  try {
    session.startTransaction();

    /* ---------------- Branch ---------------- */
    const branch = await db
      .collection("branches")
      .findOne(
        { _id: new ObjectId(payload.branchId), status: "active" },
        { session },
      );

    if (!branch) {
      throw new Error("Branch not found or inactive");
    }

    /* ---------------- VAT ---------------- */
    const vatConfig = await db
      .collection("tax_configs")
      .findOne({ appliesTo: "SALE", status: "active" }, { session });
    const vatRate = vatConfig ? Number(vatConfig.rate) : 0;

    /* ---------------- Invoice ---------------- */
    const invoiceNo = await generateCode({
      db,
      module: "SALE",
      prefix: "INV",
      scope: "YEAR",
      branch: branch.code,
      padding: 8,
      session,
    });

    let subTotal = 0;
    let itemDiscount = 0;
    let taxAmount = 0;

    const saleItems = [];

    /* ---------------- Items ---------------- */
    for (const item of payload.items) {
      const qty = Number(item.qty);
      const price = Number(item.salePrice);

      const variant = await db
        .collection("variants")
        .findOne(
          { _id: new ObjectId(item.variantId), status: "active" },
          { session },
        );

      if (!variant) {
        throw new Error("Invalid variant");
      }

      const baseAmount = qty * price;

      let discountAmount = 0;
      if (item.discountType === "PERCENT") {
        discountAmount = (baseAmount * Number(item.discountValue || 0)) / 100;
      } else if (item.discountType === "FIXED") {
        discountAmount = Number(item.discountValue || 0);
      }

      const taxableAmount = baseAmount - discountAmount;
      const vat = taxableAmount * (vatRate / 100);

      subTotal += baseAmount;
      itemDiscount += discountAmount;
      taxAmount += vat;

      saleItems.push({
        saleId: null,
        productId: variant.productId,
        variantId: variant._id,
        sku: variant.sku, // ✅ backend resolved
        qty,
        salePrice: price,
        discountType: item.discountType || null,
        discountValue: item.discountValue || 0,
        discountAmount,
        taxAmount: vat,
        lineTotal: taxableAmount + vat,
        createdAt: nowDate(),
      });
    }

    const billDiscount = Number(payload.billDiscount || 0);
    const grandTotal = subTotal - itemDiscount - billDiscount + taxAmount;

    /* ---------------- Payments ---------------- */
    const paidAmount = payload.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    if (paidAmount > grandTotal) {
      throw new Error("Paid amount cannot exceed grand total");
    }

    const dueAmount = grandTotal - paidAmount;

    /* ---------------- Sale ---------------- */
    const saleDoc = {
      invoiceNo,
      type: payload.type,
      branchId: branch._id,
      customerId: payload.customerId ? new ObjectId(payload.customerId) : null,

      subTotal,
      itemDiscount,
      billDiscount,
      taxAmount,
      grandTotal,
      paidAmount,
      dueAmount,

      status: SALE_STATUS.COMPLETED,
      createdBy: new ObjectId(user._id),
      createdAt: nowDate(),
      updatedAt: nowDate(),
    };

    const { insertedId: saleId } = await db
      .collection("sales")
      .insertOne(saleDoc, { session });

    /* ---------------- Sale Items ---------------- */
    await db.collection("sale_items").insertMany(
      saleItems.map((i) => ({ ...i, saleId })),
      { session },
    );

    /* ---------------- Payments ---------------- */
    await db.collection("sale_payments").insertMany(
      payload.payments.map((p) => ({
        saleId,
        method: p.method,
        amount: Number(p.amount),
        reference: p.reference || null,
        receivedAt: nowDate(),
      })),
      { session },
    );

    /* ---------------- Stock ---------------- */
    for (const item of payload.items) {
      const result = await db.collection("stocks").updateOne(
        {
          branchId: branch._id,
          variantId: new ObjectId(item.variantId),
          qty: { $gte: item.qty },
        },
        { $inc: { qty: -item.qty }, $set: { updatedAt: nowDate() } },
        { session },
      );

      if (!result.matchedCount) {
        throw new Error("Insufficient stock");
      }

      await db.collection("stock_ledgers").insertOne(
        {
          branchId: branch._id,
          variantId: new ObjectId(item.variantId),
          sku: saleItems.find((si) => si.variantId.equals(item.variantId))?.sku,
          source: "SALE",
          sourceId: saleId,
          qtyOut: item.qty,
          createdAt: nowDate(),
        },
        { session },
      );
    }

    /* ---------------- 🔥 ACCOUNTING ---------------- */
    await salesAccounting({
      db,
      session,
      saleId,
      total: grandTotal,
      cash: paidAmount - dueAmount,
      due: dueAmount,
      accounts: {
        cash: accounts.CASH,
        customer: payload.customerAccountId,
        salesIncome: accounts.SALES_INCOME,
      },
      branchId: branch._id,
    });

    await writeAuditLog({
      db,
      userId: user._id,
      action: "SALE_CREATE",
      collection: "sales",
      documentId: saleId,
      refType: "SALE",
      refId: saleId,
      branchId: branch._id,
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
      saleId,
      invoiceNo,
      grandTotal,
      paidAmount,
      dueAmount,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
