import { getOutboxItems, deleteOutboxItem, getOutboxCount } from "./outboxDb";
import { createIncidentReport } from "../firebase/services/incidentService";
import { createMonitoringLog } from "../firebase/services/monitoringService";

let isSyncing = false;
const listeners = new Set();

/**
 * Broadcasts current sync status to all registered UI subscribers.
 */
const notifySubscribers = (state) => {
  listeners.forEach((callback) => {
    try {
      callback(state);
    } catch (err) {
      console.error("Error in sync subscriber:", err);
    }
  });
};

/**
 * Subscribes a callback to receive sync state updates.
 *
 * @param {function} callback
 * @returns {function} Unsubscribe function
 */
export const subscribeSyncState = (callback) => {
  listeners.add(callback);
  // Initial state check
  getOutboxCount().then((count) => {
    callback({ isSyncing, pendingCount: count, isOnline: navigator.onLine });
  });
  return () => listeners.delete(callback);
};

/**
 * Synchronizes all pending outbox submissions to Firebase.
 *
 * @returns {Promise<{successCount: number, failedCount: number}>}
 */
export const syncPendingOutbox = async () => {
  // Guard clauses: Must be online and not already syncing
  if (!navigator.onLine || isSyncing) {
    const count = await getOutboxCount();
    notifySubscribers({ isSyncing, pendingCount: count, isOnline: navigator.onLine });
    return { successCount: 0, failedCount: 0 };
  }

  isSyncing = true;
  let items = await getOutboxItems();
  notifySubscribers({ isSyncing: true, pendingCount: items.length, isOnline: true });

  let successCount = 0;
  let failedCount = 0;

  for (const item of items) {
    // Abort loop if connection drops mid-sync
    if (!navigator.onLine) {
      break;
    }

    try {
      // Reconstruct File objects from stored binary Blobs
      const reconstructedFiles = (item.files || []).map((f) => {
        return new File([f.blob], f.name, { type: f.type });
      });

      if (item.logType === "Incident") {
        await createIncidentReport(item.data, reconstructedFiles);
      } else if (item.logType === "Monitoring") {
        await createMonitoringLog(item.data, reconstructedFiles);
      }

      await deleteOutboxItem(item.id);
      successCount++;
    } catch (err) {
      console.error(`Failed to sync outbox item ${item.id}:`, err);
      failedCount++;
    }

    // Update pending count after each processed item
    const remaining = await getOutboxCount();
    notifySubscribers({ isSyncing: true, pendingCount: remaining, isOnline: navigator.onLine });
  }

  isSyncing = false;
  const finalCount = await getOutboxCount();
  notifySubscribers({
    isSyncing: false,
    pendingCount: finalCount,
    isOnline: navigator.onLine,
    justSynced: successCount > 0
  });

  return { successCount, failedCount };
};

/**
 * Initializes listeners for network restoration and window focus.
 */
export const initSyncListeners = () => {
  window.addEventListener("online", () => {
    notifySubscribers({ isSyncing: false, pendingCount: 0, isOnline: true });
    syncPendingOutbox();
  });

  window.addEventListener("offline", async () => {
    const count = await getOutboxCount();
    notifySubscribers({ isSyncing: false, pendingCount: count, isOnline: false });
  });

  // Check on boot if connected
  if (navigator.onLine) {
    syncPendingOutbox();
  }
};
