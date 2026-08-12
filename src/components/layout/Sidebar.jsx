import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import wmirsLogo from "../../assets/wmirs-logo.png";
import "../../styles/dashboard.css";

// Nav items configuration
const NAV_ITEMS = [
  // Dashboard handles where it points based on role
  { id: "nav-dashboard",        icon: "dashboard",              label: "Dashboard",           path: "/dashboard", adminPath: "/admin/dashboard", staffPath: "/staff/dashboard", roles: ["admin", "staff", "ranger"] },
  // Open Assignments for all
  { id: "nav-assignments",      icon: "assignment",             label: "Open Assignments",    path: "/assignments", roles: ["admin", "staff", "ranger"] },
  // Forest Ranger Submission & History Links (Rangers Only)
  { id: "nav-incidents",        icon: "warning",                label: "Submit Incident",     path: "/incidents", roles: ["ranger"] },
  { id: "nav-monitoring",       icon: "monitoring",             label: "Submit Monitoring",   path: "/monitoring", roles: ["ranger"] },
  { id: "nav-inc-history",      icon: "history",                label: "Incident History",    path: "/incidents/history", roles: ["ranger"] },
  { id: "nav-mon-history",      icon: "history_edu",            label: "Monitoring History",  path: "/monitoring/history", roles: ["ranger"] },
  // Admin links
  { id: "nav-admin-incidents",  icon: "content_paste_search",   label: "Incidents Management", path: "/admin/incidents", roles: ["admin"] },
  { id: "nav-admin-mon",        icon: "fact_check",             label: "Monitoring Management", path: "/admin/monitoring", roles: ["admin"] },
  { id: "nav-users",            icon: "group",                  label: "User Management",       path: "/admin/users",  roles: ["admin"] },
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

  const handleNavClick = (item) => {
    let targetPath = item.path;
    if (userRole === "admin" && item.adminPath) targetPath = item.adminPath;
    if (userRole === "staff" && item.staffPath) targetPath = item.staffPath;
    navigate(targetPath);
    // Close the mobile drawer after navigation
    if (onClose) onClose();
  };

  const isActive = (item) => {
    let targetPath = item.path;
    if (userRole === "admin" && item.adminPath) targetPath = item.adminPath;
    if (userRole === "staff" && item.staffPath) targetPath = item.staffPath;
    
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
          return item.roles.includes(userRole || "ranger");
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
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Sidebar;
