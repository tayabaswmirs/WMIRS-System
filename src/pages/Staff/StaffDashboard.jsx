import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { subscribeToAllIncidents } from "../../firebase/services/incidentService";
import { subscribeToCategoryMonitoring } from "../../firebase/services/monitoringService";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area, CartesianGrid
} from "recharts";
import StatPill from "../../components/common/StatPill";
import "../../styles/dashboard.css";

/* ── Color & Chart Config Tokens ─────────────────────────── */
const SEVERITY_COLORS = {
  Critical: "#ff5722",
  High: "#f5a524",
  Medium: "#3d8eff",
  Low: "#00ed64"
};

const CHART_COLORS = ["#00ed64", "#3d8eff", "#fa6e39", "#7b3ff2", "#ffc107", "#00b545"];

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const TOOLTIP_STYLE = {
  backgroundColor: "#001e2b",
  border: "1px solid #1c2d38",
  borderRadius: "var(--card-radius, 12px)",
  boxShadow: "var(--card-shadow, rgba(0, 30, 43, 0.08) 0px 4px 12px 0px)",
  fontSize: "12px",
  color: "#ffffff"
};

/* ── Reusable Gauge Ring ──────────────────────────────────── */
function GaugeRing({ value, color, label }) {
  const RADIUS = 68;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE - (value / 100) * CIRCUMFERENCE;

  return (
    <div className="dash-gauge">
      <div className="dash-gauge__ring">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle className="dash-gauge__ring-bg" cx="80" cy="80" r={RADIUS} />
          <circle
            className="dash-gauge__ring-fg"
            cx="80" cy="80" r={RADIUS}
            stroke={color}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="dash-gauge__pct">{value}%</span>
      </div>
      <span className="dash-gauge__label">{label}</span>
    </div>
  );
}

/* ── Chart Card Wrapper ───────────────────────────────────── */
function ChartCard({ icon, title, subtitle, children }) {
  return (
    <div className="dash-chart-card">
      <div className="dash-chart-card__header">
        <span className="material-symbols-outlined dash-chart-card__header-icon" aria-hidden="true">
          {icon}
        </span>
        <div>
          <div className="dash-chart-card__title">{title}</div>
          {subtitle ? <div className="dash-chart-card__subtitle">{subtitle}</div> : null}
        </div>
      </div>
      <div className="dash-chart-card__body">
        {children}
      </div>
    </div>
  );
}

