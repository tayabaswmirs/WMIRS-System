import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { db } from "../../config/firebaseAdmin.js";

/** Maximum stored notifications retained per user before automated FIFO pruning */
const MAX_NOTIFICATIONS_PER_USER = 20;

/**
 * Firestore DB trigger on '/users/{userId}/notifications/{notifId}' document creation.
 * Enforces a strict 20-notification storage limit per user by pruning older notifications (FIFO).
 */
export const pruneOldNotifications = onDocumentCreated(
  {
    document: "users/{userId}/notifications/{notifId}",
    region: "asia-southeast1",
  },
  async (event) => {
    const { userId, notifId } = event.params;
    
    // Guard: Validate parameters exist
    if (!userId || !notifId) {
      return;
    }

    try {
      const userNotifsRef = db.collection("users").doc(userId).collection("notifications");
      
      // Query notifications ordered from newest to oldest
      const snapshot = await userNotifsRef
        .orderBy("createdAt", "desc")
        .get();

      const totalCount = snapshot.size;

      // Early return if document count does not exceed limit
      if (totalCount <= MAX_NOTIFICATIONS_PER_USER) {
        return;
      }

      logger.info(
        `User ${userId} has ${totalCount} notifications. Pruning oldest ${totalCount - MAX_NOTIFICATIONS_PER_USER} records...`
      );

      // Collect documents beyond the retention threshold
      const excessDocs = snapshot.docs.slice(MAX_NOTIFICATIONS_PER_USER);
      
      // Batch delete surplus documents
      const batch = db.batch();
      excessDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      logger.info(`Successfully pruned ${excessDocs.length} notifications for user ${userId}.`);
    } catch (error) {
      logger.error(`Failed to prune notifications for user ${userId}:`, error);
    }
  }
);
