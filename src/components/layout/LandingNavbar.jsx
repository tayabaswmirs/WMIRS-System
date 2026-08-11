import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import wmirsLogo from "../../assets/wmirs-logo.png";

export default function LandingNavbar() {
  const { currentUser, userRole } = useAuth();

  // Determine dashboard redirect link based on role
  const getDashboardPath = () => {
    if (userRole === "admin") return "/admin/dashboard";
    if (userRole === "staff") return "/staff/dashboard";
    return "/dashboard";
  };

  return (
    <nav className="landing-nav" aria-label="Main Navigation">
      <Link to="/" className="landing-nav-brand">
        <img src={wmirsLogo} alt="WMIRS System Logo" className="landing-nav-logo" />
        <div>
          <div className="landing-nav-title">WMIRS</div>
          <div className="landing-nav-subtitle">Water & Ecosystems</div>
        </div>
      </Link>

      <ul className="landing-nav-links">
        <li>
          <a href="#pillars" className="landing-nav-link">
            Pillars
          </a>
        </li>
        <li>
          <a href="#workflow" className="landing-nav-link">
            How It Works
          </a>
        </li>
        <li>
          <a href="#metrics" className="landing-nav-link">
            Live Metrics
          </a>
        </li>
        <li>
          <a href="#about" className="landing-nav-link">
            About System
          </a>
        </li>
      </ul>

      <div className="landing-nav-actions">
        {currentUser ? (
          <Link to={getDashboardPath()} className="btn-pill-primary">
            <span>Go to Dashboard</span>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              arrow_forward
            </span>
          </Link>
        ) : (
          <Link to="/login" className="btn-pill-primary">
            <span>Sign In</span>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              login
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
