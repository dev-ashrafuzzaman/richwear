import { ObjectId } from "mongodb";

/* ---------- Helpers ---------- */
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatTime = (d) =>
  new Date(d).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const formatBalance = (v) => ({
  amount: Math.abs(v),
  type: v >= 0 ? "DR" : "CR",
});

/* ---------- MAIN ---------- */
export const partyStatementReport = async ({
  db,
  partyId,
  fromDate,
  toDate,
  branchId,
  user,
}) => {
  const partyObjectId = new ObjectId(partyId);

  /* ---------- USERS ---------- */
  const userInfo = await db
    .collection("users")
    .findOne({ _id: new ObjectId(user.id) });
  /* ---------- PARTY ---------- */
  const party = await db
    .collection("suppliers")
    .findOne(
      { _id: partyObjectId },
      { projection: { name: 1, code: 1, contact: 1 } },
    );

  /* ---------- OPENING BALANCE ---------- */
  let openingBalance = 0;

  if (fromDate) {
    const openingAgg = await db
      .collection("ledgers")
      .aggregate([
        {
          $match: {
            partyId: partyObjectId,
            ...(branchId && { branchId: new ObjectId(branchId) }),
            date: { $lt: new Date(fromDate) },
          },
        },
        {
          $group: {
            _id: null,
            balance: { $sum: { $subtract: ["$debit", "$credit"] } },
          },
        },
      ])
      .toArray();

    openingBalance = openingAgg[0]?.balance || 0;
  }

  let runningBalance = openingBalance;

  /* ---------- ROW MATCH ---------- */
  const match = {
    partyId: partyObjectId,
    ...(branchId && { branchId: new ObjectId(branchId) }),
  };

  if (fromDate || toDate) {
    match.date = {};
    if (fromDate) match.date.$gte = new Date(fromDate);
    if (toDate) match.date.$lte = new Date(toDate);
  }

  /* ---------- ROWS ---------- */
  const rows = await db
    .collection("ledgers")
    .find(match)
    .sort({ date: 1, createdAt: 1 })
    .toArray();

  let totalDebit = 0;
  let totalCredit = 0;

  const statementRows = rows.map((r, i) => {
    totalDebit += r.debit || 0;
    totalCredit += r.credit || 0;

    runningBalance += (r.debit || 0) - (r.credit || 0);

    return {
      sl: i + 1,
      date: formatDate(r.date),
      time: formatTime(r.date),
      voucherType: r.refType,
      voucherNo: r.narration,
      description: r.narration,
      debit: r.debit || 0,
      credit: r.credit || 0,
      runningBalance: formatBalance(runningBalance),
    };
  });

  /* ---------- FINAL ---------- */
  return {
    success: true,

    meta: {
      statementType: "PARTY_STATEMENT",
      printable: true,
      generatedAt: new Date().toLocaleString("en-GB"),
      generatedBy: {
        id: userInfo?._id || null,
        name: userInfo?.name || "System",
      },
      currency: "BDT",
      timezone: "Asia/Dhaka",
    },

    party: {
      partyType: "SUPPLIER",
      partyId,
      code: party?.code,
      name: party?.name,
      contact: party?.contact,
    },

    period: {
      from: fromDate ? formatDate(fromDate) : "Beginning",
      to: toDate ? formatDate(toDate) : "Till Date",
    },

    summary: {
      openingBalance: formatBalance(openingBalance),
      totalDebit,
      totalCredit,
      closingBalance: formatBalance(runningBalance),
    },

    rows: statementRows,

    footer: {
      note: "System generated statement. No signature required.",
      preparedBy: "ERP Accounting Engine",
    },
  };
};
