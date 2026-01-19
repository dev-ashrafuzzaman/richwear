// modules/accounting/seed.accounts.js
import { ObjectId } from "mongodb";

export const seedChartOfAccounts = async (db) => {
  /**
   * WARNING
   * This chart is SYSTEM LOCKED.
   * Do NOT change codes/types after production.
   */

  // Clear only if fresh setup
  await db.collection("accounts").deleteMany({});

  const accounts = [
    /* ======================
       ASSETS (1000)
    ====================== */
    { code: "1000", name: "Assets", type: "ASSET", subType: "GROUP" },

    {
      code: "1001",
      name: "Cash",
      type: "ASSET",
      subType: "CASH",
      parent: "1000",
    },
    {
      code: "1002",
      name: "Bank",
      type: "ASSET",
      subType: "BANK",
      parent: "1000",
    },
    {
      code: "1003",
      name: "Inventory",
      type: "ASSET",
      subType: "INVENTORY",
      parent: "1000",
    },
    {
      code: "1004",
      name: "Accounts Receivable",
      type: "ASSET",
      subType: "CUSTOMER",
      parent: "1000",
    },

    /* ======================
       LIABILITIES (2000)
    ====================== */
    { code: "2000", name: "Liabilities", type: "LIABILITY", subType: "GROUP" },

    {
      code: "2001",
      name: "Accounts Payable",
      type: "LIABILITY",
      subType: "SUPPLIER",
      parent: "2000",
    },
    {
      code: "2002",
      name: "Salary Payable",
      type: "LIABILITY",
      subType: "SALARY",
      parent: "2000",
    },
    {
      code: "2003",
      name: "Tax Payable",
      type: "LIABILITY",
      subType: "TAX",
      parent: "2000",
    },

    /* ======================
       INCOME (3000)
    ====================== */
    { code: "3000", name: "Income", type: "INCOME", subType: "GROUP" },

    {
      code: "3001",
      name: "Sales Income",
      type: "INCOME",
      subType: "SALES",
      parent: "3000",
    },
    {
      code: "3002",
      name: "Other Income",
      type: "INCOME",
      subType: "OTHER",
      parent: "3000",
    },

    /* ======================
       EXPENSE (4000)
    ====================== */
    { code: "4000", name: "Expenses", type: "EXPENSE", subType: "GROUP" },

    {
      code: "4001",
      name: "Purchase Expense",
      type: "EXPENSE",
      subType: "PURCHASE",
      parent: "4000",
    },
    {
      code: "4002",
      name: "Salary Expense",
      type: "EXPENSE",
      subType: "SALARY",
      parent: "4000",
    },
    {
      code: "4003",
      name: "Rent Expense",
      type: "EXPENSE",
      subType: "RENT",
      parent: "4000",
    },
    {
      code: "4004",
      name: "Utility Expense",
      type: "EXPENSE",
      subType: "UTILITY",
      parent: "4000",
    },
    {
      code: "4005",
      name: "Commission Expense",
      type: "EXPENSE",
      subType: "COMMISSION",
      parent: "4000",
    },
    {
      code: "4006",
      name: "Discount Expense",
      type: "EXPENSE",
      subType: "DISCOUNT",
      parent: "4000",
    },

    /* ======================
       EQUITY (5000)
    ====================== */
    { code: "5000", name: "Equity", type: "EQUITY", subType: "GROUP" },

    {
      code: "5001",
      name: "Owner Capital",
      type: "EQUITY",
      subType: "CAPITAL",
      parent: "5000",
    },
    {
      code: "5002",
      name: "Retained Earnings",
      type: "EQUITY",
      subType: "RETAINED",
      parent: "5000",
    },
  ];

  const inserted = {};

  for (const acc of accounts) {
    const parentId = acc.parent ? inserted[acc.parent] : null;

    const res = await db.collection("accounts").insertOne({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      subType: acc.subType,
      parentId,
      isSystem: true,
      branchId: null,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    inserted[acc.code] = res.insertedId;
  }

  console.log("✅ FINAL Chart of Accounts seeded successfully");
};
