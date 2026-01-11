import { nowDate } from "./date.js";

/**
 * @param {Object} payload 
 * @param {Object} context 
 */
export const withCreateFields = (payload = {}, context = {}) => {
  const {
    userId = null,     
    branchId = null,    
    tenantId = null,        
    ipAddress = null,       
    device = null,          
    source = "system"       
  } = context;

  const now = nowDate();
  return {
    ...payload,
    status: "active",
    branchId,
    tenantId,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
    meta: {
      ipAddress,
      device,
      source
    }
  };
};

export const withUpdateFields = (payload = {}, context = {}) => {
  const {
    userId = null,
    ipAddress = null,
    device = null,
    source = "system"
  } = context;

  return {
    ...payload,
    updatedAt: nowDate(),
    updatedBy: userId,
    meta: {
      ipAddress,
      device,
      source
    }
  };
};


export const withDeleteFields = (context = {}) => {
  const {
    userId = null,
    ipAddress = null,
    device = null,
    source = "system"
  } = context;

  return {
    status: "deleted",
    updatedAt: nowDate(),
    updatedBy: userId,
    meta: {
      ipAddress,
      device,
      source
    }
  };
};
