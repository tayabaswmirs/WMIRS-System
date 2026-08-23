import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../config/firebaseAdmin.js";

const REGION = "asia-southeast1";
const BATCH_LIMIT = 500;

/**
 * Firestore DB trigger on '/incidents/{incidentId}' document creation.
 * Securely dispatches notifications to Admins and Incidents Staff with Admin SDK privileges.
 */
export const onIncidentCreated = onDocumentCreated(
  {
    document: "incidents/{incidentId}",
    region: REGION,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const incidentId = event.params.incidentId;
    const data = snap.data();
    if (!data) return;

    const reportTypeTitle = data.incidentType || data.category || "Incident Report";
    const locationLabel = data.location || "Watershed Area";
    const reporterName = data.reporter?.name || "Citizen Reporter";
    const reporterUid = data.reporter?.uid || "anonymous";

    try {
      // 1. Fetch all Admins and Incidents Staff in parallel
      const [adminSnap, staffSnap] = await Promise.all([
        db.collection("users").where("role", "==", "admin").get(),
        db.collection("users")
          .where("role", "==", "staff")
          .where("staffScope", "==", "incidents")
          .get()
      ]);

      const recipientUids = new Set();
      adminSnap.docs.forEach((d) => recipientUids.add(d.id));
      staffSnap.docs.forEach((d) => recipientUids.add(d.id));

      // Don't notify the reporter if they are an admin or staff themselves
      recipientUids.delete(reporterUid);

      if (recipientUids.size === 0) {
        logger.info(`No admin or incidents staff found to notify for incident ${incidentId}`);
        return;
      }

      const batch = db.batch();
      let count = 0;

      recipientUids.forEach((targetUid) => {
        if (count >= BATCH_LIMIT) return;

        const notifRef = db.collection("users").doc(targetUid).collection("notifications").doc();
        batch.set(notifRef, {
          id: notifRef.id,
          title: "New Incident Report Filed",
          message: `${reportTypeTitle} reported in ${locationLabel}.`,
          type: "incident_created",
          category: "incidents",
          referenceId: incidentId,
          referenceType: "incident",
          link: `/staff/incidents?id=${incidentId}`,
          isRead: false,
          readAt: null,
          createdAt: FieldValue.serverTimestamp(),
          sender: {
            uid: reporterUid,
            name: reporterName,
            role: data.reporter?.role || "reporter"
          }
        });
        count++;
      });

      await batch.commit();
      logger.info(`Dispatched new incident notification to ${count} recipients for ${incidentId}`);
    } catch (error) {
      logger.error(`Error in onIncidentCreated trigger for ${incidentId}:`, error);
    }
  }
);
