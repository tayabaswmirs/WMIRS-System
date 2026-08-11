import { useState } from "react";
import { Link } from "react-router-dom";
import LandingNavbar from "../components/layout/LandingNavbar";
import { useAuth } from "../hooks/useAuth";
import wmirsLogo from "../assets/wmirs-logo.png";
import "../styles/landing.css";

export default function Landing() {
  const { currentUser, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState("water");

  // Determine dashboard redirect link based on role
  const getDashboardPath = () => {
    if (userRole === "admin") return "/admin/dashboard";
    if (userRole === "staff") return "/staff/dashboard";
    return "/dashboard";
  };

  const portalLink = currentUser ? getDashboardPath() : "/login";
  const portalBtnLabel = currentUser ? "Go to Dashboard" : "Access Portal";

  return (
    <div className="landing-container">
      {/* Sticky Glassmorphic Header */}
      <LandingNavbar />

      {/* ── Section 1: Lush Forest Hero ────────────────────────── */}
      <header className="hero-section">
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-logo-wrapper">
            <img src={wmirsLogo} alt="WMIRS System Logo" className="hero-logo" />
          </div>

          <div className="hero-badge">
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              eco
            </span>
            <span>Water Management & Incident Reporting System</span>
          </div>

          <h1 className="hero-title">
            Safeguarding Our Waterways, <br />
            <span className="hero-title-highlight">Biodiversity & Ecosystems</span>
          </h1>

          <p className="hero-subtitle">
            A comprehensive environmental monitoring platform connecting field rangers, municipal staff, and citizens in real-time to track aquatic health, conduct fauna surveys, and resolve environmental incidents.
          </p>

          <div className="hero-actions">
            <Link to={portalLink} className="btn-pill-primary">
              <span>{portalBtnLabel}</span>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                arrow_forward
              </span>
            </Link>

            <a href="#pillars" className="btn-pill-secondary">
              <span>Explore System Features</span>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                expand_more
              </span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Section 2: Deep Emerald Core Pillars ───────────────── */}
      <section id="pillars" className="pillars-section">
        <div className="section-header">
          <span className="section-eyebrow">SYSTEM CAPABILITIES</span>
          <h2 className="section-title">Core Environmental Pillars</h2>
          <p className="section-desc">
            WMIRS integrates three specialized operational domains into a unified, role-governed cloud platform.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="pillar-tabs">
          <button
            type="button"
            className={`pillar-tab-btn ${activeTab === "water" ? "active" : ""}`}
            onClick={() => setActiveTab("water")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              water_drop
            </span>
            <span>Water Resource Monitoring</span>
          </button>

          <button
            type="button"
            className={`pillar-tab-btn ${activeTab === "bio" ? "active" : ""}`}
            onClick={() => setActiveTab("bio")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              flutter_dash
            </span>
            <span>Biodiversity & Wildlife Census</span>
          </button>

          <button
            type="button"
            className={`pillar-tab-btn ${activeTab === "compliance" ? "active" : ""}`}
            onClick={() => setActiveTab("compliance")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              verified
            </span>
            <span>Compliance & Municipal Audits</span>
          </button>
        </div>

        {/* Tab Content Cards */}
        <div className="pillar-card-display">
          {activeTab === "water" && (
            <div className="pillar-grid">
              <div className="pillar-details">
                <h3>Aquatic & Water Resource Telemetry</h3>
                <p>
                  Continuous log entries for stream conditions, turbidity levels, aquatic pollution indicators, and watershed conservation activities across regional water networks.
                </p>
                <ul className="pillar-feature-list">
                  <li className="pillar-feature-item">
                    <div className="pillar-icon-box">✓</div>
                    <span>Real-time water pollution severity classification and triage</span>
                  </li>
                  <li className="pillar-feature-item">
                    <div className="pillar-icon-box">✓</div>
                    <span>Aquatic ecosystem conservation and pH level records</span>
                  </li>
                  <li className="pillar-feature-item">
                    <div className="pillar-icon-box">✓</div>
                    <span>Automated dispatch notifications to environmental response units</span>
                  </li>
                </ul>
              </div>

              <div className="pillar-visual-box">
                <div className="pillar-stat-pill">
                  <div className="pillar-stat-label">
                    <span className="material-symbols-outlined" style={{ color: "#00ed64" }}>
                      water
                    </span>
                    <span>Monitored Streams</span>
                  </div>
                  <div className="pillar-stat-val">1,480 active</div>
                </div>
                <div className="pillar-stat-pill">
                  <div className="pillar-stat-label">
                    <span className="material-symbols-outlined" style={{ color: "#00ed64" }}>
                      shield
                    </span>
                    <span>Water Quality Status</span>
                  </div>
                  <div className="pillar-stat-val">99.1% Optimal</div>
                </div>
                <div className="pillar-stat-pill">
                  <div className="pillar-stat-label">
                    <span className="material-symbols-outlined" style={{ color: "#00ed64" }}>
                      history
                    </span>
                    <span>Audit Trail Logs</span>
                  </div>
                  <div className="pillar-stat-val">Real-time Firestore</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "bio" && (
            <div className="pillar-grid">
              <div className="pillar-details">
                <h3>Biodiversity Census & Avian Surveys</h3>
                <p>
                  Systematic data collection for protected species, bird species census (BMS), fauna sightings, and habitat condition assessments led by certified field rangers.
                </p>
                <ul className="pillar-feature-list">
                  <li className="pillar-feature-item">
                    <div className="pillar-icon-box">✓</div>
                    <span>Avian survey logging with species tally & flight pattern observation</span>
                  </li>
                  <li className="pillar-feature-item">
                    <div className="pillar-icon-box">✓</div>
                    <span>Non-avian fauna sighting tracking & habitat threat identification</span>
                  </li>
                  <li className="pillar-feature-item">
                    <div className="pillar-icon-box">✓</div>
                    <span>Geographic mapping of protected wildlife corridors</span>
                  </li>
                </ul>
              </div>

              <div className="pillar-visual-box">
                <div className="pillar-stat-pill">
                  <div className="pillar-stat-label">
                    <span className="material-symbols-outlined" style={{ color: "#00ed64" }}>
                      nest
                    </span>
                    <span>Avian Surveys Recorded</span>
                  </div>
                  <div className="pillar-stat-val">2,840 logs</div>
                </div>
                <div className="pillar-stat-pill">
                  <div className="pillar-stat-label">
                    <span className="material-symbols-outlined" style={{ color: "#00ed64" }}>
                      pets
                    </span>
                    <span>Protected Species Tracked</span>
                  </div>
                  <div className="pillar-stat-val">142 fauna species</div>
                </div>
                <div className="pillar-stat-pill">
                  <div className="pillar-stat-label">
                    <span className="material-symbols-outlined" style={{ color: "#00ed64" }}>
                      forest
                    </span>
                    <span>Protected Reserves</span>
                  </div>
                  <div className="pillar-stat-val">34 Sanctuaries</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "compliance" && (
            <div className="pillar-grid">
              <div className="pillar-details">
                <h3>Municipal & Ecological Compliance</h3>
                <p>
                  Comprehensive compliance verification including municipal waste collection tracking, plastic bag ban enforcement, and environmental hazard mitigation audits.
                </p>
                <ul className="pillar-feature-list">
                  <li className="pillar-feature-item">
                    <div className="pillar-icon-box">✓</div>
                    <span>Waste collection audit tracking for municipal cleanliness</span>
                  </li>
                  <li className="pillar-feature-item">
                    <div className="pillar-icon-box">✓</div>
                    <span>Single-use plastic ban enforcement verification logs</span>
                  </li>
                  <li className="pillar-feature-item">
                    <div className="pillar-icon-box">✓</div>
                    <span>Role-based admin approvals and inspection status workflow</span>
                  </li>
                </ul>
              </div>

              <div className="pillar-visual-box">
                <div className="pillar-stat-pill">
                  <div className="pillar-stat-label">
                    <span className="material-symbols-outlined" style={{ color: "#00ed64" }}>
                      delete_sweep
                    </span>
                    <span>Waste Audits Conducted</span>
                  </div>
                  <div className="pillar-stat-val">1,120 audits</div>
                </div>
                <div className="pillar-stat-pill">
                  <div className="pillar-stat-label">
                    <span className="material-symbols-outlined" style={{ color: "#00ed64" }}>
                      task_alt
                    </span>
                    <span>Compliance Rate</span>
                  </div>
                  <div className="pillar-stat-val">96.8% Compliant</div>
                </div>
                <div className="pillar-stat-pill">
                  <div className="pillar-stat-label">
                    <span className="material-symbols-outlined" style={{ color: "#00ed64" }}>
                      fact_check
                    </span>
                    <span>Verification Workflow</span>
                  </div>
                  <div className="pillar-stat-val">Automated Zod Schema</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 3: Light Mint Workflow ("How It Works") ───────── */}
      <section id="workflow" className="workflow-section">
        <div className="section-header">
          <span className="section-eyebrow">STREAMLINED WORKFLOW</span>
          <h2 className="section-title">How Incidents & Monitoring Work</h2>
          <p className="section-desc">
            From citizen reports to ranger field verification and ecological resolution.
          </p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-card">
            <span className="workflow-step-num">01</span>
            <div className="workflow-icon">
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
                add_location_alt
              </span>
            </div>
            <h4>1. Detect & Report</h4>
            <p>
              Citizens or field spotters submit incident reports with GPS location, photo evidence, and hazard severity classification.
            </p>
          </div>

          <div className="workflow-card">
            <span className="workflow-step-num">02</span>
            <div className="workflow-icon">
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
                fact_check
              </span>
            </div>
            <h4>2. Verify & Triage</h4>
            <p>
              System validates inputs via Zod schema rules and instantly alerts administrators for priority severity classification.
            </p>
          </div>

          <div className="workflow-card">
            <span className="workflow-step-num">03</span>
            <div className="workflow-icon">
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
                support_agent
              </span>
            </div>
            <h4>3. Ranger Dispatch</h4>
            <p>
              Forest rangers and environmental specialists are dispatched with direct access to monitoring logs and action plans.
            </p>
          </div>

          <div className="workflow-card">
            <span className="workflow-step-num">04</span>
            <div className="workflow-icon">
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
                published_with_changes
              </span>
            </div>
            <h4>4. Ecological Resolution</h4>
            <p>
              Incident status updates in real-time on Firestore, providing complete transparency and audit logs for all stakeholders.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 4: Dark Teal Slate Live Impact Metrics ───────── */}
      <section id="metrics" className="metrics-section">
        <div className="section-header">
          <span className="section-eyebrow">REAL-TIME TELEMETRY</span>
          <h2 className="section-title">System Impact & Live Statistics</h2>
          <p className="section-desc" style={{ color: "rgba(255,255,255,0.7)" }}>
            Empowering regional environmental agencies with data-driven conservation.
          </p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <span className="material-symbols-outlined metric-icon">water_ph</span>
            <div className="metric-val metric-val-green">1,480+</div>
            <div className="metric-label">Waterways Monitored</div>
            <div className="metric-subtext">Active river basins & streams</div>
          </div>

          <div className="metric-card">
            <span className="material-symbols-outlined metric-icon">task_alt</span>
            <div className="metric-val">98.4%</div>
            <div className="metric-label">Incidents Resolved</div>
            <div className="metric-subtext">Verified mitigation rate</div>
          </div>

          <div className="metric-card">
            <span className="material-symbols-outlined metric-icon">pets</span>
            <div className="metric-val metric-val-green">4,250+</div>
            <div className="metric-label">Protected Species Logged</div>
            <div className="metric-subtext">Avian & wildlife census logs</div>
          </div>

          <div className="metric-card">
            <span className="material-symbols-outlined metric-icon">timer</span>
            <div className="metric-val">&lt; 15 min</div>
            <div className="metric-label">Emergency Triage</div>
            <div className="metric-subtext">Average incident response</div>
          </div>
        </div>

        <div className="live-telemetry-strip">
          <div className="live-badge">
            <div className="live-pulse-dot" />
            <span>Live System Telemetry</span>
          </div>
          <div className="live-text">
            Firebase Cloud Functions & Firestore database operational — 0 pending sync alerts.
          </div>
        </div>
      </section>

      {/* ── Section 5: Deep Forest CTA & Multi-Column Footer ──── */}
      <section id="about" className="cta-footer-section">
        <div className="landing-cta-banner">
          <h2>Ready to Protect Our Natural Heritage?</h2>
          <p>
            Join environmental rangers, staff specialists, and citizen reporters in preserving regional aquatic ecosystems.
          </p>
          <Link to={portalLink} className="btn-pill-primary" style={{ padding: "14px 32px", fontSize: "16px" }}>
            <span>{portalBtnLabel}</span>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              arrow_forward
            </span>
          </Link>
        </div>

        <footer className="footer-grid">
          <div className="footer-brand-col">
            <img src={wmirsLogo} alt="WMIRS System Logo" className="footer-logo" />
            <p className="footer-tagline">
              WMIRS (Water Management & Incident Reporting System) — Empowering environmental protection through real-time monitoring and reporting.
            </p>
          </div>

          <div className="footer-col">
            <h5>Navigation</h5>
            <ul className="footer-links-list">
              <li className="footer-link-item">
                <a href="#pillars">Core Pillars</a>
              </li>
              <li className="footer-link-item">
                <a href="#workflow">How It Works</a>
              </li>
              <li className="footer-link-item">
                <a href="#metrics">Live Metrics</a>
              </li>
              <li className="footer-link-item">
                <Link to="/login">Portal Login</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>User Roles</h5>
            <ul className="footer-links-list">
              <li className="footer-link-item">
                <a href="#pillars">Forest Rangers</a>
              </li>
              <li className="footer-link-item">
                <a href="#pillars">Monitoring Staff</a>
              </li>
              <li className="footer-link-item">
                <a href="#pillars">System Admins</a>
              </li>
              <li className="footer-link-item">
                <a href="#pillars">Citizen Spotters</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>System Security</h5>
            <ul className="footer-links-list">
              <li className="footer-link-item">
                <span style={{ color: "var(--c-steel)", fontSize: "14px" }}>Firebase Auth</span>
              </li>
              <li className="footer-link-item">
                <span style={{ color: "var(--c-steel)", fontSize: "14px" }}>Firestore Rules</span>
              </li>
              <li className="footer-link-item">
                <span style={{ color: "var(--c-steel)", fontSize: "14px" }}>Zod Validation</span>
              </li>
              <li className="footer-link-item">
                <span style={{ color: "var(--c-steel)", fontSize: "14px" }}>Role-Based Access</span>
              </li>
            </ul>
          </div>
        </footer>

        <div className="footer-bottom">
          <div>© 2026 WMIRS System. All rights reserved. Built for Environmental Protection.</div>
          <div>Version 1.0.0 | Nature Design System</div>
        </div>
      </section>
    </div>
  );
}
