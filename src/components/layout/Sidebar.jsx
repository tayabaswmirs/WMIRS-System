import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import wmirsLogo from "../../assets/wmirs-logo.png";
import "../../styles/dashboard.css";

// Nav items configuration — role-gated items are flagged with adminOnly
const NAV_ITEMS = [
  { id: "nav-dashboard",  icon: "dashboard",       label: "Dashboard",      path: "/dashboard",    adminPath: "/admin/dashboard" },
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
  const { currentUser, userRole, profileData, logout } = useAuth();

  const isAdmin       = userRole === "admin";
  const displayName   = currentUser?.displayName || profileData?.name || "User";
  // Generate initials for the avatar placeholder
  const initials      = displayName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Sidebar logout error:", err);
    }
  };

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
    return location.pathname === targetPath || location.pathname.startsWith(targetPath + "/");
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

        {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
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

      {/* User card + logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-user-card__avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="sidebar-user-card__info">
            <div className="sidebar-user-card__name" title={displayName}>
              {displayName}
            </div>
            <div className="sidebar-user-card__role">{userRole || "staff"}</div>
          </div>
        </div>

        <button
          id="sidebar-logout-btn"
          className="sidebar-logout-btn"
          onClick={handleLogout}
          type="button"
        >
          <span className="material-symbols-outlined" aria-hidden="true">logout</span>
          Sign Out
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;
