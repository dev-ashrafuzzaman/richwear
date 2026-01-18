import { COLLECTIONS } from "./collections.js";

export const createIndexes = async (db) => {
  await db
    .collection(COLLECTIONS.BRANCHES)
    .createIndex({ code: 1 }, { unique: true });

  await db.collection(COLLECTIONS.BRANCHES).createIndex({ status: 1 });

await db.collection(COLLECTIONS.CATEGORIES).createIndex({ parentId: 1 });
await db.collection(COLLECTIONS.CATEGORIES).createIndex({ level: 1 });


  /* ===========================
     PRODUCTS
  ============================ */
  // Business rule: same product name cannot exist in same category
  await db
    .collection(COLLECTIONS.PRODUCTS)
    .createIndex({ name: 1, categoryId: 1 }, { unique: true });

  // SKU is core identity
  await db
    .collection(COLLECTIONS.PRODUCTS)
    .createIndex({ sku: 1 }, { unique: true });

  await db.collection(COLLECTIONS.PRODUCTS).createIndex({ categoryId: 1 });

  await db.collection(COLLECTIONS.PRODUCTS).createIndex({ status: 1 });

  /* ===========================
     VARIANTS
  ============================ */
  await db
    .collection(COLLECTIONS.VARIANTS)
    .createIndex({ sku: 1 }, { unique: true });

  await db
    .collection(COLLECTIONS.VARIANTS)
    .createIndex({ productId: 1, status: 1 });

  // attribute search optimization (size / color filter)
  await db
    .collection(COLLECTIONS.VARIANTS)
    .createIndex({ "attributes.size": 1 });

  await db
    .collection(COLLECTIONS.VARIANTS)
    .createIndex({ "attributes.color": 1 });

  /* ===========================
     STOCKS / INVENTORY
  ============================ */
  // One variant stock per branch
  await db
    .collection(COLLECTIONS.STOCKS)
    .createIndex({ branchId: 1, variantId: 1 }, { unique: true });

  await db.collection(COLLECTIONS.STOCKS).createIndex({ branchId: 1 });

  await db.collection(COLLECTIONS.STOCKS).createIndex({ variantId: 1 });

  /* ===========================
     PURCHASES
  ============================ */
  await db
    .collection(COLLECTIONS.PURCHASES)
    .createIndex({ purchaseNo: 1 }, { unique: true });

  await db.collection(COLLECTIONS.PURCHASES).createIndex({ branchId: 1 });

  await db.collection(COLLECTIONS.PURCHASES).createIndex({ supplierId: 1 });

  await db.collection(COLLECTIONS.PURCHASES).createIndex({ createdAt: -1 });

  /* ===========================
     SALES
  ============================ */
  await db
    .collection(COLLECTIONS.SALES)
    .createIndex({ invoiceNo: 1 }, { unique: true });

  await db.collection(COLLECTIONS.SALES).createIndex({ branchId: 1 });

  await db.collection(COLLECTIONS.SALES).createIndex({ customerId: 1 });

  await db.collection(COLLECTIONS.SALES).createIndex({ createdAt: -1 });

  /* ===========================
     CUSTOMERS
  ============================ */
  await db
    .collection(COLLECTIONS.CUSTOMERS)
    .createIndex({ phone: 1 }, { unique: true });

  await db.collection(COLLECTIONS.CUSTOMERS).createIndex({ status: 1 });

  await db.collection(COLLECTIONS.SUPPLIERS).createIndex(
  { "contacts.phone": 1 },
  { unique: true, sparse: true }
);

  /* ===========================
     USERS
  ============================ */
  await db
    .collection(COLLECTIONS.USERS)
    .createIndex({ email: 1 }, { unique: true });

  await db
    .collection(COLLECTIONS.USERS)
    .createIndex({ "branches.branchId": 1 });

  await db.collection(COLLECTIONS.USERS).createIndex({ status: 1 });
};
