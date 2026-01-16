
export const generateCode = async ({
  db,
  scope,
  prefix
}) => {
  const result = await db.collection("counters").findOneAndUpdate(
    { _id: scope },
    { $inc: { seq: 1 } },
    {
      upsert: true,
      returnDocument: "after"
    }
  );

  const seq = String(result?.seq ?? 1).padStart(5, "0");

  return `${prefix}-${seq}`;
};
