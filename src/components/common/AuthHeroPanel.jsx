import wmirsLogo from "../../assets/wmirs-logo.png";

/**
 * Branded command stage for the authentication views.
 * Displays municipal badge, live telemetry beacon, and capability bento.
 */
export default function AuthHeroPanel() {
  return (
    <aside className="login-hero" aria-label="System branding & command status">
      {/* Background ambient lighting and grid pattern */}
      <div className="login-hero__ambient-glow" aria-hidden="true" />
      <div className="login-hero__grid-overlay" aria-hidden="true" />

      <div className="login-hero__content">
        {/* Logo with pulsating halo */}
        <div className="login-hero__logo-wrapper">
          <div className="login-hero__logo-halo" aria-hidden="true" />
          <img
            src={wmirsLogo}
            alt="WMIRS Official Emblem"
            className="login-hero__logo"
          />
        </div>

        {/* Municipal & System Title */}
        <div className="login-hero__header">
          <span className="login-hero__eyebrow">
            City ENRO · Tayabas City
          </span>
          <h1 className="login-hero__wordmark">
            WM<span>IRS</span>
          </h1>
          <p className="login-hero__tagline">
            Web-Based Monitoring &amp; Incident Reporting System
          </p>
        </div>

        {/* Live Operational Status Beacon */}
        <div className="login-hero__beacon-strip" role="status" aria-label="System Operational">
          <div className="login-hero__radar-ping">
            <span className="login-hero__radar-core" />
            <span className="login-hero__radar-wave" />
          </div>
          <span className="login-hero__beacon-text">System Operational</span>
          <span className="login-hero__beacon-metric">99.9% Uptime</span>
        </div>

        {/* Asymmetric Command Bento */}
        <div className="login-hero__bento" aria-label="Core system capabilities">
          <div className="login-bento-tile login-bento-tile--featured">
            <div className="login-bento-tile__header">
              <span className="login-bento-tile__icon-box">
                <span className="material-symbols-outlined">crisis_alert</span>
              </span>
              <span className="login-bento-tile__status-pill">Active Telemetry</span>
            </div>
            <strong className="login-bento-tile__title">Field Incident Dispatch</strong>
            <p className="login-bento-tile__desc">
              Real-time geolocated reporting across 66 Tayabas City barangays.
            </p>
          </div>

          <div className="login-bento-grid-2">
            <div className="login-bento-tile">
              <span className="login-bento-tile__icon-box">
                <span className="material-symbols-outlined">nature_people</span>
              </span>
              <strong className="login-bento-tile__mini-title">Eco Surveillance</strong>
              <p className="login-bento-tile__mini-desc">Forest cover &amp; solid waste tracking</p>
            </div>

            <div className="login-bento-tile">
              <span className="login-bento-tile__icon-box">
                <span className="material-symbols-outlined">verified_user</span>
              </span>
              <strong className="login-bento-tile__mini-title">Clearance Desk</strong>
              <p className="login-bento-tile__mini-desc">256-bit encrypted audit logs</p>
            </div>
          </div>
        </div>

        {/* Municipal Authority Coordinates Watermark */}
        <div className="login-hero__footer-meta" aria-hidden="true">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
          <span>14°01′34″N 121°35′38″E · Station #04 Quezon</span>
        </div>
      </div>
    </aside>
  );
}
