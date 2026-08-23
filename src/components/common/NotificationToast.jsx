import { useEffect } from "react";

const TOAST_DURATION_MS = 5000;

/**
 * Renders a floating real-time in-app notification toast.
 * Auto-dismisses after 5 seconds and handles click-through navigation.
 * 
 * @param {object} props
 * @param {object|null} props.notification
 * @param {string} [props.notification.title]
 * @param {string} [props.notification.message]
 * @param {string} [props.notification.link]
 * @param {function} props.onClose
 * @param {function} [props.onNavigate]
 */
function NotificationToast({ notification, onClose, onNavigate }) {
  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      onClose();
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const handleClick = () => {
    if (onNavigate && notification.link) {
      onNavigate(notification.link);
    }
    onClose();
  };

  return (
    <div className="notif-toast-container" role="status" aria-live="polite">
      <div 
        className="notif-toast"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
      >
        <span className="material-symbols-outlined notif-toast__icon-wrap" aria-hidden="true">
          notifications_active
        </span>

        <div className="notif-toast__body">
          <h4 className="notif-toast__title">{notification.title}</h4>
          <p className="notif-toast__message">{notification.message}</p>
        </div>

        <button
          className="notif-toast__close-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Dismiss notification"
          type="button"
        >
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </div>
    </div>
  );
}

export default NotificationToast;
