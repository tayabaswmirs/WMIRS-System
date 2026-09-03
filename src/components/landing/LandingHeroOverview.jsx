import { Link } from "react-router-dom";
import wmirsLogo from "../../assets/wmirs-logo.png";
import lushForestBg from "../../assets/lush-forest-bg.png";
import treePlantingImg from "../../assets/gallery/treeplanting.jpg";

const ENRO_PILLARS = [
  {
    id: "watershed",
    icon: "water_drop",
    title: "Watershed & Waterway Protection",
    desc: "Active surveillance and conservation of municipal river networks, streams, and riparian buffers feeding Mount Banahaw water catchments."
  },
  {
    id: "bms",
    icon: "nest_cam_wired_stand",
    title: "Forest & Biodiversity Monitoring (BMS)",
    desc: "Quarterly avian censuses, protected fauna tracking, and habitat threat surveys across Tayabas forest reserves like Brgy. Lalo."
  },
  {
    id: "compliance",
    icon: "policy",
    title: "Solid Waste & City Ordinance Compliance",
    desc: "Rigorous enforcement of City Ordinances 21-10 and 17-01, inspecting commercial establishments for plastic bag bans and waste segregation."
  }
];

export default function LandingHeroOverview({ portalLink = "/login", portalBtnLabel = "Access Portal" }) {
  return (
    <>
      {/* ── Section 1: Centered Blurred-Gradient Hero ─────────────── */}
      <header className="hero-section" id="hero">
        {/* Background Image Layer with Blur and Radial Vignette */}
        <div className="hero-bg-container" aria-hidden="true">
          <img
            src={lushForestBg}
            alt=""
            className="hero-bg-image"
          />
          <div className="hero-bg-vignette" />
          <div className="hero-ambient-aura" />
          <div className="hero-abstract-mesh" />
        </div>

        {/* Centered Content Stack */}
        <div className="section-container hero-container">
          <div className="hero-content">
            <div className="hero-logo-wrapper">
              <img src={wmirsLogo} alt="WMIRS System Emblem" className="hero-logo" />
            </div>

            <div className="hero-badge" role="status">
              <span className="material-symbols-outlined hero-badge-icon" aria-hidden="true">
                verified
              </span>
              <span>City Environment & Natural Resources Office • Tayabas City</span>
            </div>

            <h1 className="hero-title">
              Protecting Tayabas City&apos;s <br />
              <span className="hero-title-highlight">Natural Heritage</span>
            </h1>

            <p className="hero-subtitle">
              Web-Based Monitoring and Incident Reporting System (WMIRS) — The centralized municipal platform connecting forest rangers, staff specialists, and administrators to track ecological health and resolve environmental incidents.
            </p>

            <div className="hero-actions">
              <Link to={portalLink} className="btn-pill-primary">
                <span>{portalBtnLabel}</span>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }} aria-hidden="true">
                  arrow_forward
                </span>
              </Link>

              <a href="#about-enro" className="btn-pill-secondary">
                <span>Discover Mandate</span>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }} aria-hidden="true">
                  expand_more
                </span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── Section 2: What ENRO Tayabas Does (Subdued Image + Dark Gradient) ── */}
      <section id="about-enro" className="enro-overview-section">
        {/* Subdued Environmental Image Background */}
        <div className="enro-bg-container" aria-hidden="true">
          <img
            src={treePlantingImg}
            alt=""
            className="enro-bg-image"
          />
          <div className="enro-bg-overlay" />
          <div className="enro-ambient-aura" />
        </div>

        <div className="section-container">
          <div className="section-header">
            <span className="section-eyebrow">DEPARTMENT ROLES</span>
            <h2 className="section-title">What ENRO Tayabas Does</h2>
            <p className="section-desc">
              The City Environment and Natural Resources Office leads the conservation, monitoring, and ecological policy enforcement for the City of Tayabas, Quezon.
            </p>
          </div>

          <div className="pillars-grid">
            {ENRO_PILLARS.map((pillar) => (
              <article key={pillar.id} className="pillar-overview-card">
                <div className="pillar-card-icon-box">
                  <span className="material-symbols-outlined" style={{ fontSize: "28px" }} aria-hidden="true">
                    {pillar.icon}
                  </span>
                </div>
                <h3 className="pillar-card-title">{pillar.title}</h3>
                <p className="pillar-card-desc">{pillar.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
