import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { auth, db } from "../../config/firebaseAdmin.js";

/**
2. * Secure user self-deletion Cloud Function.
3. * Deletes the calling user's Firebase Auth account and their Firestore profile document.
4. */
export const selfDeleteAccount = onCall(
  {
    region: "asia-southeast1",
  },
  async (request) => {
    // 1. Authenticate caller
    if (!request.auth) {
      logger.warn("Unauthenticated attempt to access selfDeleteAccount");
      throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    const callerUid = request.auth.uid;
    logger.info(`Self-deletion request received for UID: ${callerUid}`);

    try {
      // 2. Delete from Firebase Authentication first
      await auth.deleteUser(callerUid);
      logger.info(`Successfully deleted Auth record for UID: ${callerUid}`);

      // 3. Delete from Firestore users collection
      await db.collection("users").doc(callerUid).delete();
      logger.info(`Successfully deleted Firestore profile document for UID: ${callerUid}`);

      return { status: "success", message: "Your account and profile have been successfully deleted." };
    } catch (error) {
      logger.error(`Error during self-deletion for UID ${callerUid}:`, error);
      throw new HttpsError("internal", "An error occurred while deleting your account.");
    }
  }
);
