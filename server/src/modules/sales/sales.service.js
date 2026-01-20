import { ObjectId } from "mongodb";
import { generateCode } from "../../utils/codeGenerator.js";
import { SALE_STATUS } from "./sales.constants.js";
import { salesAccounting } from "../accounting/accounting.adapter.js";
import { writeAuditLog } from "../../utils/logger.js";
import { calculateSaleCommission } from "./commission.service.js";
import { roundMoney } from "../../utils/money.js";
import { COLLECTIONS } from "../../database/collections.js";

export const createSaleService = async ({ db, payload, user }) => {
  const session = db.client.startSession();

  try {
    session.startTransaction();
    //   ---------------- Validation ---------------- */
    if (!payload.items?.length) {
      throw new Error("Sale must contain at least one item");
    }

    if (!payload.payments?.length) {
      throw new Error("At least one payment is required");
    }

    /* ---------------- Branch ---------------- */
    const branch = await db
      .collection(COLLECTIONS.BRANCHES)
      .findOne(
        { _id: new ObjectId(payload.branchId), status: "active" },
        { session },
      );

    if (!branch) {
      throw new Error("Branch not found or inactive");
    }

    /* ---------------- VAT ---------------- */
    const vatConfig = await db
      .collection(COLLECTIONS.TAX_CONFIGS)
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
    // ---------- Preload Variants (ONE QUERY) ----------
    const variantIds = payload.items.map((i) => new ObjectId(i.variantId));

    const variants = await db
      .collection(COLLECTIONS.VARIANTS)
      .find({ _id: { $in: variantIds }, status: "active" }, { session })
      .toArray();

    if (variants.length !== variantIds.length) {
      throw new Error("One or more variants are invalid or inactive");
    }

    const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));

    // ---------- Item Calculation ----------
    for (const item of payload.items) {
      const qty = Number(item.qty);
      const price = Number(item.salePrice);

      /* 🛡️ Quantity & Price Guard */
      if (qty <= 0) {
        throw new Error("Invalid quantity");
      }
      if (price < 0) {
        throw new Error("Invalid sale price");
      }

      const variant = variantMap.get(item.variantId);
      if (!variant) {
        throw new Error("Invalid variant");
      }

      const baseAmount = qty * price;

      /* 🎯 Discount Calculation */
      let discountAmount = 0;

      if (item.discountType === "PERCENT") {
        discountAmount = (baseAmount * Number(item.discountValue || 0)) / 100;
      } else if (item.discountType === "FIXED") {
        discountAmount = Number(item.discountValue || 0);
      }

      /* 🛡️ Discount Safety (cannot exceed base) */
      discountAmount = Math.min(discountAmount, baseAmount);

      const taxableAmount = baseAmount - discountAmount;

      /*  VAT with Controlled Rounding */
      const vat = roundMoney(taxableAmount * (vatRate / 100));

      subTotal += baseAmount;
      itemDiscount += discountAmount;
      taxAmount += vat;

      saleItems.push({
        saleId: null,
        productId: variant.productId,
        variantId: variant._id,
        sku: variant.sku,
        qty,
        salePrice: price,
        discountType: item.discountType || null,
        discountValue: item.discountValue || 0,
        discountAmount: roundMoney(discountAmount),
        taxAmount: vat,
        lineTotal: roundMoney(taxableAmount + vat),
        createdAt: new Date(),
      });
    }

    /* ---------------- Totals ---------------- */

    const billDiscount = roundMoney(payload.billDiscount) || 0;

    subTotal = roundMoney(subTotal);
    itemDiscount = roundMoney(itemDiscount);
    taxAmount = roundMoney(taxAmount);

    const grandTotal = roundMoney(
      subTotal - itemDiscount - billDiscount + taxAmount,
    );

    /* ---------------- Payments ---------------- */
    const paidAmount = roundMoney(
      payload.payments.reduce((sum, p) => sum + Number(p.amount), 0),
    );

    if (paidAmount > grandTotal) {
      throw new Error("Paid amount cannot exceed grand total");
    }

    const dueAmount = roundMoney(grandTotal - paidAmount);

    if (payload.type === "RETAIL" && dueAmount > 0) {
      throw new Error("RETAIL sale must be fully paid");
    }
    /* ---------------- Sale ---------------- */
    const saleDoc = {
      invoiceNo,
      salesmanId: payload.salesmanId,
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { insertedId: saleId } = await db
      .collection(COLLECTIONS.SALES)
      .insertOne(saleDoc, { session });

    /* ---------------- Sale Items ---------------- */
    await db.collection(COLLECTIONS.SALE_ITEMS).insertMany(
      saleItems.map((i) => ({ ...i, saleId })),
      { session },
    );

    /* ---------------- Payments ---------------- */
    await db.collection(COLLECTIONS.SALE_PAYMENTS).insertMany(
      payload.payments.map((p) => ({
        saleId,
        method: p.method,
        amount: Number(p.amount),
        reference: p.reference || null,
        receivedAt: new Date(),
      })),
      { session },
    );

    const stockOps = [];
    const stockLedgerDocs = [];

    /* ---------------- Stock ---------------- */
    const skuMap = new Map(
      saleItems.map((i) => [i.variantId.toString(), i.sku]),
    );

    for (const item of payload.items) {
      stockOps.push({
        updateOne: {
          filter: {
            branchId: branch._id,
            variantId: new ObjectId(item.variantId),
            qty: { $gte: item.qty },
          },
          update: {
            $inc: { qty: -item.qty },
            $set: { updatedAt: new Date() },
          },
        },
      });

      stockLedgerDocs.push({
        branchId: branch._id,
        variantId: new ObjectId(item.variantId),
        sku: skuMap.get(item.variantId),
        source: "SALE",
        sourceId: saleId,
        qtyOut: item.qty,
        createdAt: new Date(),
      });
    }

    const stockResult = await db
      .collection(COLLECTIONS.STOCKS)
      .bulkWrite(stockOps, { session });

    const insufficientStock = stockResult.matchedCount !== stockOps.length;

    if (insufficientStock) {
      throw new Error("Insufficient stock for one or more items");
    }

    await db
      .collection(COLLECTIONS.STOCK_LEDGERS)
      .insertMany(stockLedgerDocs, { session });

    /* ---------------- 🔥 ACCOUNTING ---------------- */
    await salesAccounting({
      db,
      session,
      saleId,
      total: grandTotal,
      payments: payload.payments,
      customerId: payload.customerId,
      branchId: branch._id,
      narration: `Sale Invoice ${invoiceNo}`,
    });

    /* ----------------TODO: Commission V0.1 ---------------- */
    const netTotal = roundMoney(subTotal - itemDiscount - billDiscount);
    let commissionAmount = 0;

    if (payload.salesmanId) {
      commissionAmount = await calculateSaleCommission({
        db,
        session,
        saleId,
        invoiceNo,
        salesmanId: payload.salesmanId,
        branchId: branch._id,
        netAmount: netTotal,
      });
    }

    await writeAuditLog({
      db,
      session,
      userId: user._id,
      action: "SALE_CREATE",
      collection: COLLECTIONS.SALES,
      documentId: saleId,
      refType: "SALE",
      refId: saleId,
      branchId: branch._id,
      payload: {
        invoiceNo,
        grandTotal,
        paidAmount,
        dueAmount,
        vatSummary: {
          rate: vatRate,
          amount: taxAmount,
        },
        discountTotal: itemDiscount + billDiscount,
        itemCount: saleItems.length,
        commissionAmount,
        salesmanId: payload.salesmanId,
      },
      ipAddress: user?.ip || null,
      userAgent: user?.userAgent || null,
      status: "SUCCESS",
    });

    await session.commitTransaction();

    return {
      success: true,
      message: "Sale completed successfully",

      data: {
        sale: {
          saleId,
          invoiceNo,
          type: payload.type,
          status: SALE_STATUS.COMPLETED,
          date: new Date(),
          createdBy: user.name || "ERP SYSTEM",
        },

        branch: {
          branchId: branch._id,
          code: branch.code,
          name: branch.name,
          phone: branch.phone || null,
          address: branch.address || null,
        },

        customer: payload.customerId
          ? {
              customerId: payload.customerId,
              name: payload.customerName || null,
              phone: payload.customerPhone || null,
              address: payload.customerAddress || null,
            }
          : {
              customerId: null,
              name: "Walk-in Customer",
              phone: null,
              address: null,
            },

        items: saleItems.map((i) => ({
          sku: i.sku,
          qty: i.qty,
          unitPrice: i.salePrice,
          discount: i.discountAmount,
          vat: i.taxAmount,
          lineTotal: i.lineTotal,
        })),

        summary: {
          subTotal,
          itemDiscount,
          billDiscount,
          taxAmount,
          grandTotal,
          paidAmount,
          dueAmount,
        },

        payments: payload.payments.map((p) => ({
          method: p.method,
          amount: p.amount,
          reference: p.reference || null,
        })),

        print: {
          currency: "BDT",
          vatRate,
          footerNote: "Thank you for shopping with us!",
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
