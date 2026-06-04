import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import wmirsLogo from "../../assets/wmirs-logo.png";
import "../../styles/dashboard.css";

// Nav items configuration — role-gated items are flagged with adminOnly
const NAV_ITEMS = [
  { id: "nav-dashboard",        icon: "dashboard",              label: "Dashboard",           path: "/dashboard", adminPath: "/admin/dashboard" },
  { id: "nav-incidents",        icon: "warning",                label: "Submit Incident",     path: "/incidents", userOnly: true },
  { id: "nav-monitoring",       icon: "monitoring",             label: "Submit Monitoring",   path: "/monitoring", userOnly: true },
  { id: "nav-inc-history",      icon: "history",                label: "Incident History",    path: "/incidents/history", userOnly: true },
  { id: "nav-mon-history",      icon: "history_edu",            label: "Monitoring History",  path: "/monitoring/history", userOnly: true },
  { id: "nav-admin-incidents",  icon: "content_paste_search",   label: "Incidents", path: "/admin/incidents", adminOnly: true },
  { id: "nav-admin-mon",        icon: "fact_check",             label: "Monitoring",    path: "/admin/monitoring", adminOnly: true },
  { id: "nav-users",            icon: "group",                  label: "Users",     path: "/admin/users",  adminOnly: true },
];

/**
 * Sidebar component — fixed left navigation panel.
 * Props:
 *   isOpen   {boolean}  — controls mobile slide-in state
 *   onClose  {Function} — callback to close the mobile sidebar
 */
function Sidebar({ isOpen, onClose }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { userRole } = useAuth();

  const isAdmin = userRole === "admin";

  const handleNavClick = (item) => {
    // Admins visiting the "Dashboard" nav item land on /admin/dashboard
    const targetPath = (item.adminPath && isAdmin) ? item.adminPath : item.path;
    navigate(targetPath);
    // Close the mobile drawer after navigation
    if (onClose) onClose();
  };

  // Determine the currently active nav item by pathname
  const isActive = (item) => {
    const targetPath = (item.adminPath && isAdmin) ? item.adminPath : item.path;
    
    if (location.pathname === targetPath) return true;
    
    // Prevent root paths from staying active when we are inside their history sub-paths
    if (targetPath === "/monitoring" && location.pathname.startsWith("/monitoring/history")) {
      return false;
    }
    if (targetPath === "/incidents" && location.pathname.startsWith("/incidents/history")) {
      return false;
    }

    return location.pathname.startsWith(targetPath + "/");
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

        {NAV_ITEMS.filter((item) => {
          if (isAdmin && item.userOnly) return false;
          if (!isAdmin && item.adminOnly) return false;
          return true;
        }).map((item) => (
          <button
            key={item.id}
            id={item.id}
            role="listitem"
            className={`sidebar-nav__item${isActive(item) ? " sidebar-nav__item--active" : ""}`}
            onClick={() => handleNavClick(item)}
            aria-current={isActive(item) ? "page" : undefined}
          >
            <span className="sidebar-nav__icon" aria-hidden="true">
              <span className="material-symbols-outlined">{item.icon}</span>
            </span>
            <span className="sidebar-nav__label">{item.label}</span>
            {item.adminOnly && (
              <span className="sidebar-nav__admin-badge">Admin</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Sidebar;
