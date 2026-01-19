import { ObjectId } from "mongodb";
import { nowDate } from "../../../utils/date.js";

export const reprintSaleService = async ({
  db,
  saleId,
  invoiceNo,
}) => {
  /* ---------------- Sale ---------------- */
  const saleQuery = saleId
    ? { _id: new ObjectId(saleId) }
    : { invoiceNo };

  const sale = await db.collection("sales").findOne(saleQuery);

  if (!sale) {
    throw new Error("Sale not found");
  }

  /* ---------------- Branch ---------------- */
  const branch = await db.collection("branches").findOne({
    _id: sale.branchId,
  });

  /* ---------------- Customer ---------------- */
  let customer = null;
  if (sale.customerId) {
    customer = await db.collection("customers").findOne({
      _id: sale.customerId,
    });
  }

  /* ---------------- Items ---------------- */
  const items = await db
    .collection("sale_items")
    .find({ saleId: sale._id })
    .toArray();

  /* ---------------- Payments ---------------- */
  const payments = await db
    .collection("sale_payments")
    .find({ saleId: sale._id })
    .toArray();

  /* ---------------- VAT ---------------- */
  const vatConfig = await db.collection("tax_configs").findOne({
    appliesTo: "SALE",
    status: "active",
  });
  const vatRate = vatConfig ? Number(vatConfig.rate) : 0;

  /* =================================================
   * 🔥 FINAL RESPONSE (SAME AS CREATE)
   * ================================================= */
  return {
    success: true,
    message: "Sales invoice reprint",

    data: {
      sale: {
        saleId: sale._id,
        invoiceNo: sale.invoiceNo,
        type: sale.type,
        status: sale.status,
        date: sale.createdAt,
      },

      branch: {
        branchId: branch?._id || null,
        code: branch?.code || null,
        name: branch?.name || null,
        phone: branch?.phone || null,
        address: branch?.address || null,
      },

      customer: customer
        ? {
            customerId: customer._id,
            name: customer.name,
            phone: customer.phone || null,
            address: customer.address || null,
          }
        : {
            customerId: null,
            name: "Walk-in Customer",
            phone: null,
            address: null,
          },

      items: items.map((i) => ({
        sku: i.sku,
        qty: i.qty,
        unitPrice: i.salePrice,
        discount: i.discountAmount,
        vat: i.taxAmount,
        lineTotal: i.lineTotal,
      })),

      summary: {
        subTotal: sale.subTotal,
        itemDiscount: sale.itemDiscount,
        billDiscount: sale.billDiscount,
        taxAmount: sale.taxAmount,
        grandTotal: sale.grandTotal,
        paidAmount: sale.paidAmount,
        dueAmount: sale.dueAmount,
      },

      payments: payments.map((p) => ({
        method: p.method,
        amount: p.amount,
        reference: p.reference || null,
      })),

      print: {
        currency: "BDT",
        vatRate,
        footerNote: "Thank you for shopping with us!",
        printedAt: nowDate(),
      },
    },
  };
};
