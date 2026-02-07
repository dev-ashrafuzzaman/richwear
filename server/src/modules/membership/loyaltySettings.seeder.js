// src/database/seeders/loyaltySettings.seeder.js
import { getDB } from "../db.js";

export async function seedLoyaltySettings() {
  const db = getDB();

  const DEFAULT_SETTINGS = {
    minActivationAmount: 2000,      // Membership activate
    minDailyPurchase: 1000,         // Loyalty count eligible
    requiredCount: 6,               // Steps to complete cycle
    maxRewardValue: 2000,            // Max flat discount
    rewardType: "FLAT",              // FLAT | PRODUCT
    resetMode: "AUTO",               // AUTO | MANUAL

    conflictRules: {
      allowWithProductDiscount: true,
      allowWithBillDiscount: false,
    },

    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection("loyalty_settings").updateOne(
    { status: "ACTIVE" },          // singleton rule
    {
      $set: DEFAULT_SETTINGS,
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  console.log("✅ Loyalty settings seeded");
}
