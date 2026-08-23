import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotification
} from "../firebase/services/notificationService";

/**
 * Custom React hook for subscribing to the authenticated user's notifications.
 * Manages real-time state, unread counting, and incoming toast trigger queues.
 * 
 * @returns {{
 *   notifications: Array<object>,
 *   unreadCount: number,
 *   loading: boolean,
 *   toastNotification: object|null,
 *   markAsRead: (id: string) => Promise<boolean>,
 *   markAllAsRead: () => Promise<number>,
 *   removeNotification: (id: string) => Promise<boolean>,
 *   dismissToast: () => void
 * }}
 */
export const useNotifications = () => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || null;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(Boolean(uid));
  const [toastNotification, setToastNotification] = useState(null);
  
  const knownIdsRef = useRef(new Set());
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (!uid) {
      return;
    }

    const knownIds = knownIdsRef.current;

    const unsubscribe = subscribeToUserNotifications(
      uid,
      (items) => {
        setNotifications(items);
        setLoading(false);

        // Check if any incoming notification is new (post-initial-load)
        if (initialLoadDoneRef.current) {
          const freshItem = items.find((item) => !knownIds.has(item.id) && !item.isRead);
          if (freshItem) {
            setToastNotification(freshItem);
          }
        }

        // Update known IDs
        items.forEach((item) => knownIds.add(item.id));
        initialLoadDoneRef.current = true;
      },
      () => {
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      knownIds.clear();
      initialLoadDoneRef.current = false;
    };
  }, [uid]);

  const activeNotifications = uid ? notifications : [];
  const unreadCount = activeNotifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback(async (notificationId) => {
    if (!uid || !notificationId) return false;
    return await markNotificationAsRead(uid, notificationId);
  }, [uid]);

  const markAllAsRead = useCallback(async () => {
    if (!uid) return 0;
    return await markAllNotificationsAsRead(uid);
  }, [uid]);

  const removeNotification = useCallback(async (notificationId) => {
    if (!uid || !notificationId) return false;
    return await clearNotification(uid, notificationId);
  }, [uid]);

  const dismissToast = useCallback(() => {
    setToastNotification(null);
  }, []);

  return {
    notifications: activeNotifications,
    unreadCount,
    loading: uid ? loading : false,
    toastNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    dismissToast
  };
};
