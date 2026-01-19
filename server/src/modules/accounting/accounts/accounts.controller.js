// modules/accounting/accounts/accounts.controller.js
import { ObjectId } from "mongodb";

export const createAccount = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

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
    const db = req.app.locals.db;

    const accounts = await db.collection("accounts")
      .find({})
      .sort({ code: 1 })
      .toArray();

    res.json({
      success: true,
      data: accounts
    });
  } catch (err) {
    next(err);
  }
};

export const updateAccount = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
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
