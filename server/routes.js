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
// import saleRoutes from "./src/modules/sales/sale.routes.js";

import { authenticate } from "./src/middlewares/auth.middleware.js";

const router = Router();

router.use("/auth", authRoutes);

router.use(authenticate);
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
router.use("/attendances", attendanceRoutes);
// router.use("/sales", saleRoutes);

export default router;
