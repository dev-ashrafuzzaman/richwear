// membership.service.js
import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";
import { generateCode } from "../../utils/codeGenerator.js";
import { COLLECTIONS } from "../../database/collections.js";

export async function createMembership({
  customerId,
  branchId,
  userId,
  session,
}) {
  const db = getDB();

  // ❌ Prevent duplicate membership
  const existing = await db.collection(COLLECTIONS.MEMBERSHIPS).findOne(
    { customerId: new ObjectId(customerId) },
    { session }
  );
  const branch = await db.collection(COLLECTIONS.BRANCHES).findOne(
    { _id: new ObjectId(branchId) },
    { session }
  );

  if (existing) {
    throw new Error("Membership already exists");
  }

  // ✅ Generate unique membership code
  const memberCode = await generateCode({
    db,
    module: "MEMBERSHIP",
    prefix: "MEM",
    scope: "YEAR",
    branch: branch.code,
    session,
  });

  const doc = {
    customerId: new ObjectId(customerId),
    branchId: new ObjectId(branchId),
    memberCode,
    status: "PENDING",
    createdAt: new Date(),
    createdBy: new ObjectId(userId),
  };

  const res = await db
    .collection(COLLECTIONS.MEMBERSHIPS)
    .insertOne(doc, { session });

  return res.insertedId;
}

export async function getMemberships({
  branchId,
  search,
  page = 1,
  limit = 20,
}) {
  const db = getDB();

  const match = {};

  // Branch Manager → own branch
  if (branchId) {
    match.branchId = new ObjectId(branchId);
  }

  // Search (member code / customer phone / name)
  if (search) {
    match.$or = [
      { memberCode: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: match },

    /* 🔗 Join Customer */
    {
      $lookup: {
        from: "customers",
        localField: "customerId",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: "$customer" },

    /* 🔗 Join Branch */
    {
      $lookup: {
        from: "branches",
        localField: "branchId",
        foreignField: "_id",
        as: "branch",
      },
    },
    { $unwind: "$branch" },

    /* 📦 Shape Data */
    {
      $project: {
        _id: 1,
        code: "$memberCode",
        status: 1,
        createdAt: 1,

        name: "$customer.name",
        phone: "$customer.phone",
        address: "$customer.address",

        branchName: "$branch.name",
        branchCode: "$branch.code",
      },
    },

    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  const data = await db
    .collection(COLLECTIONS.MEMBERSHIPS)
    .aggregate(pipeline)
    .toArray();

  const total = await db
    .collection(COLLECTIONS.MEMBERSHIPS)
    .countDocuments(match);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}