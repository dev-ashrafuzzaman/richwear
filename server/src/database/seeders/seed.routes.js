import express from "express";
import {
    seedAllController,
} from "./seed.controller.js";

const router = express.Router();

router.post("/all", seedAllController);

export default router;
