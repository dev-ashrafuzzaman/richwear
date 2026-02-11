import { getDB } from "../../../config/db.js";
import { expenseSchema } from "./expense.schema.js";
import { createExpenseService } from "./expense.service.js";

export const createExpense = async (req, res, next) => {
  const db = getDB();
  const session = db.client.startSession();

  try {
    const { error } = expenseSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(422).json({
        message: "Validation Error",
        errors: error.details.map((d) => d.message),
      });
    }

    await session.withTransaction(async () => {
      await createExpenseService({
        db,
        session,
        payload: req.body,
        user: req.user,
      });
    });

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
    });
  } catch (err) {
    next(err);
  } finally {
    await session.endSession();
  }
};
