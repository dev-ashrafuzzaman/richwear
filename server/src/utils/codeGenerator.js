
export const generateCode = async ({
  db,
  module,           // CUSTOMER | SUPPLIER | PRODUCT | SALE | PURCHASE
  prefix,           // CUS | SUP | PRD | SAL | PUR
  padding = 5,      // 00001
  scope = "NONE",   // YEAR | MONTH | NONE
  branch = null     // DHK | CTG | null
}) => {

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  let counterKey = module;

  if (scope === "YEAR") counterKey += `:${year}`;
  if (scope === "MONTH") counterKey += `:${year}${month}`;
  if (branch) counterKey += `:${branch}`;

  const result = await db.collection("counters").findOneAndUpdate(
    { _id: counterKey },
    {
      $inc: { seq: 1 },
      $setOnInsert: {
        createdAt: new Date(),
        module,
        year,
        month,
        branch
      }
    },
    { upsert: true, returnDocument: "after" }
  );

  const seq = String(result.seq).padStart(padding, "0");

  let code = prefix;

  if (branch) code += `-${branch}`;
  if (scope === "YEAR") code += `-${year}`;
  if (scope === "MONTH") code += `-${year}${month}`;

  code += `-${seq}`;

  return code;
};