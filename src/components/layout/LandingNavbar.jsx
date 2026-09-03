import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import wmirsLogo from "../../assets/wmirs-logo.png";

export default function LandingNavbar() {
  const { currentUser, userRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine dashboard redirect link based on role
  const getDashboardPath = () => {
    if (userRole === "admin") return "/admin/dashboard";
    if (userRole === "staff") return "/staff/dashboard";
    return "/dashboard";
  };

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const portalPath = currentUser ? getDashboardPath() : "/login";
  const portalLabel = currentUser ? "Dashboard" : "Sign In";
  const portalIcon = currentUser ? "arrow_forward" : "login";

  return (
    <nav className="landing-nav" aria-label="Main Navigation">
      <div className="landing-nav-container max-w-7xl mx-auto">
        <Link to="/" className="landing-nav-brand" onClick={closeMobileMenu}>
          <img src={wmirsLogo} alt="WMIRS System Logo" className="landing-nav-logo" />
          <div>
            <div className="landing-nav-title">WMIRS</div>
            <div className="landing-nav-subtitle">City ENRO Tayabas</div>
          </div>
        </Link>

        {/* Desktop Links */}
        <ul className="landing-nav-links">
          <li>
            <a href="#about-enro" className="landing-nav-link">
              What ENRO Does
            </a>
          </li>
          <li>
            <a href="#mandate-gallery" className="landing-nav-link">
              Mandate & Gallery
            </a>
          </li>
          <li>
            <a href="#capabilities" className="landing-nav-link">
              How WMIRS Works
            </a>
          </li>
        </ul>

        {/* Desktop Actions */}
        <div className="landing-nav-actions">
          <Link to={portalPath} className="btn-pill-primary">
            <span>{portalLabel}</span>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }} aria-hidden="true">
              {portalIcon}
            </span>
          </Link>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "24px" }} aria-hidden="true">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="dialog" aria-label="Mobile Navigation">
          <ul className="mobile-nav-links">
            <li>
              <a href="#about-enro" className="mobile-nav-link" onClick={closeMobileMenu}>
                What ENRO Does
              </a>
            </li>
            <li>
              <a href="#mandate-gallery" className="mobile-nav-link" onClick={closeMobileMenu}>
                Mandate & Gallery
              </a>
            </li>
            <li>
              <a href="#capabilities" className="mobile-nav-link" onClick={closeMobileMenu}>
                How WMIRS Works
              </a>
            </li>
            <li style={{ marginTop: "12px" }}>
              <Link to={portalPath} className="btn-pill-primary w-full justify-center" onClick={closeMobileMenu}>
                <span>{portalLabel}</span>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }} aria-hidden="true">
                  {portalIcon}
                </span>
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
