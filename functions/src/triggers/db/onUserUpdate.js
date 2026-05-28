import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { db } from "../../config/firebaseAdmin.js";

/**
 * Firestore DB trigger on '/users/{userId}' document update.
 * Automatically propagates user name updates to the submissions and actions collections
 * to ensure historic record consistency.
 */
export const onUserUpdate = onDocumentUpdated(
  {
    document: "users/{userId}",
    region: "asia-southeast1",
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    // Guard: ensure documents exist
    if (!before || !after) {
      return;
    }

    // Guard: check if name changed
    if (before.name === after.name) {
      return;
    }

    const userId = event.params.userId;
    const newName = after.name;
    logger.info(`Name modification detected for UID: ${userId} (${before.name} -> ${newName}). Propagating change...`);

    /**
     * Batch update helper to handle Firestore's 500-operation limit securely.
     */
    const propagateUpdates = async (collectionName, queryField, updateObj) => {
      try {
        const snap = await db.collection(collectionName).where(queryField, "==", userId).get();
        if (snap.empty) {
          return;
        }

        let batch = db.batch();
        let operationCount = 0;
        const commitPromises = [];

        snap.docs.forEach((doc) => {
          batch.update(doc.ref, updateObj);
          operationCount++;

          if (operationCount === 500) {
            commitPromises.push(batch.commit());
            batch = db.batch();
            operationCount = 0;
          }
        });

        if (operationCount > 0) {
          commitPromises.push(batch.commit());
        }

        await Promise.all(commitPromises);
        logger.info(`Successfully propagated name to ${snap.size} documents in '${collectionName}' via '${queryField}' field.`);
      } catch (err) {
        logger.error(`Failed to propagate name changes to '${collectionName}' via '${queryField}':`, err);
      }
    };

    // Propagate updates asynchronously to all potential database patterns
    await Promise.all([
      // Submissions Collection Updates
      propagateUpdates("submissions", "userId", { authorName: newName, userName: newName }),
      propagateUpdates("submissions", "authorId", { authorName: newName, userName: newName }),
      propagateUpdates("submissions", "createdBy.userId", { "createdBy.name": newName }),

      // Actions Collection Updates
      propagateUpdates("actions", "userId", { authorName: newName, userName: newName }),
      propagateUpdates("actions", "createdBy.userId", { "createdBy.name": newName }),
    ]);

    logger.info(`Finished propagation of name changes for UID: ${userId}`);
  }
);
