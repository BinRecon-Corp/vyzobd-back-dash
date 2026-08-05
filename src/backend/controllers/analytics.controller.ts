import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { AppError } from "../utils/AppError";

/**
 * Sends an event to GA4 via the Measurement Protocol.
 * Useful for reliable server-side tracking of purchases or refunds.
 */
export const trackServerPurchase = asyncHandler(async (req: Request, res: Response) => {
  const { clientId, transactionId, value, currency, items } = req.body;

  if (!clientId || !transactionId || !value || !items) {
    throw new AppError("Missing required parameters (clientId, transactionId, value, items)", 400, "VALIDATION_ERROR");
  }

  const { GA_MEASUREMENT_ID, GA_API_SECRET } = env;

  if (!GA_MEASUREMENT_ID || !GA_API_SECRET) {
    logger.warn("GA_MEASUREMENT_ID or GA_API_SECRET is not configured. Skipping server-side tracking.");
    return res.status(200).json({ success: true, message: "Tracking skipped (not configured)" });
  }

  const payload = {
    client_id: clientId, // Must match the client_id from the frontend (_ga cookie)
    events: [
      {
        name: "purchase",
        params: {
          currency: currency || "USD",
          value,
          transaction_id: transactionId,
          items,
        },
      },
    ],
  };

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`GA4 responded with status: ${response.status}`);
    }

    logger.info(`Successfully tracked server-side purchase for transaction: ${transactionId}`);
    
    res.status(200).json({ success: true, message: "Purchase tracked successfully" });
  } catch (error) {
    logger.error("Failed to send GA4 Measurement Protocol event", error);
    // Do not fail the request if tracking fails
    res.status(200).json({ success: true, message: "Tracking failed but request succeeded", error: (error as Error).message });
  }
});
