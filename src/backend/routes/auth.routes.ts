import express from "express";
import { login, getMe } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth";

const router = express.Router();

router.post("/login", login);
router.get("/me", requireAuth, getMe);

export default router;
