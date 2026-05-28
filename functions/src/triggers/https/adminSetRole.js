import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { z } from "zod";
import { auth, db } from "../../config/firebaseAdmin.js";

const inputSchema = z.object({
  uid: z.string(),
  role: z.enum(["admin", "user"]),
});

/**
 * Administrative user role / custom claims toggler.
 * Updates target user's custom claim { admin: true/false } and Firestore role.
 */
export const adminSetRole = onCall(
  {
    region: "asia-southeast1",
  },
  async (request) => {
    // 1. Authenticate caller
    if (!request.auth) {
      logger.warn("Unauthenticated attempt to access adminSetRole");
      throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    // 2. Authorize caller via custom claims AND Firestore document (defense in depth)
    const callerUid = request.auth.uid;
    const isClaimAdmin = request.auth.token?.admin === true;

    const callerDoc = await db.collection("users").doc(callerUid).get();
    const isDbAdmin = callerDoc.exists && callerDoc.data()?.role === "admin";

    if (!isClaimAdmin && !isDbAdmin) {
      logger.error(`Unauthorized access attempt to adminSetRole by UID: ${callerUid}`);
      throw new HttpsError("permission-denied", "Caller is not an administrator.");
    }

    // 3. Input validation
    const parsed = inputSchema.safeParse(request.data);
    if (!parsed.success) {
      logger.warn(`Invalid arguments provided to adminSetRole by Admin ${callerUid}`, parsed.error.format());
      throw new HttpsError(
        "invalid-argument",
        "Invalid data payload provided.",
        parsed.error.flatten().fieldErrors
      );
    }

    const { uid, role } = parsed.data;

    // 4. Accidental Self-Downgrade Safeguard
    if (callerUid === uid) {
      logger.warn(`Admin ${callerUid} attempted self-role modification. Blocked.`);
      throw new HttpsError("failed-precondition", "Administrators cannot modify their own role or claims.");
    }

    // 4.5. Fellow Admin Safeguard
    const targetDoc = await db.collection("users").doc(uid).get();
    if (targetDoc.exists && targetDoc.data()?.role === "admin") {
      logger.warn(`Admin ${callerUid} attempted to demote admin ${uid}. Blocked.`);
      throw new HttpsError("failed-precondition", "Administrators cannot demote other administrators.");
    }

    try {
      // 5. Update Firebase Authentication Custom Claims
      const isNewAdmin = role === "admin";
      await auth.setCustomUserClaims(uid, { admin: isNewAdmin });
      logger.info(`Admin ${callerUid} set custom claims { admin: ${isNewAdmin} } for UID: ${uid}`);

      // 6. Update Firestore Role
      await db.collection("users").doc(uid).update({ role });
      logger.info(`Admin ${callerUid} set Firestore role to '${role}' for UID: ${uid}`);

      return { status: "success", message: `User role successfully changed to ${role}.` };
    } catch (error) {
      logger.error(`Error setting custom claims/role for UID ${uid}:`, error);
      throw new HttpsError("internal", "An error occurred while updating the user role.");
    }
  }
);
