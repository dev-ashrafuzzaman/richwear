import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { getAllStocks,getPosItems } from "./stock.controller.js";


const router = Router();

router.use(authenticate);

router.get("/", getAllStocks);
router.get("/pos-items", getPosItems);

export default router;
