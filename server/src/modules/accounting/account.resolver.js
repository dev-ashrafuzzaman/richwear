// modules/accounting/account.resolver.js

/**
 * System Account Resolver
 * -----------------------
 * - Resolves SYSTEM accounts from DB using subType
 * - Caches result in memory (per process)
 * - Works with GLOBAL chart of accounts (branchId = null)
 */

let CACHE = null;

export const resolveSystemAccounts = async (db) => {
  // Return from cache if already loaded
  if (CACHE) return CACHE;

  const accounts = await db.collection("accounts").find({
    isSystem: true,
    status: "ACTIVE",
    branchId: null
  }).toArray();

  if (!accounts.length) {
    throw new Error("System accounts not found. Did you run seed?");
  }

  const bySubType = (subType) => {
    const acc = accounts.find(a => a.subType === subType);
    if (!acc) {
      throw new Error(`System account missing for subType: ${subType}`);
    }
    return acc._id;
  };

  /**
   * FINAL SYSTEM ACCOUNT MAP
   * (Must match seedChartOfAccounts)
   */
  CACHE = {
    /* ========= ASSETS ========= */
    CASH: bySubType("CASH"),
    BANK: bySubType("BANK"),            // Parent: Bank & MFS
    INVENTORY: bySubType("INVENTORY"),
    CUSTOMER_AR: bySubType("CUSTOMER"),

    /* ======== LIABILITIES ======== */
    SUPPLIER_AP: bySubType("SUPPLIER"),
    SALARY_PAYABLE: bySubType("SALARY"),
    TAX_PAYABLE: bySubType("TAX"),

    /* ========= INCOME ========= */
    SALES_INCOME: bySubType("SALES"),
    OTHER_INCOME: bySubType("OTHER"),

    /* ========= EXPENSE ========= */
    PURCHASE_EXPENSE: bySubType("PURCHASE"),
    SALARY_EXPENSE: bySubType("SALARY"),
    COMMISSION_EXPENSE: bySubType("COMMISSION"),
    DISCOUNT_EXPENSE: bySubType("DISCOUNT"),
    RENT_EXPENSE: bySubType("RENT"),
    UTILITY_EXPENSE: bySubType("UTILITY"),

    /* ========= EQUITY ========= */
    OWNER_CAPITAL: bySubType("CAPITAL"),
    RETAINED_EARNINGS: bySubType("RETAINED")
  };

  return CACHE;
};

/**
 * Optional: clear cache (useful for tests / reseed)
 */
export const clearAccountResolverCache = () => {
  CACHE = null;
};
