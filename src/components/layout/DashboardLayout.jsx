import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Sidebar from "./Sidebar";
import "../../styles/dashboard.css";

// Map pathnames to human-readable page titles for the topbar breadcrumb
const PAGE_TITLES = {
  "/dashboard":       "Dashboard",
  "/admin/dashboard": "Admin Dashboard",
  "/monitoring":      "Monitoring",
  "/incidents":       "Incident Reports",
  "/reports":         "Reports & Analytics",
  "/admin/users":     "User Management",
  "/settings":        "Settings",
};

/**
 * DashboardLayout — shared shell for all authenticated dashboard pages.
 * Composes Sidebar + Topbar + mobile bottom bar around the page content.
 *
 * Props:
 *   children        {ReactNode} — the page content to render in the content area
 *   pageTitle       {string}    — optional override for the topbar page title
 */
function DashboardLayout({ children, pageTitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const location  = useLocation();
  const { userRole } = useAuth();

  const isAdmin         = userRole === "admin";
  const resolvedTitle   = pageTitle || PAGE_TITLES[location.pathname] || "WMIRS";

  const handleSidebarClose = () => setSidebarOpen(false);

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

            <div>
              <div className="topbar__page-title">{resolvedTitle}</div>
              <div className="topbar__breadcrumb">
                <span>WMIRS</span>
                <span className="topbar__breadcrumb-sep">›</span>
                <span>{resolvedTitle}</span>
              </div>
            </div>
          </div>

          <div className="topbar__right">
            {/* Role pill badge */}
            <div
              className={`topbar__role-badge${isAdmin ? " topbar__role-badge--admin" : " topbar__role-badge--user"}`}
            >
              <div className="topbar__role-badge__dot" aria-hidden="true" />
              {isAdmin ? "Administrator" : "ENRO Staff"}
            </div>
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
