import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../config/firebaseAdmin.js";

const REGION = "asia-southeast1";
const BATCH_LIMIT = 500;

/**
 * Dispatches status progression notifications on report updates.
 * 
 * @param {string} logType - "Incident" | "Monitoring"
 * @param {string} docId - Document ID
 * @param {object} before - Prior snapshot data
 * @param {object} after - Updated snapshot data
 */
const handleStatusTransition = async (logType, docId, before, after) => {
  if (!before || !after || before.status === after.status) {
    return;
  }

  const newStatus = after.status;
  const reporterUid = after.reporter?.uid;
  const titleLabel = after.incidentType || after.subcategory || after.category || logType;
  const locationLabel = after.location || "Watershed Area";
  const categoryLabel = after.category || (logType === "Incident" ? "incidents" : "system");

  try {
    const batch = db.batch();
    let writeCount = 0;

    // 1. Notify Original Reporter
    if (reporterUid && reporterUid !== after.updatedBy?.uid) {
      const reporterNotifRef = db.collection("users").doc(reporterUid).collection("notifications").doc();
      batch.set(reporterNotifRef, {
        id: reporterNotifRef.id,
        title: `${logType} Report Updated`,
        message: `Your ${titleLabel} report status is now: ${newStatus}.`,
        type: "report_status_changed",
        category: categoryLabel,
        referenceId: docId,
        referenceType: logType.toLowerCase(),
        link: "/history",
        isRead: false,
        readAt: null,
        createdAt: FieldValue.serverTimestamp(),
        sender: {
          uid: after.updatedBy?.uid || "system",
          name: after.updatedBy?.name || "ENRO Staff",
          role: "staff"
        }
      });
      writeCount++;
    }

    // 2. Broadcast to Forest Rangers on Open Assignment
    const isAssigned = String(newStatus).toLowerCase() === "assigned" || String(newStatus).toLowerCase() === "unresolved";
    if (isAssigned) {
      const rangersSnap = await db.collection("users").where("role", "==", "ranger").get();
      rangersSnap.docs.forEach((rangerDoc) => {
        if (writeCount >= BATCH_LIMIT) return;
        const rNotifRef = db.collection("users").doc(rangerDoc.id).collection("notifications").doc();
        batch.set(rNotifRef, {
          id: rNotifRef.id,
          title: "New Field Assignment Open",
          message: `${titleLabel} in ${locationLabel} is available for inspection.`,
          type: "open_assignment_broadcast",
          category: categoryLabel,
          referenceId: docId,
          referenceType: logType.toLowerCase(),
          link: "/open-assignments",
          isRead: false,
          readAt: null,
          createdAt: FieldValue.serverTimestamp(),
          sender: {
            uid: after.updatedBy?.uid || "system",
            name: after.updatedBy?.name || "ENRO Staff",
            role: "staff"
          }
        });
        writeCount++;
      });
    }

    // 3. Notify Admins on Resolution
    const isResolved = String(newStatus).toLowerCase() === "resolved";
    if (isResolved) {
      const adminsSnap = await db.collection("users").where("role", "==", "admin").get();
      adminsSnap.docs.forEach((adminDoc) => {
        if (writeCount >= BATCH_LIMIT) return;
        const aNotifRef = db.collection("users").doc(adminDoc.id).collection("notifications").doc();
        batch.set(aNotifRef, {
          id: aNotifRef.id,
          title: `${logType} Ready for Verification`,
          message: `${titleLabel} in ${locationLabel} has been marked resolved.`,
          type: "report_resolved",
          category: categoryLabel,
          referenceId: docId,
          referenceType: logType.toLowerCase(),
          link: logType === "Incident" ? `/admin/incidents?id=${docId}` : `/admin/monitoring`,
          isRead: false,
          readAt: null,
          createdAt: FieldValue.serverTimestamp(),
          sender: {
            uid: after.updatedBy?.uid || "system",
            name: after.updatedBy?.name || "Field Officer",
            role: "ranger"
          }
        });
        writeCount++;
      });
    }

    if (writeCount > 0) {
      await batch.commit();
      logger.info(`Dispatched ${writeCount} status update notifications for ${logType} ${docId} -> ${newStatus}`);
    }
  } catch (err) {
    logger.error(`Error handling status transition for ${logType} ${docId}:`, err);
  }
};

/**
 * Firestore DB trigger on '/incidents/{incidentId}' document update.
 */
export const onIncidentUpdated = onDocumentUpdated(
  {
    document: "incidents/{incidentId}",
    region: REGION,
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    await handleStatusTransition("Incident", event.params.incidentId, before, after);
  }
);

/**
 * Firestore DB trigger on '/monitoring/{monitoringId}' document update.
 */
export const onMonitoringUpdated = onDocumentUpdated(
  {
    document: "monitoring/{monitoringId}",
    region: REGION,
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    await handleStatusTransition("Monitoring", event.params.monitoringId, before, after);
  }
);
