import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import wmirsLogo from "../../assets/wmirs-logo.png";
import "../../styles/dashboard.css";

const STANDARD_NAV_ITEMS = [
  // Dashboard handles where it points based on role
  { id: "nav-dashboard", icon: "dashboard", label: "Dashboard", path: "/dashboard", staffPath: "/staff/dashboard", roles: ["staff", "ranger"] },
  
  // Scoped Staff Workspace links
  { id: "nav-staff-awaiting", icon: "mark_email_unread", label: "Awaiting Review", path: "/staff/workspace/awaiting-review", roles: ["staff"] },
  { id: "nav-staff-active", icon: "assignment", label: "Active Assignments", path: "/staff/workspace/active-assignments", roles: ["staff"] },
  { id: "nav-staff-verify", icon: "pending_actions", label: "Pending Verification", path: "/staff/workspace/pending-verification", roles: ["staff"] },
  { id: "nav-staff-archive", icon: "task_alt", label: "Completed Archive", path: "/staff/workspace/completed-archive", roles: ["staff"] },

  // Open Assignments (Ranger only in standard menu)
  { id: "nav-assignments", icon: "assignment_ind", label: "Open Assignments", path: "/assignments", roles: ["ranger"] },
  
  // Forest Ranger Submission & History Links (Rangers Only)
  { id: "nav-submit", icon: "add_circle", label: "Submit Report", path: "/submit", roles: ["ranger"] },
  { id: "nav-inc-history", icon: "history", label: "Incident History", path: "/incidents/history", roles: ["ranger"] },
  { id: "nav-mon-history", icon: "history_edu", label: "Monitoring History", path: "/monitoring/history", roles: ["ranger"] }
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  // User manual toggle overrides:
  // Incidents and Monitoring groups open by default.
  // BMS, Water, and Compliance subcategories collapsed by default (unless clicked or on active route).
  const isBmsActive = location.pathname.startsWith("/admin/monitoring/bms");
  const isWaterActive = location.pathname.startsWith("/admin/monitoring/water");
  const isComplianceActive = location.pathname.startsWith("/admin/monitoring/compliance");

  const [toggled, setToggled] = useState({
    incidents: true,
    monitoring: true,
    bms: isBmsActive,
    water: isWaterActive,
    compliance: isComplianceActive
  });

  const incidentsOpen = toggled.incidents ?? true;
  const monitoringOpen = toggled.monitoring ?? true;
  const bmsOpen = toggled.bms ?? isBmsActive;
  const waterOpen = toggled.water ?? isWaterActive;
  const complianceOpen = toggled.compliance ?? isComplianceActive;

  const toggleSection = (sectionKey, currentState) => {
    setToggled(prev => ({ ...prev, [sectionKey]: !currentState }));
  };

  const handleNav = (targetPath) => {
    navigate(targetPath);
    if (onClose) onClose();
  };

  const isActive = (targetPath, exact = true) => {
    if (exact) return location.pathname === targetPath;
    return location.pathname.startsWith(targetPath);
  };

  return (
    <nav className={`sidebar${isOpen ? " sidebar--open" : ""}`} aria-label="Main navigation">
      {/* Logo block */}
      <div className="sidebar-logo">
        <img src={wmirsLogo} alt="WMIRS Logo" className="sidebar-logo__img" />
        <div className="sidebar-logo__text">
          <span className="sidebar-logo__name">
            WM<span>IRS</span>
          </span>
          <span className="sidebar-logo__sub">Monitoring System</span>
        </div>
      </div>

      {/* Navigation items */}
      <div className="sidebar-nav" role="list">
        <span className="sidebar-nav__section-label">Navigation</span>

        {isAdmin ? (
          /* ── Admin Hierarchical Navigation Tree ── */
          <>
            {/* 1. Executive Dashboard */}
            <button
              id="admin-nav-dashboard"
              role="listitem"
              className={`sidebar-nav__item${isActive("/admin/dashboard") ? " sidebar-nav__item--active" : ""}`}
              onClick={() => handleNav("/admin/dashboard")}
              aria-current={isActive("/admin/dashboard") ? "page" : undefined}
            >
              <span className="sidebar-nav__icon" aria-hidden="true">
                <span className="material-symbols-outlined">dashboard</span>
              </span>
              <span className="sidebar-nav__label">Dashboard</span>
            </button>

            {/* 2. Incidents (Collapsible) */}
            <div className="sidebar-accordion">
              <button
                type="button"
                className={`sidebar-accordion__header${isActive("/admin/incidents", false) ? " sidebar-accordion__header--active" : ""}`}
                onClick={() => toggleSection("incidents", incidentsOpen)}
              >
                <span className="sidebar-nav__icon" aria-hidden="true">
                  <span className="material-symbols-outlined">content_paste_search</span>
                </span>
                <span className="sidebar-nav__label">Incidents</span>
                <span className={`material-symbols-outlined sidebar-accordion__chevron${incidentsOpen ? " sidebar-accordion__chevron--open" : ""}`}>
                  expand_more
                </span>
              </button>

              {incidentsOpen && (
                <div className="sidebar-submenu">
                  <button
                    type="button"
                    className={`sidebar-submenu__item${isActive("/admin/incidents") ? " sidebar-submenu__item--active" : ""}`}
                    onClick={() => handleNav("/admin/incidents")}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>list_alt</span>
                    <span>Logs</span>
                  </button>
                  <button
                    type="button"
                    className={`sidebar-submenu__item${isActive("/admin/incidents/analytics") ? " sidebar-submenu__item--active" : ""}`}
                    onClick={() => handleNav("/admin/incidents/analytics")}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>insights</span>
                    <span>Analytics</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Monitoring (Accordion Parent) */}
            <div className="sidebar-accordion">
              <button
                type="button"
                className={`sidebar-accordion__header${isActive("/admin/monitoring", false) ? " sidebar-accordion__header--active" : ""}`}
                onClick={() => toggleSection("monitoring", monitoringOpen)}
              >
                <span className="sidebar-nav__icon" aria-hidden="true">
                  <span className="material-symbols-outlined">fact_check</span>
                </span>
                <span className="sidebar-nav__label">Monitoring</span>
                <span className={`material-symbols-outlined sidebar-accordion__chevron${monitoringOpen ? " sidebar-accordion__chevron--open" : ""}`}>
                  expand_more
                </span>
              </button>

              {monitoringOpen && (
                <div className="sidebar-submenu">
                  {/* BMS Category */}
                  <div className="sidebar-nested-group">
                    <button
                      type="button"
                      className={`sidebar-nested-header${isActive("/admin/monitoring/bms", false) ? " sidebar-nested-header--active" : ""}`}
                      onClick={() => toggleSection("bms", bmsOpen)}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-[#00b545]">forest</span>
                        <span>BMS</span>
                      </span>
                      <span className={`material-symbols-outlined sidebar-nested-chevron${bmsOpen ? " sidebar-nested-chevron--open" : ""}`}>
                        expand_more
                      </span>
                    </button>
                    {bmsOpen && (
                      <div className="sidebar-nested-list">
                        <button
                          type="button"
                          className={`sidebar-submenu__item${isActive("/admin/monitoring/bms/logs") ? " sidebar-submenu__item--active" : ""}`}
                          onClick={() => handleNav("/admin/monitoring/bms/logs")}
                        >
                          <span className="material-symbols-outlined text-[14px]">table_rows</span>
                          <span>Logs</span>
                        </button>
                        <button
                          type="button"
                          className={`sidebar-submenu__item${isActive("/admin/monitoring/bms/analytics") ? " sidebar-submenu__item--active" : ""}`}
                          onClick={() => handleNav("/admin/monitoring/bms/analytics")}
                        >
                          <span className="material-symbols-outlined text-[14px]">insights</span>
                          <span>Analytics</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Water Category */}
                  <div className="sidebar-nested-group">
                    <button
                      type="button"
                      className={`sidebar-nested-header${isActive("/admin/monitoring/water", false) ? " sidebar-nested-header--active" : ""}`}
                      onClick={() => toggleSection("water", waterOpen)}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-[#3d8eff]">water</span>
                        <span>Water</span>
                      </span>
                      <span className={`material-symbols-outlined sidebar-nested-chevron${waterOpen ? " sidebar-nested-chevron--open" : ""}`}>
                        expand_more
                      </span>
                    </button>
                    {waterOpen && (
                      <div className="sidebar-nested-list">
                        <button
                          type="button"
                          className={`sidebar-submenu__item${isActive("/admin/monitoring/water/logs") ? " sidebar-submenu__item--active" : ""}`}
                          onClick={() => handleNav("/admin/monitoring/water/logs")}
                        >
                          <span className="material-symbols-outlined text-[14px]">table_rows</span>
                          <span>Logs</span>
                        </button>
                        <button
                          type="button"
                          className={`sidebar-submenu__item${isActive("/admin/monitoring/water/analytics") ? " sidebar-submenu__item--active" : ""}`}
                          onClick={() => handleNav("/admin/monitoring/water/analytics")}
                        >
                          <span className="material-symbols-outlined text-[14px]">insights</span>
                          <span>Analytics</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Compliance Category */}
                  <div className="sidebar-nested-group">
                    <button
                      type="button"
                      className={`sidebar-nested-header${isActive("/admin/monitoring/compliance", false) ? " sidebar-nested-header--active" : ""}`}
                      onClick={() => toggleSection("compliance", complianceOpen)}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-[#fa6e39]">verified_user</span>
                        <span>Compliance</span>
                      </span>
                      <span className={`material-symbols-outlined sidebar-nested-chevron${complianceOpen ? " sidebar-nested-chevron--open" : ""}`}>
                        expand_more
                      </span>
                    </button>
                    {complianceOpen && (
                      <div className="sidebar-nested-list">
                        <button
                          type="button"
                          className={`sidebar-submenu__item${isActive("/admin/monitoring/compliance/logs") ? " sidebar-submenu__item--active" : ""}`}
                          onClick={() => handleNav("/admin/monitoring/compliance/logs")}
                        >
                          <span className="material-symbols-outlined text-[14px]">table_rows</span>
                          <span>Logs</span>
                        </button>
                        <button
                          type="button"
                          className={`sidebar-submenu__item${isActive("/admin/monitoring/compliance/analytics") ? " sidebar-submenu__item--active" : ""}`}
                          onClick={() => handleNav("/admin/monitoring/compliance/analytics")}
                        >
                          <span className="material-symbols-outlined text-[14px]">insights</span>
                          <span>Analytics</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. User Management */}
            <button
              id="admin-nav-users"
              role="listitem"
              className={`sidebar-nav__item${isActive("/admin/users") ? " sidebar-nav__item--active" : ""}`}
              onClick={() => handleNav("/admin/users")}
              aria-current={isActive("/admin/users") ? "page" : undefined}
            >
              <span className="sidebar-nav__icon" aria-hidden="true">
                <span className="material-symbols-outlined">group</span>
              </span>
              <span className="sidebar-nav__label">User Management</span>
            </button>

            {/* 5. Open Assignments */}
            <button
              id="admin-nav-assignments"
              role="listitem"
              className={`sidebar-nav__item${isActive("/assignments") ? " sidebar-nav__item--active" : ""}`}
              onClick={() => handleNav("/assignments")}
              aria-current={isActive("/assignments") ? "page" : undefined}
            >
              <span className="sidebar-nav__icon" aria-hidden="true">
                <span className="material-symbols-outlined">assignment_ind</span>
              </span>
              <span className="sidebar-nav__label">Open Assignments</span>
            </button>
          </>
        ) : (
          /* ── Staff & Ranger Standard Menu ── */
          STANDARD_NAV_ITEMS.filter((item) => {
            return item.roles.includes(userRole || "ranger");
          }).map((item) => {
            const targetPath = (userRole === "staff" && item.staffPath) ? item.staffPath : item.path;
            const active = location.pathname === targetPath;
            return (
              <button
                key={item.id}
                id={item.id}
                role="listitem"
                className={`sidebar-nav__item${active ? " sidebar-nav__item--active" : ""}`}
                onClick={() => handleNav(targetPath)}
                aria-current={active ? "page" : undefined}
              >
                <span className="sidebar-nav__icon" aria-hidden="true">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </span>
                <span className="sidebar-nav__label">{item.label}</span>
              </button>
            );
          })
        )}
      </div>
    </nav>
  );
}
