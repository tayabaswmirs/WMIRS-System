import { Link } from "react-router-dom";

const CAPABILITY_STEPS = [
  {
    step: "01",
    icon: "add_location_alt",
    title: "Field Logging & Evidence",
    role: "Forest Rangers",
    desc: "Field rangers submit geolocated incident reports with photo uploads, or encode scheduled BMS avian censuses, water telemetry, and plastic ban inspections."
  },
  {
    step: "02",
    icon: "fact_check",
    title: "Staff Triage & Assignment",
    role: "Staff Specialists",
    desc: "Domain specialists (Incidents, BMS, Water, Compliance) review submissions in a 4-stage workspace, validate entries against Zod schemas, and assign field teams."
  },
  {
    step: "03",
    icon: "published_with_changes",
    title: "Field Action & Verification",
    role: "Rangers & Specialists",
    desc: "Assigned personnel mitigate hazards on-site, record field action notes, and submit photographic proof of resolution for administrative audit."
  },
  {
    step: "04",
    icon: "picture_as_pdf",
    title: "Official LGU & DENR Reports",
    role: "System Administrators",
    desc: "Administrators compile verified records into standardized executive PDF reports with summary tables and Excel data archives for municipal oversight."
  }
];

export default function LandingCapabilitiesCta({ portalLink = "/login", portalBtnLabel = "Access Portal" }) {
  return (
    <>
      {/* ── Section 5: Sequential System Capabilities (Technical Midnight) */}
      <section id="capabilities" className="capabilities-section">
        <div className="abstract-tech-dots" aria-hidden="true" />
        <div className="abstract-glow-orb orb-capabilities-cyan" aria-hidden="true" />

        <div className="section-container">
          <div className="section-header">
            <span className="section-eyebrow">SYSTEM CAPABILITIES</span>
            <h2 className="section-title">How WMIRS Works</h2>
            <p className="section-desc">
              A secure, role-governed operational lifecycle that transforms field documentation into verified administrative action and executive reporting.
            </p>
          </div>

          <div className="capabilities-flow-grid">
            {CAPABILITY_STEPS.map((stepItem, index) => (
              <div key={stepItem.step} className="flow-step-card">
                <div className="flow-step-header">
                  <span className="flow-step-num">{stepItem.step}</span>
                  <span className="flow-step-role">{stepItem.role}</span>
                </div>
                <div className="flow-step-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: "28px" }} aria-hidden="true">
                    {stepItem.icon}
                  </span>
                </div>
                <h3 className="flow-step-title">{stepItem.title}</h3>
                <p className="flow-step-desc">{stepItem.desc}</p>
                {index < CAPABILITY_STEPS.length - 1 && (
                  <div className="flow-step-connector" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Authorized Portal Call-to-Action (Light Mint Transition) */}
      <section className="portal-cta-section">
        <div className="portal-cta-glow-pulse" aria-hidden="true" />
        <div className="section-container">
          <div className="portal-cta-banner">
            <div className="portal-cta-badge">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }} aria-hidden="true">
                lock
              </span>
              <span>Restricted Municipal Access</span>
            </div>

            <h2 className="portal-cta-title">
              Authorized ENRO Portal Access
            </h2>

            <p className="portal-cta-subtitle">
              Centralized environmental monitoring records, incident management, and official LGU reporting for City of Tayabas personnel.
            </p>

            <div className="portal-cta-actions">
              <Link to={portalLink} className="btn-pill-primary" style={{ padding: "14px 36px", fontSize: "16px" }}>
                <span>{portalBtnLabel}</span>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }} aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </div>

            <p className="portal-cta-disclaimer">
              Access is restricted to authorized ENRO personnel. New accounts require administrative vetting and approval.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