/* ── KPI Card ─────────────────────────────────────────────── */
function KpiCard({ variant, icon, value, label, sub }) {
  return (
    <div className={`dash-kpi-card dash-kpi-card--${variant}`}>
      <div className="dash-kpi-card__icon-wrap">
        <span className="material-symbols-outlined dash-kpi-card__icon" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="dash-kpi-card__body">
        <span className="dash-kpi-card__value">{value}</span>
        <span className="dash-kpi-card__label">{label}</span>
        {sub ? <span className="dash-kpi-card__sub">{sub}</span> : null}
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
function StaffDashboard() {
  const { staffScope } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const isIncidents = staffScope === "incidents";

  // Data fetching subscription based on scope
  useEffect(() => {
    let unsubscribe;
    if (isIncidents) {
      unsubscribe = subscribeToAllIncidents((data) => {
        setItems(data);
        setLoading(false);
      });
    } else if (staffScope) {
      unsubscribe = subscribeToCategoryMonitoring(staffScope, (data) => {
        setItems(data);
        setLoading(false);
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [staffScope, isIncidents]);

  // Scoped Analytics computations
  const analytics = useMemo(() => {
    // 1. KPI Counts
    let total = items.length;
    let awaitingReview = 0;
    let activeTasks = 0;
    let resolvedCount = 0;
    let completedCount = 0;
    let urgentThreats = 0;

    // 2. Monthly Trend Data Map
    const monthlyMap = new Map();
    MONTH_LABELS.forEach((m, idx) => {
      monthlyMap.set(idx, { month: m, volume: 0, resolved: 0 });
    });

    // 3. Incidents specific data structures
    const severityCount = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    const incidentCategories = {};

    // 4. Monitoring specific data structures
    let compliantCount = 0;
    let nonCompliantCount = 0;
    const subcategoryCount = {};

    items.forEach((item) => {
      const status = item.status?.toLowerCase();
      const severity = item.severity;
      const ts = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : null;

      // Status aggregations
      if (status === "submitted" || status === "under review") {
        awaitingReview++;
      } else if (status === "assigned" || status === "unresolved") {
        activeTasks++;
      } else if (status === "resolved") {
        resolvedCount++;
      } else if (status === "verified" || status === "pending completion" || status === "completed" || status === "denied") {
        completedCount++;
      }

      // Monthly aggregations
      if (ts) {
        const m = ts.getMonth();
        const entry = monthlyMap.get(m);
        if (entry) {
          entry.volume++;
          if (status === "completed" || status === "denied") {
            entry.resolved++;
          }
        }
      }

      // Domain-specific calculations
      if (isIncidents) {
        if ((severity === "Critical" || severity === "High") && status !== "completed" && status !== "denied") {
          urgentThreats++;
        }
        if (severityCount[severity] !== undefined) {
          severityCount[severity]++;
        }
        const category = item.category || "Unknown";
        incidentCategories[category] = (incidentCategories[category] || 0) + 1;
      } else {
        if (item.compliant === true) {
          compliantCount++;
        } else if (item.compliant === false) {
          nonCompliantCount++;
        }
        const subcat = item.subcategory || "Unknown";
        subcategoryCount[subcat] = (subcategoryCount[subcat] || 0) + 1;
      }
    });

    const monthlyData = Array.from(monthlyMap.values()).map((d) => ({
      ...d,
      velocity: d.volume > 0 ? Math.round((d.resolved / d.volume) * 100) : 0
    }));

    const velocity = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const severityData = Object.entries(severityCount).map(([name, count]) => ({
      name,
      value: count
    }));

    const categoryData = Object.entries(incidentCategories).map(([name, value]) => ({
      name: name.length > 20 ? name.substring(0, 18) + "…" : name,
      value
    }));

    const complianceRate = (compliantCount + nonCompliantCount) > 0
      ? Math.round((compliantCount / (compliantCount + nonCompliantCount)) * 100)
      : 0;

    const subcatData = Object.entries(subcategoryCount).map(([name, value]) => ({
      name: name.replace(" Form", "").substring(0, 25),
      value
    }));

    return {
      total,
      awaitingReview,
      activeTasks,
      resolvedCount,
      completedCount,
      urgentThreats,
      velocity,
      monthlyData,
      severityData,
      categoryData,
      compliantCount,
      nonCompliantCount,
      complianceRate,
      subcatData
    };
  }, [items, isIncidents]);

  return (
    <DashboardLayout>
      <div className="incidents-page">
        {/* Scoped Dashboard Header */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">Auditing & Intelligence</span>
            <h1 className="inc-hero__title">
              {isIncidents ? "Incident Audits Dashboard" : `${staffScope} Monitoring Dashboard`}
            </h1>
            <p className="inc-hero__subtitle">
              Visual field intelligence, severity metrics, and processing velocity scoped to your review domain.
            </p>
          </div>
          <div className="inc-hero__stats">
            <StatPill icon="task_alt" label="Actioned" count={analytics.completedCount} color="#00ed64" />
            <StatPill icon="pending_actions" label="Pending Verification" count={analytics.resolvedCount} color="#00a35c" />
          </div>
        </div>

        {/* Scoped KPI Grid */}
        <div className="dash-kpi-grid">
          {isIncidents ? (
            <KpiCard
              variant="threat"
              icon="warning"
              value={analytics.urgentThreats}
              label="Urgent Threats"
              sub="Critical / High severity not closed"
            />
          ) : (
            <KpiCard
              variant="comply"
              icon="verified_user"
              value={`${analytics.complianceRate}%`}
              label="Compliance Rate"
              sub={`${analytics.compliantCount} compliant · ${analytics.nonCompliantCount} violations`}
            />
          )}
          <KpiCard
            variant="field"
            icon={isIncidents ? "content_paste_search" : "fact_check"}
            value={analytics.total}
            label="Domain Submissions"
            sub={`Total reports under your scope`}
          />
          <KpiCard
            variant="water"
            icon="assignment"
            value={analytics.activeTasks}
            label="Active Queue"
            sub="Ranger tasks currently unresolved"
          />
          <KpiCard
            variant="gauge"
            icon="speed"
            value={`${analytics.velocity}%`}
            label="Closed Rate"
            sub={`${analytics.completedCount} closed / ${analytics.total} total`}
          />
        </div>

        {/* Scoped Visual Charts */}
        {loading ? (
          <p className="loading-text" style={{ padding: "64px", textAlign: "center", color: "var(--c-steel)" }}>
            Loading dashboard analytics...
          </p>
        ) : (
          <div className="dash-chart-grid dash-chart-grid--two">
            {/* Chart 1: Scoped monthly trend */}
            <ChartCard icon="monitoring" title="Monthly Submissions & Closures">
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <AreaChart data={analytics.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="staffVolumeGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3d8eff" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3d8eff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="var(--c-stone)" fontSize={11} />
                    <YAxis stroke="var(--c-stone)" fontSize={11} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="volume" stroke="#3d8eff" strokeWidth={2} fillOpacity={1} fill="url(#staffVolumeGlow)" name="Submissions" />
                    <Area type="monotone" dataKey="resolved" stroke="#00ed64" strokeWidth={2} fillOpacity={0} name="Closures" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Chart 2: Domain metrics (Severity matrix for Incidents, subcategory for Monitoring) */}
            {isIncidents ? (
              <ChartCard icon="bar_chart" title="Incident Severity Breakdown">
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={analytics.severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="var(--c-stone)" fontSize={11} />
                      <YAxis stroke="var(--c-stone)" fontSize={11} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" name="Reports">
                        {analytics.severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || "#3d8eff"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            ) : (
              <ChartCard icon="bar_chart" title="Monitoring Subcategory Breakdown">
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={analytics.subcatData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="var(--c-stone)" fontSize={10} angle={-15} textAnchor="end" interval={0} />
                      <YAxis stroke="var(--c-stone)" fontSize={11} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" name="Logs">
                        {analytics.subcatData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}

            {/* Gauge Row (Resolution Velocity vs Compliance / Category split) */}
            <ChartCard icon="donut_large" title="Review Metrics Oversight">
              <div className="flex justify-around items-center h-[300px]">
                <GaugeRing value={analytics.velocity} color="#00ed64" label="Resolution Velocity" />
                {!isIncidents && <GaugeRing value={analytics.complianceRate} color="#3d8eff" label="Compliance Rate" />}
              </div>
            </ChartCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default StaffDashboard;
