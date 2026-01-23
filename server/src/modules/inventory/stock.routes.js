import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { getAllStocks } from "./stock.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getAllStocks);

export default router;
