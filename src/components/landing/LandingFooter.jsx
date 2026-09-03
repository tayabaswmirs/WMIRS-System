import { Link } from "react-router-dom";
import wmirsLogo from "../../assets/wmirs-logo.png";

export default function LandingFooter() {
  return (
    <footer className="footer-section">
      <div className="footer-grid max-w-7xl mx-auto">
        <div className="footer-brand-col">
          <div className="footer-brand-header">
            <img src={wmirsLogo} alt="WMIRS System Logo" className="footer-logo" />
            <div>
              <div className="footer-brand-title">WMIRS Tayabas</div>
              <div className="footer-brand-subtitle">City ENRO Digital Portal</div>
            </div>
          </div>
          <p className="footer-tagline">
            Web-Based Monitoring and Incident Reporting System — Empowering the City Environment and Natural Resources Office of Tayabas City to protect local ecosystems, watersheds, and biodiversity through transparent data management.
          </p>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Navigation</h4>
          <ul className="footer-links-list">
            <li className="footer-link-item">
              <a href="#hero">Overview</a>
            </li>
            <li className="footer-link-item">
              <a href="#about-enro">What ENRO Does</a>
            </li>
            <li className="footer-link-item">
              <a href="#mandate-gallery">Mandate & Pledge</a>
            </li>
            <li className="footer-link-item">
              <a href="#mandate-gallery">Field Gallery</a>
            </li>
            <li className="footer-link-item">
              <a href="#capabilities">How WMIRS Works</a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">System Modules</h4>
          <ul className="footer-links-list">
            <li className="footer-link-item">
              <span>Biodiversity Monitoring (BMS)</span>
            </li>
            <li className="footer-link-item">
              <span>Water Resource Telemetry</span>
            </li>
            <li className="footer-link-item">
              <span>City Ordinance Compliance</span>
            </li>
            <li className="footer-link-item">
              <span>Incident Response & Triage</span>
            </li>
            <li className="footer-link-item">
              <span>LGU/DENR Report Generation</span>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Authorized Roles</h4>
          <ul className="footer-links-list">
            <li className="footer-link-item">
              <span>Forest Rangers (Field Logging)</span>
            </li>
            <li className="footer-link-item">
              <span>Staff Specialists (Triage & Review)</span>
            </li>
            <li className="footer-link-item">
              <span>System Administrators (Governance)</span>
            </li>
            <li className="footer-link-item" style={{ marginTop: "12px" }}>
              <Link to="/login" className="footer-login-link">
                <span>Sign In to Portal</span>
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }} aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom max-w-7xl mx-auto">
        <div>
          © 2026 City Environment and Natural Resources Office (ENRO), City of Tayabas. All rights reserved.
        </div>
        <div>
          Web-Based Monitoring and Incident Reporting System (WMIRS) • Version 1.0.0
        </div>
      </div>
    </footer>
  );
}
