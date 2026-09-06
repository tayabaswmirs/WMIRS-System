const DB_NAME = "wmirs_offline_db";
const DB_VERSION = 1;
const STORE_NAME = "outbox_items";

/**
 * Initializes and returns a connection to the IndexedDB database.
 *
 * @returns {Promise<IDBDatabase>}
 */
const openDb = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this browser"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("uid", "uid", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Saves a report to the local IndexedDB outbox with compressed photo blobs.
 *
 * @param {object} params
 * @param {string} params.logType - "Incident" or "Monitoring"
 * @param {object} params.data - Report payload
 * @param {Array<{name: string, type: string, blob: Blob}>} params.files - Evidence files
 * @param {string} params.uid - Submitting user's UID
 * @returns {Promise<string>} Created Outbox item ID
 */
export const saveToOutbox = async ({ logType, data, files = [], uid }) => {
  const db = await openDb();
  const id = `outbox_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const entry = {
    id,
    logType,
    data,
    files,
    uid,
    createdAt: new Date().toISOString(),
    status: "pending"
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(entry);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Retrieves all pending outbox submissions for a given user.
 *
 * @param {string} [uid] - Optional user UID to filter by
 * @returns {Promise<Array<object>>}
 */
export const getOutboxItems = async (uid) => {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      let items = request.result || [];
      if (uid) {
        items = items.filter((item) => item.uid === uid);
      }
      // Sort oldest to newest for FIFO syncing
      items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Deletes an outbox entry once it has been synchronized to Firebase.
 *
 * @param {string} id - Outbox item ID
 * @returns {Promise<void>}
 */
export const deleteOutboxItem = async (id) => {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Returns the count of pending outbox items.
 *
 * @param {string} [uid] - Optional user UID to filter by
 * @returns {Promise<number>}
 */
export const getOutboxCount = async (uid) => {
  const items = await getOutboxItems(uid);
  return items.length;
};
