export const salesIndexes = async (db) => {
  await db.collection("sales").createIndexes([
    { key: { invoiceNo: 1 }, unique: true },
    { key: { branchId: 1, createdAt: -1 } },
    { key: { customerId: 1 } },
  ]);

  await db.collection("sale_items").createIndex({ saleId: 1 });
  await db.collection("sale_payments").createIndex({ saleId: 1 });
};
