import { ObjectId } from "mongodb";
import { generateCode } from "../../utils/codeGenerator.js";
import { SALE_STATUS } from "./sales.constants.js";

/**
 * Create Sale (POS / ERP)
 */
export const createSaleService = async ({ db, payload, user }) => {
  const session = db.client.startSession();

  try {
    session.startTransaction();

    /* -------------------------------------------------
     * 1. Validate Branch (inside transaction)
     * ------------------------------------------------- */
    const branch = await db.collection("branches").findOne(
      {
        _id: new ObjectId(payload.branchId),
        status: "active",
      },
      { session },
    );

    if (!branch) {
      throw new Error("Branch not found or inactive");
    }

    /* -------------------------------------------------
     * 2. Generate Invoice No (TRANSACTION SAFE)
     * ------------------------------------------------- */
    const invoiceNo = await generateCode({
      db,
      module: "SALE",
      prefix: "INV",
      scope: "YEAR",
      branch: branch.code,
      padding: 8,
      session, // 🔐 VERY IMPORTANT
    });

    /* -------------------------------------------------
     * 3. Calculate Items, Discount, Tax
     * ------------------------------------------------- */
    let subTotal = 0;
    let itemDiscount = 0;
    let taxAmount = 0;

    const saleItems = [];

    for (const item of payload.items) {
      const qty = Number(item.qty);
      const price = Number(item.salePrice);

      const baseAmount = qty * price;

      let discountAmount = 0;
      if (item.discountType === "PERCENT") {
        discountAmount = (baseAmount * item.discountValue) / 100;
      } else if (item.discountType === "FIXED") {
        discountAmount = item.discountValue;
      }

      const taxableAmount = baseAmount - discountAmount;
      const vat = taxableAmount * 0.05; // VAT 5%

      subTotal += baseAmount;
      itemDiscount += discountAmount;
      taxAmount += vat;

      saleItems.push({
        saleId: null, // will set later
        productId: new ObjectId(item.productId),
        variantId: new ObjectId(item.variantId),
        sku: item.sku,
        qty,
        salePrice: price,
        discountType: item.discountType || null,
        discountValue: item.discountValue || 0,
        discountAmount,
        taxAmount: vat,
        lineTotal: taxableAmount + vat,
        createdAt: new Date(),
      });
    }

    const billDiscount = payload.billDiscount || 0;

    const grandTotal =
      subTotal - itemDiscount - billDiscount + taxAmount;

    /* -------------------------------------------------
     * 4. Payment Calculation
     * ------------------------------------------------- */
    const paidAmount = payload.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    if (paidAmount > grandTotal) {
      throw new Error("Paid amount cannot exceed grand total");
    }

    const dueAmount = grandTotal - paidAmount;

    /* -------------------------------------------------
     * 5. Insert Sale
     * ------------------------------------------------- */
    const saleDoc = {
      invoiceNo,
      type: payload.type,
      branchId: new ObjectId(payload.branchId),
      customerId: payload.customerId
        ? new ObjectId(payload.customerId)
        : null,

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
      .collection("sales")
      .insertOne(saleDoc, { session });

    /* -------------------------------------------------
     * 6. Insert Sale Items
     * ------------------------------------------------- */
    await db.collection("sale_items").insertMany(
      saleItems.map((i) => ({
        ...i,
        saleId,
      })),
      { session },
    );

    /* -------------------------------------------------
     * 7. Insert Payments
     * ------------------------------------------------- */
    await db.collection("sale_payments").insertMany(
      payload.payments.map((p) => ({
        saleId,
        method: p.method,
        amount: Number(p.amount),
        reference: p.reference || null,
        receivedAt: new Date(),
      })),
      { session },
    );

    /* -------------------------------------------------
     * 8. Reduce Stock (Branch-wise)
     * ------------------------------------------------- */
    for (const item of payload.items) {
      const result = await db.collection("stocks").updateOne(
        {
          branchId: new ObjectId(payload.branchId),
          variantId: new ObjectId(item.variantId),
          qty: { $gte: item.qty }, // 🔐 no negative stock
        },
        {
          $inc: { qty: -item.qty },
          $set: { updatedAt: new Date() },
        },
        { session },
      );

      if (result.matchedCount === 0) {
        throw new Error(
          `Insufficient stock for SKU ${item.sku}`,
        );
      }

      /* Optional: Stock Ledger */
      await db.collection("stock_ledgers").insertOne(
        {
          branchId: new ObjectId(payload.branchId),
          variantId: new ObjectId(item.variantId),
          sku: item.sku,
          source: "SALE",
          sourceId: saleId,
          qtyOut: item.qty,
          createdAt: new Date(),
        },
        { session },
      );
    }

    /* -------------------------------------------------
     * 9. Accounting Queue (Async Posting)
     * ------------------------------------------------- */
    await db.collection("accounting_queue").insertOne(
      {
        source: "SALE",
        sourceId: saleId,
        invoiceNo,
        amount: grandTotal,
        createdAt: new Date(),
      },
      { session },
    );

    /* -------------------------------------------------
     * 10. Commit Transaction
     * ------------------------------------------------- */
    await session.commitTransaction();

    return {
      saleId,
      invoiceNo,
      grandTotal,
      paidAmount,
      dueAmount,
    };
  } catch (err) {
    await session.abortTransaction(); // 🔥 rollback counter + stock
    throw err;
  } finally {
    session.endSession();
  }
};
