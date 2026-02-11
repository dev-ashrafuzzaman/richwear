// modules/accounting/accounts/accounts.controller.js
import { ObjectId } from "mongodb";
import { getDB } from "../../../config/db.js";

export const createAccount = async (req, res, next) => {
  try {
    const db = getDB();

    const exists = await db.collection("accounts").findOne({
      code: req.body.code
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Account code already exists"
      });
    }

    const account = await db.collection("accounts").insertOne({
      ...req.body,
      parentId: req.body.parentId
        ? new ObjectId(req.body.parentId)
        : null,
      isSystem: false, // ❗ only seed accounts are system
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: account
    });
  } catch (err) {
    next(err);
  }
};

export const getAllAccounts = async (req, res, next) => {
  try {
    const db = getDB();

    const {
      page = 1,
      limit = 20,
      search,
      type,
      subType,
      parentId,
      isSystem,
      branchId,
      code,
      level,
    } = req.query;

    const pageNo = Math.max(parseInt(page), 1);
    const limitNo = Math.min(parseInt(limit), 100);
    const skip = (pageNo - 1) * limitNo;

    const filter = {};

    /* ======================
       SEARCH (name + code)
    ====================== */
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    /* ======================
       FILTER BY TYPE
    ====================== */
    if (type) {
      filter.type = type;
    }

    /* ======================
       FILTER BY SUBTYPE
    ====================== */
    if (subType) {
      filter.subType = subType;
    }

    /* ======================
       FILTER BY CODE
    ====================== */
    if (code) {
      filter.code = code;
    }

    /* ======================
       FILTER BY PARENT
    ====================== */
    if (parentId) {
      filter.parentId = new ObjectId(parentId);
    }

    /* ======================
       FILTER BY SYSTEM
    ====================== */
    if (isSystem !== undefined) {
      filter.isSystem = isSystem === "true";
    }

    /* ======================
       FILTER BY BRANCH
    ====================== */
    if (branchId === "null") {
      filter.branchId = null;
    } else if (branchId) {
      filter.branchId = new ObjectId(branchId);
    }

    /* ======================
       LEAF LEVEL ONLY
       (No children)
    ====================== */
    if (level === "leaf") {
      const parentIds = await db.collection("accounts")
        .distinct("parentId");

      filter._id = { $nin: parentIds.filter(Boolean) };
    }

    const total = await db.collection("accounts").countDocuments(filter);

    const data = await db.collection("accounts")
      .find(filter)
      .sort({ code: 1 })
      .skip(skip)
      .limit(limitNo)
      .toArray();

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNo,
        limit: limitNo,
        total,
        hasMore: skip + data.length < total,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateAccount = async (req, res, next) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const account = await db.collection("accounts").findOne({
      _id: new ObjectId(id)
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    if (account.isSystem) {
      return res.status(403).json({
        success: false,
        message: "System account cannot be modified"
      });
    }

    await db.collection("accounts").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...req.body,
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: "Account updated"
    });
  } catch (err) {
    next(err);
  }
};
