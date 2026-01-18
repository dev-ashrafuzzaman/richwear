import { generateCode } from "../../utils/codeGenerator.js";

export const beforeCreateCustomer = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const exists = await db.collection("customers").findOne({
      phone: req.body.phone,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Customer already exists with this phone",
      });
    }

    req.generated = {
      code: await generateCode({
        db,
        module: "CUSTOMER",
        prefix: "CUST",
        scope: "YEAR",
        branch: "JG",
      }),
    };
    next();
  } catch (err) {
    next(err);
  }
};
