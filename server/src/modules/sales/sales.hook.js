import { ObjectId } from "mongodb";
import { generateCode } from "../../utils/codeGenerator.js";

export const beforeCreateSale = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { branchId = "696ca2f1b9dfc697dfe2e670" } = req.body;

    const branch = await db.collection("branches").findOne({
      _id: new ObjectId("696ca2f1b9dfc697dfe2e670"),
      status: "active",
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found or inactive",
      });
    }
    req.generated = {
      invoiceNo: await generateCode({
        db,
        module: "SALE",
        prefix: "INV",
        scope: "YEAR",
        padding: 8,
        branch: branch.code,
      }),
    };

    next();
  } catch (err) {
    next(err);
  }
};
