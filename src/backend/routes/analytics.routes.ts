import { Router } from "express";
import { trackServerPurchase } from "../controllers/analytics.controller";
import { requireAuth } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /analytics/track-purchase:
 *   post:
 *     summary: Track a purchase via GA4 Measurement Protocol (Server-side)
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, transactionId, value, items]
 *             properties:
 *               clientId:
 *                 type: string
 *               transactionId:
 *                 type: string
 *               value:
 *                 type: number
 *               currency:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       '200':
 *         description: Event tracked or skipped
 */
router.post("/track-purchase", requireAuth, trackServerPurchase);

export default router;
