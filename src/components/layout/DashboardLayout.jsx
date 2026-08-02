import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Sidebar from "./Sidebar";
import "../../styles/dashboard.css";

/**
 * DashboardLayout — shared shell for all authenticated dashboard pages.
 * Composes Sidebar + Topbar + mobile bottom bar around the page content.
 *
 * Props:
 *   children        {ReactNode} — the page content to render in the content area
 *   pageTitle       {string}    — optional override for the topbar page title
 */
function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const { currentUser, profileData, userRole, logout } = useAuth();

  const displayName = currentUser?.displayName || profileData?.name || "User";
  // Generate initials for the avatar placeholder
  const initials    = displayName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const handleSidebarClose = () => setSidebarOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Topbar logout error:", err);
    }
  };

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
            {/* User Profile Info (Unpressable) */}
            <div className="topbar-user-profile-static">
              <div className="topbar-user-avatar" aria-hidden="true">
                {initials}
              </div>
              <div className="topbar-user-meta">
                <span className="topbar-user-name">
                  {displayName}
                </span>
                <span className="topbar-user-role">
                  {userRole === "admin" ? "Administrator" : userRole === "staff" ? "ENRO Staff" : "Forest Ranger"}
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
        </header>

        {/* Page content slot */}
        <main className="dashboard-main" id="main-content" role="main">
          {children}
        </main>
      </div>

    </div>
  );
}

export default DashboardLayout;
