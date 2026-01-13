import { COLLECTIONS } from "./collections.js";

export const createIndexes = async (db) => {
  // Branches
  await db
    .collection(COLLECTIONS.BRANCHES)
    .createIndex({ code: 1 }, { unique: true });
  await db.collection(COLLECTIONS.BRANCHES).createIndex({ name: 1 });
  await db.collection(COLLECTIONS.BRANCHES).createIndex({ status: 1 });
  
  // Products
  await db.collection(COLLECTIONS.PRODUCTS).createIndex({ name: 1 });

  // Variants
  await db
    .collection(COLLECTIONS.VARIANTS)
    .createIndex({ sku: 1 }, { unique: true });
  await db
    .collection(COLLECTIONS.VARIANTS)
    .createIndex({ barcode: 1 }, { unique: true });

  // Stocks
  await db
    .collection(COLLECTIONS.STOCKS)
    .createIndex({ variantId: 1, branchId: 1 }, { unique: true });

  // Sales
  await db
    .collection(COLLECTIONS.SALES)
    .createIndex({ invoiceNo: 1 }, { unique: true });
  await db.collection(COLLECTIONS.SALES).createIndex({ createdAt: -1 });

  // Customers
  await db
    .collection(COLLECTIONS.CUSTOMERS)
    .createIndex({ phone: 1 }, { unique: true });

  // Users
  await db
    .collection(COLLECTIONS.USERS)
    .createIndex({ email: 1 }, { unique: true });
};
