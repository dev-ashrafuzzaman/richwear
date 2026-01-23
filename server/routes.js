import { Router } from "express";
import authRoutes from "./src/modules/auth/auth.routes.js";
import roleRoutes from "./src/modules/roles/role.routes.js";
import userRoutes from "./src/modules/users/user.routes.js";
import branchRoutes from "./src/modules/branches/branch.routes.js";
import customerRoutes from "./src/modules/customers/customer.routes.js";
import employeeRoutes from "./src/modules/employee/employee.routes.js";
import categoryRoutes from "./src/modules/categories/category.routes.js";
import productRoutes from "./src/modules/products/product.routes.js";
import variantRoutes from "./src/modules/variants/variant.routes.js";
import supplierRoutes from "./src/modules/suppliers/supplier.routes.js";
import purchaseRoutes from "./src/modules/purchases/purchase.routes.js";
import attendanceRoutes from "./src/modules/hr/attendance/attendance.routes.js";
import saleRoutes from "./src/modules/sales/sales.routes.js";
import saleReturnRoutes from "./src/modules/sales/return/salesReturn.routes.js";

// REPORTS ROUTES
import ledgerRoutes from "./src/modules/accounting/reports/ledger/ledger.routes.js";
import balanceSheetRoutes from "./src/modules/accounting/reports/balanceSheet/balanceSheet.routes.js";
import closingRoutes from "./src/modules/accounting/reports/closing/yearClosing.routes.js";
import statementRoutes from "./src/modules/accounting/reports/statement/statement.routes.js";
import trialBalanceRoutes from "./src/modules/accounting/reports/trialBalance/trialBalance.routes.js";
import stockRoutes from "./src/modules/inventory/stock.routes.js";
import adminRoutes from "./src/modules/administration/admin.route.js";


import { authenticate } from "./src/middlewares/auth.middleware.js";

const router = Router();

router.use("/auth", authRoutes);

router.use(authenticate);
router.use("/activities", adminRoutes);
router.use("/roles", roleRoutes);
router.use("/users", userRoutes);
router.use("/branches", branchRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/variants", variantRoutes);
router.use("/customers", customerRoutes);
router.use("/employees", employeeRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/sales", saleRoutes);
router.use("/sales-return", saleReturnRoutes); 
router.use("/stocks", stockRoutes); 

// REPORTS ROUTES
router.use("/accounting/reports/ledgers", ledgerRoutes);
router.use("/accounting/reports/balance-sheet", balanceSheetRoutes);
router.use("/accounting/reports/close-year", closingRoutes);
router.use("/accounting/reports/statement", statementRoutes);
router.use("/accounting/reports/trial-balance", trialBalanceRoutes);


export default router;
