import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { z } from "zod";

/**
 * Secure HTTPS Cloud Function V2
 * Validates request data and handles errors gracefully without exposing internals.
 */
export const testSecureEndpoint = onRequest(
  {
    cors: true, // Enables CORS for frontend communication
    region: "asia-southeast1" // Singapore region
  },
  async (req, res) => {
    // 1. Enforce POST request method
    if (req.method !== "POST") {
      logger.warn(`Rejected method: ${req.method}`);
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
      // 2. Validate Inputs strictly via Zod Schema (Input Validation)
      const inputSchema = z.object({
        userId: z.string().min(5),
        payload: z.string().max(250)
      });

      const parsedData = inputSchema.safeParse(req.body);
      if (!parsedData.success) {
        logger.warn("Invalid incoming payload detected", parsedData.error.format());
        return res.status(400).json({
          error: "Invalid input payload",
          details: parsedData.error.flatten().fieldErrors
        });
      }

      const { userId, payload } = parsedData.data;
      logger.info(`Processing secure action for User: ${userId}`);

      // Perform backend operations here...
      const mockResult = {
        status: "success",
        processedAt: new Date().toISOString(),
        data: { userId, payload }
      };

      res.status(200).json(mockResult);
    } catch (err) {
      // 3. Safe Error Handling: Log the actual error, but return a generic message
      logger.error("Failed to execute secure endpoint:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
