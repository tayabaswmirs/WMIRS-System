import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { z } from "zod";
import { auth, db } from "../../config/firebaseAdmin.js";

const inputSchema = z.object({
  uid: z.string(),
});

/**
 * Administrative user account purge Cloud Function.
 * Deletes authentication account and Firestore profile document.
 * Leaves submissions and actions intact within the system.
 */
export const adminDeleteUser = onCall(
  {
    region: "asia-southeast1",
  },
  async (request) => {
    // 1. Authenticate caller
    if (!request.auth) {
      logger.warn("Unauthenticated attempt to access adminDeleteUser");
      throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    // 2. Authorize caller via custom claims AND Firestore document (defense in depth)
    const callerUid = request.auth.uid;
    const isClaimAdmin = request.auth.token?.admin === true;

    const callerDoc = await db.collection("users").doc(callerUid).get();
    const isDbAdmin = callerDoc.exists && callerDoc.data()?.role === "admin";

    if (!isClaimAdmin && !isDbAdmin) {
      logger.error(`Unauthorized access attempt to adminDeleteUser by UID: ${callerUid}`);
      throw new HttpsError("permission-denied", "Caller is not an administrator.");
    }

    // 3. Input validation
    const parsed = inputSchema.safeParse(request.data);
    if (!parsed.success) {
      logger.warn(`Invalid arguments provided to adminDeleteUser by Admin ${callerUid}`, parsed.error.format());
      throw new HttpsError(
        "invalid-argument",
        "Invalid data payload provided.",
        parsed.error.flatten().fieldErrors
      );
    }

    const { uid } = parsed.data;

    // 4. Accidental Self-Deletion Safeguard
    if (callerUid === uid) {
      logger.warn(`Admin ${callerUid} attempted self-deletion. Blocked.`);
      throw new HttpsError("failed-precondition", "Administrators cannot delete their own account.");
    }

    try {
      // 5. Delete from Firebase Authentication
      await auth.deleteUser(uid);
      logger.info(`Admin ${callerUid} successfully deleted Auth record for UID: ${uid}`);

      // 6. Delete from Firestore users collection
      await db.collection("users").doc(uid).delete();
      logger.info(`Admin ${callerUid} successfully deleted Firestore profile document for UID: ${uid}`);

      return { status: "success", message: "User account and profile successfully deleted from the system." };
    } catch (error) {
      logger.error(`Error deleting user UID ${uid}:`, error);
      throw new HttpsError("internal", "An error occurred while deleting the user account.");
    }
  }
);
