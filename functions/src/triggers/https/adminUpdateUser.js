import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { z } from "zod";
import { auth, db } from "../../config/firebaseAdmin.js";

const inputSchema = z.object({
  uid: z.string(),
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
});

/**
 * Administrative user update Cloud Function.
 * Updates auth credentials and Firestore profiles.
 */
export const adminUpdateUser = onCall(
  {
    region: "asia-southeast1",
  },
  async (request) => {
    // 1. Authenticate caller
    if (!request.auth) {
      logger.warn("Unauthenticated attempt to access adminUpdateUser");
      throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    // 2. Authorize caller via custom claims AND Firestore document (defense in depth)
    const callerUid = request.auth.uid;
    const isClaimAdmin = request.auth.token?.admin === true;

    const callerDoc = await db.collection("users").doc(callerUid).get();
    const isDbAdmin = callerDoc.exists && callerDoc.data()?.role === "admin";

    if (!isClaimAdmin && !isDbAdmin) {
      logger.error(`Unauthorized access attempt to adminUpdateUser by UID: ${callerUid}`);
      throw new HttpsError("permission-denied", "Caller is not an administrator.");
    }

    // 3. Input validation
    const parsed = inputSchema.safeParse(request.data);
    if (!parsed.success) {
      logger.warn(`Invalid arguments provided to adminUpdateUser by Admin ${callerUid}`, parsed.error.format());
      throw new HttpsError(
        "invalid-argument",
        "Invalid data payload provided.",
        parsed.error.flatten().fieldErrors
      );
    }

    const { uid, email, name, password } = parsed.data;

    try {
      // 4. Update Firebase Authentication parameters
      const authUpdates = {};
      if (email) authUpdates.email = email;
      if (name) authUpdates.displayName = name;
      if (password) authUpdates.password = password;

      if (Object.keys(authUpdates).length > 0) {
        await auth.updateUser(uid, authUpdates);
        logger.info(`Admin ${callerUid} successfully updated Auth record for UID: ${uid}`);
      }

      // 5. Update Firestore User Profile record
      const dbUpdates = {};
      if (email) dbUpdates.email = email;
      if (name) dbUpdates.name = name;

      if (Object.keys(dbUpdates).length > 0) {
        await db.collection("users").doc(uid).update(dbUpdates);
        logger.info(`Admin ${callerUid} successfully updated Firestore profile for UID: ${uid}`);
      }

      return { status: "success", message: "User credentials successfully updated." };
    } catch (error) {
      logger.error(`Error updating credentials for UID ${uid}:`, error);
      throw new HttpsError("internal", "An error occurred while updating the user profile.");
    }
  }
);
