// modules/attributes/seed.attributes.js
import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../database/collections.js";

export const seedAttributes = async (db) => {
  /**
   * ⚠️ SYSTEM LOCKED ATTRIBUTE MASTER
   * Used for Product Variants (Size, Color)
   */

  await db.collection(COLLECTIONS.ATTRIBUTES).deleteMany({ isSystem: true });

  const attributes = [
    /* ======================
       SIZE ATTRIBUTES
    ====================== */
    { type: "size", name: "XS" },
    { type: "size", name: "S" },
    { type: "size", name: "M" },
    { type: "size", name: "L" },
    { type: "size", name: "XL" },
    { type: "size", name: "XXL" },

    /* ======================
       COLOR ATTRIBUTES
    ====================== */
    { type: "color", name: "RED" },
    { type: "color", name: "BLUE" },
    { type: "color", name: "BLACK" },
    { type: "color", name: "WHITE" },
    { type: "color", name: "GREEN" },
    { type: "color", name: "YELLOW" },
    { type: "color", name: "ORANGE" },
    { type: "color", name: "PURPLE" },
    { type: "color", name: "PINK" },
    { type: "color", name: "BROWN" },
    { type: "color", name: "GRAY" }
  ];

  const docs = attributes.map((attr) => ({
    _id: new ObjectId(),
    type: attr.type,          // size | color
    name: attr.name,          // M, RED, etc
    isSystem: true,           // 🔒 system locked
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await db.collection(COLLECTIONS.ATTRIBUTES).insertMany(docs);

  console.log("✅ Attribute Master (Size + Color) Seeded Successfully");
};
