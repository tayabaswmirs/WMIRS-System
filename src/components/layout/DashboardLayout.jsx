import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";
import NotificationToast from "../common/NotificationToast";
import { useNotifications } from "../../hooks/useNotifications";
import Avatar from "../common/Avatar";
import "../../styles/dashboard.css";

/**
 * DashboardLayout — shared shell for all authenticated dashboard pages.
 * Composes Sidebar + Topbar around the page content.
 *
 * Props:
 *   children        {ReactNode} — the page content to render in the content area
 */
function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const { currentUser, profileData, userRole, logout } = useAuth();
  const { toastNotification, dismissToast } = useNotifications();

  const displayName = currentUser?.displayName || profileData?.name || "User";

  const handleSidebarClose = () => setSidebarOpen(false);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    try {
      setProfileMenuOpen(false);
      await logout();
    } catch (err) {
      console.error("Topbar logout error:", err);
    }
  };

  const roleLabel = userRole === "admin" ? "Administrator" : userRole === "staff" ? "ENRO Staff" : "Forest Ranger";

  return (
    <div className="dashboard-shell">
      {/* ── Mobile overlay (taps close the sidebar) ─────────── */}
      <div
        className={`sidebar-overlay${sidebarOpen ? " sidebar-overlay--visible" : ""}`}
        onClick={handleSidebarClose}
        aria-hidden="true"
      />

      {/* ── Left Sidebar ────────────────────────────────────── */}
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

      {/* ── Right Content Area ──────────────────────────────── */}
      <div className="dashboard-content">

        {/* Topbar */}
        <header className="topbar" role="banner">
          <div className="topbar__left">
            {/* Hamburger — visible only on mobile */}
            <button
              id="topbar-hamburger-btn"
              className="topbar__hamburger"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              type="button"
            >
              <span className="material-symbols-outlined" aria-hidden="true">menu</span>
            </button>
          </div>

          <div className="topbar__right">
            {/* Notification Bell */}
            <NotificationBell />

            {/* ── Desktop Controls (>= 768px) ── */}
            <div className="topbar-desktop-actions">
              {/* User Profile Info (Unpressable) */}
              <div className="topbar-user-profile-static">
                <Avatar
                  src={profileData?.photoURL || currentUser?.photoURL}
                  name={displayName}
                  role={userRole}
                  size="sm"
                />
                <div className="topbar-user-meta">
                  <span className="topbar-user-name">
                    {displayName}
                  </span>
                  <span className="topbar-user-role">
                    {roleLabel}
                  </span>
                </div>
              </div>

              {/* User Settings button */}
              <button
                id="topbar-settings-btn"
                className="topbar-settings-btn"
                onClick={() => navigate("/profile")}
                title="Go to Profile Settings"
                type="button"
              >
                <span className="material-symbols-outlined" aria-hidden="true">settings</span>
              </button>

              {/* Sign Out Button */}
              <button
                id="topbar-logout-btn"
                className="topbar-logout-btn"
                onClick={handleLogout}
                type="button"
              >
                <span className="material-symbols-outlined" aria-hidden="true">logout</span>
                <span>Sign Out</span>
              </button>
            </div>

            {/* ── Mobile Controls (< 768px) ── */}
            <div className="topbar-mobile-actions" ref={menuRef}>
              <button
                id="topbar-mobile-avatar-btn"
                className={`topbar-mobile-avatar-btn${profileMenuOpen ? " topbar-mobile-avatar-btn--active" : ""}`}
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-label="User Account Menu"
                aria-expanded={profileMenuOpen}
                aria-haspopup="true"
                type="button"
              >
                <Avatar
                  src={profileData?.photoURL || currentUser?.photoURL}
                  name={displayName}
                  role={userRole}
                  size="sm"
                />
                <span className="material-symbols-outlined topbar-mobile-avatar-chevron" aria-hidden="true">
                  {profileMenuOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {/* Mobile Account Popover Menu */}
              {profileMenuOpen && (
                <div className="topbar-account-menu" role="menu" aria-label="User options">
                  <div className="topbar-account-menu__header">
                    <Avatar
                      src={profileData?.photoURL || currentUser?.photoURL}
                      name={displayName}
                      role={userRole}
                      size="md"
                    />
                    <div className="topbar-account-menu__user-info">
                      <span className="topbar-account-menu__name">{displayName}</span>
                      <span className="topbar-account-menu__role">{roleLabel}</span>
                    </div>
                  </div>

                  <div className="topbar-account-menu__divider" />

                  <button
                    className="topbar-account-menu__item"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate("/profile");
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">settings</span>
                    <span>Profile & Settings</span>
                  </button>

                  <div className="topbar-account-menu__divider" />

                  <button
                    className="topbar-account-menu__item topbar-account-menu__item--danger"
                    onClick={handleLogout}
                    role="menuitem"
                    type="button"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content slot */}
        <main className="dashboard-main" id="main-content" role="main">
          {children}
        </main>
      </div>

      {/* Real-time In-App Notification Toast */}
      <NotificationToast
        notification={toastNotification}
        onClose={dismissToast}
        onNavigate={(link) => navigate(link)}
      />
    </div>
  );
}

export default DashboardLayout;
