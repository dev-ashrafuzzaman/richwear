// modules/accounting/seed.accounts.js
export const seedChartOfAccounts = async (db) => {

  const accounts = [

    /* ======================
       ASSETS
    ====================== */
    { code: "1000", name: "Assets", type: "ASSET", subType: "GROUP" },

    { code: "1001", name: "Cash", type: "ASSET", subType: "CASH", parent: "1000" },
    { code: "1002", name: "Bank", type: "ASSET", subType: "BANK", parent: "1000" },
    { code: "1003", name: "Inventory", type: "ASSET", subType: "INVENTORY", parent: "1000" },
    { code: "1004", name: "Accounts Receivable", type: "ASSET", subType: "CUSTOMER", parent: "1000" },

    /* ======================
       LIABILITIES
    ====================== */
    { code: "2000", name: "Liabilities", type: "LIABILITY", subType: "GROUP" },

    { code: "2001", name: "Accounts Payable", type: "LIABILITY", subType: "SUPPLIER", parent: "2000" },
    { code: "2002", name: "Salary Payable", type: "LIABILITY", subType: "SALARY", parent: "2000" },

    /* ======================
       INCOME
    ====================== */
    { code: "3000", name: "Income", type: "INCOME", subType: "GROUP" },

    { code: "3001", name: "Sales Income", type: "INCOME", subType: "SALES", parent: "3000" },
    { code: "3002", name: "Other Income", type: "INCOME", subType: "INCOME", parent: "3000" },

    /* ======================
       EXPENSE
    ====================== */
    { code: "4000", name: "Expenses", type: "EXPENSE", subType: "GROUP" },

    { code: "4001", name: "Purchase Expense", type: "EXPENSE", subType: "PURCHASE", parent: "4000" },
    { code: "4002", name: "Salary Expense", type: "EXPENSE", subType: "SALARY", parent: "4000" },
    { code: "4003", name: "Rent Expense", type: "EXPENSE", subType: "RENT", parent: "4000" },
    { code: "4004", name: "Utility Expense", type: "EXPENSE", subType: "UTILITY", parent: "4000" },

    /* ======================
       EQUITY
    ====================== */
    { code: "5000", name: "Equity", type: "EQUITY", subType: "GROUP" },

    { code: "5001", name: "Owner Capital", type: "EQUITY", subType: "CAPITAL", parent: "5000" },
    { code: "5002", name: "Retained Earnings", type: "EQUITY", subType: "RETAINED", parent: "5000" }
  ];

  // clear existing (optional)
  await db.collection("accounts").deleteMany({});

  const inserted = {};

  for (const acc of accounts) {
    const parentId = acc.parent ? inserted[acc.parent] : null;

    const res = await db.collection("accounts").insertOne({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      subType: acc.subType,
      parentId,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    inserted[acc.code] = res.insertedId;
  }

  console.log("✅ Chart of Accounts Seeded Successfully");
};
