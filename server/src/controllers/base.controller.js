import { ObjectId } from "mongodb";
import { writeAuditLog } from "../utils/logger.js";
import { formatDocuments } from "../utils/formatedDocument.js";


export const createOne = ({ collection, schema }) => {
  return async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const { error, value } = schema.validate(req.body);
      if (error) throw error;

      const doc = {
        ...value,
        ...(req.generated || {}),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection(collection).insertOne(doc);

      await writeAuditLog({
        db,
        userId: req.user?._id,
        action: "CREATE",
        collection,
        documentId: result.insertedId,
        payload: doc,
      });

      res.status(201).json({
        success: true,
        data: { _id: result.insertedId },
      });
    } catch (err) {
      next(err);
    }
  };
};

export const getAll = ({
  collection,
  searchableFields = [],
  filterableFields = [],
  projection = {},
  dateFields = ["createdAt", "updatedAt"],
}) => {
  return async (req, res, next) => {
    try {
      const db = req.app.locals.db;

      /* ---------- Pagination ---------- */
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const skip = (page - 1) * limit;

      /* ---------- Sorting ---------- */
      const sortField = req.query.sortBy || "createdAt";
      const sortOrder = req.query.sort === "asc" ? 1 : -1;

      /* ---------- Filtering ---------- */
      const filter = {};
      const castValue = (value) => {
        if (!isNaN(value)) return Number(value);
        if (value === "true" || value === "false") return value === "true";
        if (/^[0-9a-fA-F]{24}$/.test(value)) return new ObjectId(value);
        if (value.includes(",")) return { $in: value.split(",") };
        return value;
      };

      filterableFields.forEach((field) => {
        if (req.query[field] !== undefined) {
          filter[field] = castValue(req.query[field]);
        }
      });

      /* ---------- Searching ---------- */
      if (req.query.search && searchableFields.length) {
        filter.$or = searchableFields.map((field) => ({
          [field]: { $regex: req.query.search, $options: "i" },
        }));
      }

      const cursor = db
        .collection(collection)
        .find(filter)
        .project(projection)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit);

      const data = await cursor.toArray();
      const total = await db.collection(collection).countDocuments(filter);

      res.json({
        success: true,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        data: formatDocuments(data, dateFields),
      });
    } catch (err) {
      next(err);
    }
  };
};

export const getOneById = ({ collection, projection = {} }) => {
  return async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }

      const data = await db
        .collection(collection)
        .findOne({ _id: new ObjectId(id) }, { projection });

      if (!data) {
        return res.status(404).json({ success: false, message: "Not found" });
      }

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
};

export const updateOne = ({ collection, schema }) => {
  return async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }

      const { error, value } = schema.validate(req.body);
      if (error) throw error;

      const result = await db.collection(collection).updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...value,
            updatedAt: new Date(),
          },
        },
      );

      if (!result.matchedCount) {
        return res.status(404).json({ success: false, message: "Not found" });
      }

      await writeAuditLog({
        db,
        userId: req.user?._id,
        action: "UPDATE",
        collection,
        documentId: id,
        payload: value,
      });

      res.json({ success: true, message: "Updated successfully" });
    } catch (err) {
      next(err);
    }
  };
};

export const toggleStatus = ({ collection }) => {
  return async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      // 1️⃣ Find current document
      const doc = await db.collection(collection).findOne({
        _id: new ObjectId(id),
      });

      if (!doc) {
        return res.status(404).json({
          success: false,
          message: "Not found",
        });
      }

      // 2️⃣ Toggle status
      const currentStatus = (doc.status || "inactive").toLowerCase();
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      // 3️⃣ Update DB
      await db.collection(collection).updateOne(
        { _id: doc._id },
        {
          $set: {
            status: newStatus,
            updatedAt: new Date(),
          },
        },
      );

      // 4️⃣ Audit log
      await writeAuditLog({
        db,
        userId: req.user?._id,
        action: "STATUS_CHANGE",
        collection,
        documentId: id,
        payload: {
          from: currentStatus ? "ACTIVE" : "INACTIVE",
          to: newStatus ? "ACTIVE" : "INACTIVE",
        },
      });

      // 5️⃣ Response
      res.json({
        success: true,
        message: `Status changed to ${newStatus ? "Active" : "Inactive"}`,
        data: {
          id,
          status: newStatus,
        },
      });
    } catch (err) {
      next(err);
    }
  };
};

export const deleteOne = ({ collection }) => {
  return async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }

      const result = await db.collection(collection).deleteOne({
        _id: new ObjectId(id),
      });

      if (!result.deletedCount) {
        return res.status(404).json({ success: false, message: "Not found" });
      }

      await writeAuditLog({
        db,
        userId: req.user?._id,
        action: "DELETE",
        collection,
        documentId: id,
      });

      res.json({ success: true, message: "Deleted successfully" });
    } catch (err) {
      next(err);
    }
  };
};
