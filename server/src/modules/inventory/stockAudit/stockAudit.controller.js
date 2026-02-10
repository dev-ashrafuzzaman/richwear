import * as service from "./stockAudit.service.js";

export const startAudit = async (req, res, next) => {
  try {
    res.json(await service.startAudit(req));
  } catch (e) {
    next(e);
  }
};

export const scanItem = async (req, res, next) => {
  try {
    res.json(await service.scanItem(req));
  } catch (e) {
    next(e);
  }
};

export const updateQty = async (req, res, next) => {
  try {
    res.json(await service.updateQty(req));
  } catch (e) {
    next(e);
  }
};

export const submitAudit = async (req, res, next) => {
  try {
    res.json(await service.submitAudit(req));
  } catch (e) {
    next(e);
  }
};

export const approveAudit = async (req, res, next) => {
  try {
    res.json(await service.approveAudit(req));
  } catch (e) {
    next(e);
  }
};
