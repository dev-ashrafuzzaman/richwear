import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { getAllStocks,getLowStock,getPosItems } from "./stock.controller.js";


const router = Router();

router.use(authenticate);

router.get("/", getAllStocks);
router.get("/pos-items", getPosItems);
router.get("/low", getLowStock);

export default router;
