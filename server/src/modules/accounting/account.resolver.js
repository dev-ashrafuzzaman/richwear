// modules/accounting/account.resolver.js

let CACHE = null;

export const resolveSystemAccounts = async (db) => {
  if (CACHE) return CACHE;

  const accounts = await db.collection("accounts").find({
    isSystem: true,
    status: "ACTIVE",
  }).toArray();

  const bySubType = (subType) => {
    const acc = accounts.find(a => a.subType === subType);
    if (!acc) {
      throw new Error(`System account missing: ${subType}`);
    }
    return acc._id;
  };

  CACHE = {
    CASH: bySubType("CASH"),
    BANK: bySubType("BANK"),
    INVENTORY: bySubType("INVENTORY"),
    SALES_INCOME: bySubType("SALES"),

    // liabilities
    SUPPLIER_PAYABLE: bySubType("SUPPLIER"),
    SALARY_PAYABLE: bySubType("SALARY"),
    TAX_PAYABLE: bySubType("TAX"),

    // expenses
    PURCHASE_EXPENSE: bySubType("PURCHASE"),
    SALARY_EXPENSE: bySubType("SALARY"),
    COMMISSION_EXPENSE: bySubType("COMMISSION"),
    DISCOUNT_EXPENSE: bySubType("DISCOUNT"),

    // equity
    RETAINED_EARNINGS: bySubType("RETAINED"),
  };

  return CACHE;
};
