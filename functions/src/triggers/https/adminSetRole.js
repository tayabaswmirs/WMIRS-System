import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { z } from "zod";
import { auth, db } from "../../config/firebaseAdmin.js";

/** Valid domain scopes that can be assigned to staff members */
const VALID_STAFF_SCOPES = ["incidents", "BMS", "Water", "Compliance"];

const inputSchema = z.object({
  uid: z.string(),
  role: z.enum(["admin", "staff", "ranger"]),
  staffScope: z.enum(VALID_STAFF_SCOPES).nullable().optional(),
}).refine(
  (data) => {
    // staffScope is required when role is "staff"
    if (data.role === "staff") {
      return VALID_STAFF_SCOPES.includes(data.staffScope);
    }
    return true;
  },
  { message: "staffScope is required when role is 'staff'.", path: ["staffScope"] }
);

/**
 * Administrative user role / custom claims toggler.
 * Supports 3-tier roles: admin, staff (with domain scope), ranger.
 * Updates target user's custom claims and Firestore role + staffScope.
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

    const { uid, role, staffScope } = parsed.data;

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
      const resolvedScope = role === "staff" ? staffScope : null;

      await auth.setCustomUserClaims(uid, {
        admin: isNewAdmin,
        role,
        scope: resolvedScope,
      });
      logger.info(`Admin ${callerUid} set custom claims { admin: ${isNewAdmin}, role: ${role}, scope: ${resolvedScope} } for UID: ${uid}`);

      // 6. Update Firestore Role and Staff Scope
      await db.collection("users").doc(uid).update({
        role,
        staffScope: resolvedScope,
      });
      logger.info(`Admin ${callerUid} set Firestore role to '${role}' (scope: ${resolvedScope}) for UID: ${uid}`);

      return { status: "success", message: `User role successfully changed to ${role}.` };
    } catch (error) {
      logger.error(`Error setting custom claims/role for UID ${uid}:`, error);
      throw new HttpsError("internal", "An error occurred while updating the user role.");
    }
  }
);

