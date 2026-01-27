import { ObjectId } from "mongodb";

export const calculateSaleCommission = async ({
  db,
  session,
  saleId,
  salesmanId,
  branchId,
  netAmount
}) => {
  if (!salesmanId) return 0;

  const employee = await db.collection("employees").findOne(
    { _id: new ObjectId(salesmanId), status: "active" },
    { session }
  );
  if (!employee) return 0;

  const rule = await db.collection("commission_rules").findOne(
    { appliesTo: "SALE", status: "active" },
    { session }
  );
  if (!rule) return 0;

  if (
    rule.eligibleRoles &&
    !rule.eligibleRoles.includes(employee.employment.role)
  ) {
    return 0;
  }

  /* ---- Base Amount ---- */
  const baseAmount =
    rule.base === "NET" ? netAmount : netAmount; // future ready

  /* ---- Calculate ---- */
  let commissionAmount = 0;
  if (rule.type === "PERCENT") {
    commissionAmount = (baseAmount * rule.value) / 100;
  } else {
    commissionAmount = rule.value;
  }

  commissionAmount = Number(commissionAmount.toFixed(2));
  if (commissionAmount <= 0) return 0;

  const { insertedId } = await db.collection("commission_ledgers").insertOne(
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

  return {
    commissionId: insertedId,
    amount: commissionAmount
  };
};


export const reverseSaleCommission = async ({
  db,
  session,
  saleId,
  salesReturnId,
  returnRatio, // e.g. returnedAmount / sale.grandTotal
  branchId,
}) => {
  const ledger = await db.collection("commission_ledgers").findOne(
    { saleId, status: "EARNED" },
    { session }
  );

  if (!ledger) return 0;

  const reverseAmount = Number(
    (ledger.commissionAmount * returnRatio).toFixed(2)
  );

  if (reverseAmount <= 0) return 0;

  await db.collection("commission_ledgers").insertOne(
    {
      employeeId: ledger.employeeId,
      saleId,
      salesReturnId,
      branchId,
      baseAmount: ledger.baseAmount,
      rate: ledger.rate,
      commissionAmount: -reverseAmount,
      status: "REVERSED",
      source: "SALE_RETURN",
      createdAt: new Date(),
    },
    { session }
  );

  return reverseAmount;
};
