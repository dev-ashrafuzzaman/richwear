import { generateCode } from "../../utils/codeGenerator.js";

export const beforeCreateSupplier = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const exists = await db.collection("suppliers").findOne({
      "contact.phone": req.body.contact.phone,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Supplier already exists with this phone",
      });
    }
    req.generated = {
      code: await generateCode({
        db,
        scope: "SUPPLIER",
        prefix: "SUP",
      }),
    };
    next();
  } catch (err) {
    next(err);
  }
};
