// modules/productTypes/seed.productTypes.js

export const seedProductTypes = async (db) => {
  /**
   * 🔒 SYSTEM MASTER: PRODUCT TYPES
   * TT (2-digit) code is IMMUTABLE
   * Used in SKU generation: TT + PPPP + VVV
   */

  // Optional: clear existing system types
  await db.collection("product_types").deleteMany({ isSystem: true });

  const types = [
    {
      name: "Garments",
      code: "01",
      description: "Clothing items with size/color variants",
    },
    {
      name: "Shoes",
      code: "02",
      description: "Footwear with numeric sizes",
    },
    {
      name: "Pants",
      code: "03",
      description: "Waist-size based bottoms",
    },
    {
      name: "Accessories",
      code: "04",
      description: "Non-size items like belt, bag, cap",
    },
  ];

  const docs = types.map((t) => ({
    name: t.name,
    code: t.code,              // 🔑 TT (2-digit)
    description: t.description,
    status: "active",
    isSystem: true,             // 🔒 locked master
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.collection("product_types").insertMany(docs);

  console.log("✅ Product Types Seeded Successfully");
};
