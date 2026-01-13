/* ==========================
   BEFORE CREATE CUSTOMER
========================== */
export const beforeCreateCustomer = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    // Prevent duplicate by phone
    const exists = await db.collection("customers").findOne({
      phone: req.body.phone
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Customer already exists with this phone"
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};
