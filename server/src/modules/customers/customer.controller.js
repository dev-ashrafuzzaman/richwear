import { getDB } from "../../config/db.js";
import * as service from "./customer.service.js";

export const create = async (req, res, next) => {
  try {
    const customer = await service.createCustomer({
      db: getDB(),
      payload: {
        ...req.body,
        code: req.generated.code
      }
    });

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const customer = await service.getCustomerById({
      db: getDB(),
      id: req.params.id
    });

    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    await service.updateCustomer({
      db: getDB(),
      id: req.params.id,
      payload: req.body
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
