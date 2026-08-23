import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../config/firebaseAdmin.js";

const REGION = "asia-southeast1";
const BATCH_LIMIT = 500;

/**
 * Firestore DB trigger on '/monitoring/{monitoringId}' document creation.
 * Securely dispatches notifications to Admins and matching Scoped Staff (BMS, Water, Compliance).
 */
export const onMonitoringCreated = onDocumentCreated(
  {
    document: "monitoring/{monitoringId}",
    region: REGION,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const monitoringId = event.params.monitoringId;
    const data = snap.data();
    if (!data) return;

    const categoryLabel = data.category || "Monitoring";
    const subcategoryLabel = data.subcategory || categoryLabel;
    const locationLabel = data.location || "Watershed Area";
    const reporterName = data.reporter?.name || "Field Officer";
    const reporterUid = data.reporter?.uid || "anonymous";

    try {
      // 1. Fetch all Admins and Scoped Staff for this category in parallel
      const [adminSnap, staffSnap] = await Promise.all([
        db.collection("users").where("role", "==", "admin").get(),
        db.collection("users")
          .where("role", "==", "staff")
          .where("staffScope", "==", categoryLabel)
          .get()
      ]);

      const recipientUids = new Set();
      adminSnap.docs.forEach((d) => recipientUids.add(d.id));
      staffSnap.docs.forEach((d) => recipientUids.add(d.id));

      // Don't notify the reporter if they are an admin or staff themselves
      recipientUids.delete(reporterUid);

      if (recipientUids.size === 0) {
        logger.info(`No admin or ${categoryLabel} staff found to notify for log ${monitoringId}`);
        return;
      }

      const batch = db.batch();
      let count = 0;

      recipientUids.forEach((targetUid) => {
        if (count >= BATCH_LIMIT) return;

        const notifRef = db.collection("users").doc(targetUid).collection("notifications").doc();
        batch.set(notifRef, {
          id: notifRef.id,
          title: `New ${categoryLabel} Log Submitted`,
          message: `${subcategoryLabel} observation logged in ${locationLabel}.`,
          type: "monitoring_created",
          category: categoryLabel,
          referenceId: monitoringId,
          referenceType: "monitoring",
          link: `/staff/${categoryLabel.toLowerCase()}?id=${monitoringId}`,
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
      logger.info(`Dispatched ${categoryLabel} monitoring notification to ${count} recipients for ${monitoringId}`);
    } catch (error) {
      logger.error(`Error in onMonitoringCreated trigger for ${monitoringId}:`, error);
    }
  }
);
