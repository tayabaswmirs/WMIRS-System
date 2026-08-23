import {
  collection,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";

const MAX_NOTIFICATIONS_QUERY_LIMIT = 20;
const BATCH_SIZE_LIMIT = 500;

/**
 * Validates the core shape of a notification payload.
 * @param {object} payload
 * @returns {boolean}
 */
const isValidPayload = (payload) => {
  return Boolean(payload && payload.title && payload.message && payload.type);
};

/**
 * Sends a single in-app notification to a designated user.
 * 
 * @param {string} userId - Recipient user UID
 * @param {object} payload - Notification data
 * @param {string} payload.title - Notification title
 * @param {string} payload.message - Notification descriptive message
 * @param {string} payload.type - Event type identifier (e.g., 'incident_created')
 * @param {string} [payload.category='system'] - Domain category ('incidents', 'BMS', 'Water', 'Compliance', 'system')
 * @param {string} [payload.referenceId] - Associated entity document ID
 * @param {string} [payload.referenceType] - Associated entity type ('incident', 'monitoring', 'user')
 * @param {string} [payload.link] - Navigation path
 * @param {object} [payload.sender] - Dispatcher identity { uid, name, role }
 * @returns {Promise<string|null>} Created notification ID or null on failure
 */
export const sendNotification = async (userId, payload) => {
  if (!userId || !isValidPayload(payload)) {
    return null;
  }

  try {
    const userNotifsRef = collection(db, "users", userId, "notifications");
    const notifDoc = doc(userNotifsRef);
    
    await setDoc(notifDoc, {
      id: notifDoc.id,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      category: payload.category || "system",
      referenceId: payload.referenceId || null,
      referenceType: payload.referenceType || null,
      link: payload.link || null,
      isRead: false,
      readAt: null,
      createdAt: serverTimestamp(),
      sender: payload.sender || { uid: "system", name: "WMIRS System", role: "system" }
    });

    return notifDoc.id;
  } catch (error) {
    console.error("Failed to deliver notification:", error);
    return null;
  }
};

/**
 * Dispatches a notification to all users matching a specific role and optional staff scope.
 * 
 * @param {object} target - Targeting criteria
 * @param {string} target.role - Target role ('admin', 'staff', 'ranger')
 * @param {string} [target.staffScope] - Optional staff category scope ('incidents', 'BMS', 'Water', 'Compliance')
 * @param {object} payload - Notification payload
 * @returns {Promise<number>} Number of recipients notified
 */
export const sendRoleNotification = async (target, payload) => {
  if (!target?.role || !isValidPayload(payload)) {
    return 0;
  }

  try {
    let usersQuery = query(collection(db, "users"), where("role", "==", target.role));
    
    if (target.staffScope && target.role === "staff") {
      usersQuery = query(
        collection(db, "users"),
        where("role", "==", "staff"),
        where("staffScope", "==", target.staffScope)
      );
    }

    const snapshot = await getDocs(usersQuery);
    if (snapshot.empty) {
      return 0;
    }

    const batch = writeBatch(db);
    let operationCount = 0;

    snapshot.docs.forEach((userDoc) => {
      if (operationCount >= BATCH_SIZE_LIMIT) {
        return;
      }
      const targetUserId = userDoc.id;
      const notifDocRef = doc(collection(db, "users", targetUserId, "notifications"));

      batch.set(notifDocRef, {
        id: notifDocRef.id,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        category: payload.category || (target.staffScope || "system"),
        referenceId: payload.referenceId || null,
        referenceType: payload.referenceType || null,
        link: payload.link || null,
        isRead: false,
        readAt: null,
        createdAt: serverTimestamp(),
        sender: payload.sender || { uid: "system", name: "WMIRS System", role: "system" }
      });

      operationCount++;
    });

    if (operationCount > 0) {
      await batch.commit();
    }

    return operationCount;
  } catch (error) {
    console.error("Failed to fan-out role notifications:", error);
    return 0;
  }
};

/**
 * Marks an individual notification as read.
 * 
 * @param {string} userId - User UID
 * @param {string} notificationId - Notification document ID
 * @returns {Promise<boolean>} Success status
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  if (!userId || !notificationId) {
    return false;
  }

  try {
    const notifRef = doc(db, "users", userId, "notifications", notificationId);
    await updateDoc(notifRef, {
      isRead: true,
      readAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return false;
  }
};

/**
 * Marks all unread notifications for a user as read.
 * 
 * @param {string} userId - User UID
 * @returns {Promise<number>} Number of notifications marked read
 */
export const markAllNotificationsAsRead = async (userId) => {
  if (!userId) {
    return 0;
  }

  try {
    const unreadQuery = query(
      collection(db, "users", userId, "notifications"),
      where("isRead", "==", false)
    );

    const snapshot = await getDocs(unreadQuery);
    if (snapshot.empty) {
      return 0;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, {
        isRead: true,
        readAt: serverTimestamp()
      });
    });

    await batch.commit();
    return snapshot.size;
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return 0;
  }
};

/**
 * Clears/deletes a single notification.
 * 
 * @param {string} userId - User UID
 * @param {string} notificationId - Notification ID
 * @returns {Promise<boolean>} Success status
 */
export const clearNotification = async (userId, notificationId) => {
  if (!userId || !notificationId) {
    return false;
  }

  try {
    const notifRef = doc(db, "users", userId, "notifications", notificationId);
    await deleteDoc(notifRef);
    return true;
  } catch (error) {
    console.error("Failed to clear notification:", error);
    return false;
  }
};

/**
 * Subscribes to real-time notifications for a user, restricted to the 20 newest items.
 * 
 * @param {string} userId - User UID
 * @param {function} onUpdate - Callback receiving Array<Notification>
 * @param {function} [onError] - Optional error handler
 * @returns {function} Unsubscribe function
 */
export const subscribeToUserNotifications = (userId, onUpdate, onError) => {
  if (!userId) {
    return () => {};
  }

  const notifsQuery = query(
    collection(db, "users", userId, "notifications"),
    orderBy("createdAt", "desc"),
    limit(MAX_NOTIFICATIONS_QUERY_LIMIT)
  );

  return onSnapshot(
    notifsQuery,
    (snapshot) => {
      const notifications = snapshot.docs.map((docSnap) => ({
        ...docSnap.data(),
        id: docSnap.id
      }));
      onUpdate(notifications);
    },
    (err) => {
      console.error("User notifications snapshot error:", err);
      if (onError) {
        onError(err);
      }
    }
  );
};
