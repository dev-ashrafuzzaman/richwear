import { ObjectId } from "mongodb";

export const calculateSaleCommission = async ({
  db,
  session,
  saleId,
  salesmanId,
  branchId,
  netAmount
}) => {
  if (!salesmanId) return null;

  /* ---- Validate Salesman ---- */
  const employee = await db.collection("employees").findOne(
    { _id: new ObjectId(salesmanId), status: "active" },
    { session }
  );

  if (!employee) return null;

  /* ---- Active Commission Rule ---- */
  const rule = await db.collection("commission_rules").findOne(
    { appliesTo: "SALE", status: "active" },
    { session }
  );

  if (!rule) return null;

  /* ---- Eligibility ---- */
  if (
    rule.eligibleRoles &&
    !rule.eligibleRoles.includes(employee.role)
  ) {
    return null;
  }

  /* ---- Base Amount ---- */
  const baseAmount =
    rule.base === "GROSS" ? netAmount : netAmount;

  /* ---- Calculate ---- */
  let commissionAmount = 0;

  if (rule.type === "PERCENT") {
    commissionAmount = (baseAmount * rule.value) / 100;
  } else {
    commissionAmount = rule.value;
  }

  commissionAmount = Number(commissionAmount.toFixed(2));

  /* ---- Save Ledger ---- */
  await db.collection("commission_ledgers").insertOne(
    {
      employeeId: employee._id,
      saleId,
      branchId,

      baseAmount,
      rate: rule.value,
      commissionAmount,

      status: "EARNED",
      source: "SALE",

      createdAt: new Date()
    },
    { session }
  );

  return commissionAmount;
};
