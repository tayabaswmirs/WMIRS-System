import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { formatRelativeTime } from "../../utils/formatTime";
import "../../styles/notifications.css";

const CATEGORY_ICON_MAP = {
  incidents: "report_problem",
  BMS: "forest",
  Water: "water_drop",
  Compliance: "policy",
  system: "notifications"
};

const getCategoryModifier = (category) => {
  const cat = String(category || "").toLowerCase();
  if (cat === "incidents") return "notif-item__icon-wrap--urgent";
  if (cat === "water") return "notif-item__icon-wrap--water";
  if (cat === "bms") return "notif-item__icon-wrap--bms";
  if (cat === "compliance") return "notif-item__icon-wrap--compliance";
  return "";
};

/**
 * Topbar Notification Bell with live unread badge and responsive popover tray.
 */
function NotificationBell({ onNavigateOverride }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  const handleItemClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    setIsOpen(false);
    if (onNavigateOverride) {
      onNavigateOverride(notif);
    } else if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="notif-bell-container" ref={dropdownRef} style={{ position: "relative" }}>
      <button
        id="topbar-notifications-btn"
        className={`notif-bell-btn${isOpen ? " notif-bell-btn--active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="View notifications"
        aria-expanded={isOpen}
        type="button"
        title="Notifications"
      >
        <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
        {unreadCount > 0 && (
          <span className="notif-badge" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-popover" role="dialog" aria-label="Notifications tray">
          <div className="notif-popover__header">
            <div className="notif-popover__title-wrap">
              <h3 className="notif-popover__title">Notifications</h3>
              {unreadCount > 0 && (
                <span className="notif-popover__count-tag">{unreadCount} new</span>
              )}
            </div>
            <button
              className="notif-popover__mark-all-btn"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              type="button"
            >
              Mark all read
            </button>
          </div>

          <div className="notif-popover__list" role="list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span className="material-symbols-outlined notif-empty__icon" aria-hidden="true">
                  notifications_off
                </span>
                <p className="notif-empty__text">No notifications yet</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`notif-item${!item.isRead ? " notif-item--unread" : ""}`}
                  onClick={() => handleItemClick(item)}
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleItemClick(item)}
                >
                  <div className={`notif-item__icon-wrap ${getCategoryModifier(item.category)}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>
                      {CATEGORY_ICON_MAP[item.category] || "notifications"}
                    </span>
                  </div>

                  <div className="notif-item__content">
                    <h4 className="notif-item__title">{item.title}</h4>
                    <p className="notif-item__message">{item.message}</p>
                    <div className="notif-item__meta">
                      {item.category && (
                        <span className="notif-item__category-badge">{item.category}</span>
                      )}
                      <span>{formatRelativeTime(item.createdAt)}</span>
                    </div>
                  </div>

                  <button
                    className="notif-toast__close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(item.id);
                    }}
                    title="Dismiss"
                    type="button"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                      close
                    </span>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="notif-popover__footer">
            <span>Showing latest 20 notifications (Auto-pruned)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
