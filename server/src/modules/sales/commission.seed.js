export const seedcommissionRules = async (db) => {
  await db.collection("commission_rules").insertOne({
    appliesTo: "SALE",
    type: "PERCENT",
    value: 5,
    base: "NET",
    eligibleRoles: ["SALESMAN"],
    minSaleAmount: 0,
    maxSaleAmount: null,
    status: "active",
    createdAt: new Date(),
  });

  console.log("✅ Commission Rules Seeded Successfully");
};
