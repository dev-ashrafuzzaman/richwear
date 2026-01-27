import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { createStockTransfer, getAllStocks,getLowStock,getPosItems, getTransferItems } from "./stock.controller.js";


const router = Router();

router.use(authenticate);

router.get("/", getAllStocks);
router.get("/pos-items", getPosItems);
router.get("/transfer-items", getTransferItems);
router.get("/low", getLowStock);
router.post("/transfers", createStockTransfer);

export default router;
