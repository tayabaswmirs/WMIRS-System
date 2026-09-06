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

    // 2. Targeted Notifications to Assigned Patrol Team (Fixing Section 4.2 Broadcast Trap)
    const isAssigned = String(newStatus).toLowerCase() === "assigned" || String(newStatus).toLowerCase() === "unresolved";
    if (isAssigned) {
      if (after.assignedTeam?.leader?.uid) {
        // 2a. Notify Team Leader
        const leaderUid = after.assignedTeam.leader.uid;
        const leaderNotifRef = db.collection("users").doc(leaderUid).collection("notifications").doc();
        batch.set(leaderNotifRef, {
          id: leaderNotifRef.id,
          title: "New Field Assignment: Team Leader",
          message: `You are assigned as Team Leader for ${titleLabel} in ${locationLabel}. You hold resolution authority.`,
          type: "team_assignment_leader",
          category: categoryLabel,
          referenceId: docId,
          referenceType: logType.toLowerCase(),
          link: "/assignments",
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

        // 2b. Notify Assigned Team Members
        const members = after.assignedTeam.members || [];
        members.forEach((member) => {
          if (writeCount >= BATCH_LIMIT || !member.uid) return;
          const memberNotifRef = db.collection("users").doc(member.uid).collection("notifications").doc();
          batch.set(memberNotifRef, {
            id: memberNotifRef.id,
            title: "New Field Assignment: Team Member",
            message: `You are assigned to assist Team Leader ${after.assignedTeam.leader.name} for ${titleLabel} in ${locationLabel}.`,
            type: "team_assignment_member",
            category: categoryLabel,
            referenceId: docId,
            referenceType: logType.toLowerCase(),
            link: "/assignments",
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
      } else {
        // Fallback broadcast for legacy logs without an assignedTeam
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
            link: "/assignments",
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
    }

    // 3. Notify Sector Staff & Assigning Staff on Resolution (Fixing Section 4.1 & Finding 5)
    const isResolved = String(newStatus).toLowerCase() === "resolved";
    if (isResolved) {
      const leaderName = after.assignedTeam?.leader?.name || after.updatedBy?.name || "Team Leader";
      const assignedByUid = after.assignedTeam?.assignedBy?.uid;

      if (assignedByUid) {
        const staffNotifRef = db.collection("users").doc(assignedByUid).collection("notifications").doc();
        batch.set(staffNotifRef, {
          id: staffNotifRef.id,
          title: `${logType} Resolution Submitted: Pending Verification`,
          message: `${leaderName} has submitted resolution proof for ${titleLabel} in ${locationLabel}.`,
          type: "report_resolved_verification",
          category: categoryLabel,
          referenceId: docId,
          referenceType: logType.toLowerCase(),
          link: "/staff/workspace/verification",
          isRead: false,
          readAt: null,
          createdAt: FieldValue.serverTimestamp(),
          sender: {
            uid: after.updatedBy?.uid || "system",
            name: leaderName,
            role: "ranger"
          }
        });
        writeCount++;
      } else {
        // Fallback: Notify all staff if assigning staff UID is missing
        const staffSnap = await db.collection("users").where("role", "==", "staff").get();
        staffSnap.docs.forEach((staffDoc) => {
          if (writeCount >= BATCH_LIMIT) return;
          const sNotifRef = db.collection("users").doc(staffDoc.id).collection("notifications").doc();
          batch.set(sNotifRef, {
            id: sNotifRef.id,
            title: `${logType} Resolution Submitted`,
            message: `${leaderName} has submitted resolution proof for ${titleLabel}.`,
            type: "report_resolved_verification",
            category: categoryLabel,
            referenceId: docId,
            referenceType: logType.toLowerCase(),
            link: "/staff/workspace/verification",
            isRead: false,
            readAt: null,
            createdAt: FieldValue.serverTimestamp(),
            sender: {
              uid: after.updatedBy?.uid || "system",
              name: leaderName,
              role: "ranger"
            }
          });
          writeCount++;
        });
      }
    }

    // 4. Notify Reporter on Duplicate Merge
    const isMerged = String(newStatus).toLowerCase() === "merged_duplicate";
    if (isMerged && reporterUid) {
      const masterId = after.mergedInto?.masterId || "active investigation";
      const mergeNotifRef = db.collection("users").doc(reporterUid).collection("notifications").doc();
      batch.set(mergeNotifRef, {
        id: mergeNotifRef.id,
        title: "Report Merged into Active Investigation",
        message: `Your report for ${titleLabel} in ${locationLabel} was confirmed and merged into active investigation #${masterId}.`,
        type: "report_merged",
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
