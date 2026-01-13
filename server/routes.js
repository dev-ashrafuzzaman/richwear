import { Router } from "express";
import authRoutes from "./src/modules/auth/auth.routes.js";
import roleRoutes from "./src/modules/roles/role.routes.js";
import userRoutes from "./src/modules/users/user.routes.js";
import branchRoutes from "./src/modules/branches/branch.routes.js";
// import productRoutes from "./src/modules/products/product.routes.js";
// import saleRoutes from "./src/modules/sales/sale.routes.js";

import { authenticate } from "./src/middlewares/auth.middleware.js";

const router = Router();

router.use("/auth", authRoutes);

router.use(authenticate);
router.use("/roles", roleRoutes);
router.use("/users", userRoutes);
router.use("/branches", branchRoutes);
// router.use("/products", productRoutes);
// router.use("/sales", saleRoutes);

export default router;
