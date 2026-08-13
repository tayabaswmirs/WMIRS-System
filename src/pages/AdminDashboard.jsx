import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatPill from "../components/common/StatPill";
import { getAllUsers } from "../firebase/services/userService";
import { subscribeToAllIncidents } from "../firebase/services/incidentService";
import { subscribeToAllMonitoring } from "../firebase/services/monitoringService";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, Legend, ComposedChart, Line, Area,
  AreaChart, CartesianGrid
} from "recharts";
import "../styles/dashboard.css";

/* ── Color Tokens ─────────────────────────────────────────── */
const SEVERITY_COLORS = {
  Critical: "#ff5722",
  High: "#f5a524",
  Medium: "#3d8eff",
  Low: "#00ed64"
};

const CATEGORY_LABELS = [
  "Forest Management",
  "Biodiversity Monitoring",
  "Water Resources Management",
  "Waste Management",
  "Environmental Compliance",
  "Land and Ecosystem Protection"
];

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** Shared dark-mode tooltip styling for Recharts */
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



/* ═══════════════════════════════════════════════════════════════
   Main Admin Dashboard Component
   ═══════════════════════════════════════════════════════════════ */
function AdminDashboard() {
  const [counts, setCounts] = useState({ admin: 0, staff: 0, ranger: 0 });
  const [incidents, setIncidents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  /* ── Data Fetching ─────────────────────────────────────── */
  useEffect(() => {
    let active = true;
    getAllUsers().then((users) => {
      if (!active) return;
      const c = { admin: 0, staff: 0, ranger: 0 };
      users.forEach((u) => {
        const role = u.role || "ranger";
        if (c[role] !== undefined) c[role] += 1;
      });
      setCounts(c);
      setLoadingUsers(false);
    }).catch(console.error);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const unsubIncidents = subscribeToAllIncidents(setIncidents);
    const unsubLogs = subscribeToAllMonitoring(setLogs);
    return () => {
      unsubIncidents();
      unsubLogs();
    };
  }, []);

  /* ── Computed Analytics ─────────────────────────────────── */
  const analytics = useMemo(() => {
    /* --- Tier 1: KPI Metrics --- */
    const urgentThreats = incidents.filter(
      (i) => (i.severity === "Critical" || i.severity === "High") &&
             i.status?.toLowerCase() !== "completed" && i.status?.toLowerCase() !== "denied"
    ).length;

    const totalIncidents = incidents.length;
    const totalLogs = logs.length;
    const totalSubmissions = totalIncidents + totalLogs;

    // Water quality from "Local Water Source Monitoring Form" subcategory
    const waterLogs = logs.filter((l) => l.subcategory === "Local Water Source Monitoring Form");
    const waterLogCount = waterLogs.length;

    // Plastic ban compliance from "Plastic Bag Ban Inspection Form" subcategory
    const plasticLogs = logs.filter((l) => l.subcategory === "Plastic Bag Ban Inspection Form");
    const compliantCount = plasticLogs.filter((l) => l.compliant === true).length;
    const nonCompliantCount = plasticLogs.filter((l) => l.compliant === false).length;
    const complianceRate = plasticLogs.length > 0
      ? Math.round((compliantCount / plasticLogs.length) * 100)
      : 0;

    // Resolution velocity
    let resolvedCount = 0;
    incidents.forEach((i) => {
      const status = i.status?.toLowerCase();
      if (status === "completed" || status === "denied") resolvedCount++;
    });
    logs.forEach((l) => {
      const status = l.status?.toLowerCase();
      if (status === "completed" || status === "denied") resolvedCount++;
    });
    const velocity = totalSubmissions > 0
      ? Math.round((resolvedCount / totalSubmissions) * 100)
      : 0;

    /* --- Tier 2: Category × Severity Heat Matrix --- */
    const severityMatrix = CATEGORY_LABELS.map((cat) => {
      const catIncidents = incidents.filter((i) => i.category === cat);
      return {
        name: cat.length > 20 ? cat.substring(0, 18) + "…" : cat,
        fullName: cat,
        Critical: catIncidents.filter((i) => i.severity === "Critical").length,
        High: catIncidents.filter((i) => i.severity === "High").length,
        Medium: catIncidents.filter((i) => i.severity === "Medium").length,
        Low: catIncidents.filter((i) => i.severity === "Low").length
      };
    }).filter((row) => row.Critical + row.High + row.Medium + row.Low > 0);

    /* --- Tier 2: Monthly Submissions & Resolution Velocity --- */
    const monthlyMap = new Map();
    MONTH_LABELS.forEach((m, idx) => {
      monthlyMap.set(idx, { month: m, incidents: 0, monitoring: 0, resolved: 0, total: 0 });
    });

    incidents.forEach((i) => {
      const ts = i.createdAt?.seconds ? new Date(i.createdAt.seconds * 1000) : null;
      if (!ts) return;
      const m = ts.getMonth();
      const entry = monthlyMap.get(m);
      entry.incidents++;
      entry.total++;
      const status = i.status?.toLowerCase();
      if (status === "completed" || status === "denied") entry.resolved++;
    });

    logs.forEach((l) => {
      const ts = l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000) : null;
      if (!ts) return;
      const m = ts.getMonth();
      const entry = monthlyMap.get(m);
      entry.monitoring++;
      entry.total++;
      const status = l.status?.toLowerCase();
      if (status === "completed" || status === "denied") entry.resolved++;
    });

    const monthlyData = Array.from(monthlyMap.values()).map((d) => ({
      ...d,
      velocity: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0
    }));

    /* --- Tier 3: Biodiversity Census (Avian + Wildlife) --- */
    const bioMonthly = new Map();
    MONTH_LABELS.forEach((m, idx) => {
      bioMonthly.set(idx, { month: m, avian: 0, wildlife: 0 });
    });

    logs.forEach((l) => {
      const ts = l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000) : null;
      if (!ts) return;
      const m = ts.getMonth();
      const entry = bioMonthly.get(m);

      if (l.subcategory === "Avian Tracking Form") {
        entry.avian += Number(l.count) || 1;
      } else if (l.subcategory === "Wildlife Observations Form") {
        entry.wildlife += Number(l.quantity) || 1;
      }
    });

    const biodiversityData = Array.from(bioMonthly.values())
      .filter((d) => d.avian > 0 || d.wildlife > 0);

    /* --- Tier 3: Waste Collection by Barangay --- */
    const wasteByBarangay = {};
    logs.filter((l) => l.subcategory === "Waste Collection Tracking Form").forEach((l) => {
      const brgy = l.barangay || "Unknown";
      let volume = Number(l.volumeValue) || 0;
      // Normalize to kg
      if (l.volumeUnit === "tons") volume *= 1000;
      if (!wasteByBarangay[brgy]) wasteByBarangay[brgy] = 0;
      wasteByBarangay[brgy] += volume;
    });
    const wasteData = Object.entries(wasteByBarangay)
      .map(([name, value]) => ({
        name: name.replace("Barangay ", "Brgy. "),
        value: Math.round(value)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      urgentThreats,
      totalIncidents,
      totalLogs,
      totalSubmissions,
      waterLogCount,
      compliantCount,
      nonCompliantCount,
      complianceRate,
      velocity,
      severityMatrix,
      monthlyData,
      biodiversityData,
      wasteData,
      plasticLogs
    };
  }, [incidents, logs]);

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <div className="incidents-page">

        {/* ── Hero Header Band ─────────────────────────────────── */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">Administration</span>
            <h1 className="inc-hero__title">Executive Dashboard</h1>
            <p className="inc-hero__subtitle">
              Real-time ecological intelligence, field activity metrics, and compliance oversight.
            </p>
          </div>
          <div className="inc-hero__stats">
            {loadingUsers ? (
              <span style={{ color: "var(--c-on-dark-muted)", fontSize: "13px" }}>Loading users…</span>
            ) : (
              <>
                <StatPill icon="shield_person" label="Admins" count={counts.admin} color="var(--c-green)" />
                <StatPill icon="badge" label="Staff" count={counts.staff} color="#3d8eff" />
                <StatPill icon="park" label="Rangers" count={counts.ranger} color="var(--c-green-dark)" />
              </>
            )}
          </div>
        </div>

        {/* ══ TIER 1: Executive KPI Summary Cards ════════════════ */}
        <div className="dash-kpi-grid">
          <KpiCard
            variant="threat"
            icon="warning"
            value={analytics.urgentThreats}
            label="Urgent Threats"
            sub="Unresolved Critical & High severity"
          />
          <KpiCard
            variant="field"
            icon="forest"
            value={analytics.totalSubmissions}
            label="Field Activity"
            sub={`${analytics.totalIncidents} incidents · ${analytics.totalLogs} logs`}
          />
          <KpiCard
            variant="water"
            icon="water_drop"
            value={analytics.waterLogCount}
            label="Water Surveys"
            sub="Local water source monitoring logs"
          />
          <KpiCard
            variant="comply"
            icon="verified_user"
            value={`${analytics.complianceRate}%`}
            label="Ban Compliance"
            sub={`${analytics.compliantCount} compliant · ${analytics.nonCompliantCount} violations`}
          />
        </div>



        <div className="dash-chart-grid dash-chart-grid--two">
          {/* Chart 1: Category × Severity Heat Matrix */}
          <ChartCard
            icon="grid_view"
            title="Incident Severity by Category"
            subtitle="Stacked breakdown of incident severity across environmental domains"
          >
            {analytics.severityMatrix.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.severityMatrix}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-hairline)" horizontal={false} />
                  <XAxis type="number" stroke="var(--c-stone)" fontSize={11} allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="var(--c-stone)"
                    fontSize={11}
                    width={110}
                    tick={{ fill: "var(--c-slate)" }}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={{ color: "#ffffff" }}
                    labelStyle={{ color: "#00ed64", fontWeight: 700, marginBottom: 4 }}
                    formatter={(val, name) => [val, name]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.fullName || label;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar dataKey="Critical" stackId="sev" fill={SEVERITY_COLORS.Critical} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="High" stackId="sev" fill={SEVERITY_COLORS.High} />
                  <Bar dataKey="Medium" stackId="sev" fill={SEVERITY_COLORS.Medium} />
                  <Bar dataKey="Low" stackId="sev" fill={SEVERITY_COLORS.Low} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="dash-empty">
                <span className="material-symbols-outlined dash-empty__icon">query_stats</span>
                <span className="dash-empty__text">No incident data yet</span>
              </div>
            )}
          </ChartCard>

          {/* Chart 2: Monthly Submissions + Velocity */}
          <ChartCard
            icon="trending_up"
            title="Monthly Submissions & Resolution"
            subtitle="Incident reports vs monitoring logs with resolution velocity trend"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={analytics.monthlyData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-hairline)" />
                <XAxis dataKey="month" stroke="var(--c-stone)" fontSize={11} />
                <YAxis yAxisId="left" stroke="var(--c-stone)" fontSize={11} allowDecimals={false} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--c-stone)"
                  fontSize={11}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={{ color: "#ffffff" }}
                  labelStyle={{ color: "#00ed64", fontWeight: 700 }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} iconType="circle" iconSize={8} />
                <Bar yAxisId="left" dataKey="incidents" name="Incidents" fill="#ff5722" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar yAxisId="left" dataKey="monitoring" name="Monitoring" fill="#00ed64" radius={[4, 4, 0, 0]} barSize={16} />
                <Line
                  yAxisId="right"
                  dataKey="velocity"
                  name="Resolution %"
                  stroke="#7b3ff2"
                  strokeWidth={2}
                  dot={{ fill: "#7b3ff2", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>



        <div className="dash-chart-grid dash-chart-grid--three">
          {/* Chart 3: Biodiversity & Fauna Census */}
          <ChartCard
            icon="pets"
            title="Biodiversity Census"
            subtitle="Avian counts & wildlife sightings by month"
          >
            {analytics.biodiversityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics.biodiversityData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="gradAvian" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ed64" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00ed64" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradWildlife" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7b3ff2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7b3ff2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-hairline)" />
                  <XAxis dataKey="month" stroke="var(--c-stone)" fontSize={11} />
                  <YAxis stroke="var(--c-stone)" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={{ color: "#ffffff" }}
                    labelStyle={{ color: "#00ed64", fontWeight: 700 }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} iconType="circle" iconSize={8} />
                  <Area
                    type="monotone"
                    dataKey="avian"
                    name="Avian Census"
                    stroke="#00ed64"
                    strokeWidth={2}
                    fill="url(#gradAvian)"
                    dot={{ fill: "#00ed64", r: 3 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="wildlife"
                    name="Wildlife Sightings"
                    stroke="#7b3ff2"
                    strokeWidth={2}
                    fill="url(#gradWildlife)"
                    dot={{ fill: "#7b3ff2", r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="dash-empty">
                <span className="material-symbols-outlined dash-empty__icon">cruelty_free</span>
                <span className="dash-empty__text">No biodiversity surveys yet</span>
              </div>
            )}
          </ChartCard>

          {/* Chart 4: Plastic Ban Compliance (Donut) + Gauge */}
          <ChartCard
            icon="verified_user"
            title="Plastic Ban Compliance"
            subtitle="Establishment inspection results"
          >
            {analytics.plasticLogs.length > 0 ? (
              <>
                <div className="dash-mini-stats">
                  <div className="dash-mini-stat">
                    <span className="dash-mini-stat__dot" style={{ background: "#00ed64" }} />
                    <span className="dash-mini-stat__text">Compliant</span>
                    <span className="dash-mini-stat__value">{analytics.compliantCount}</span>
                  </div>
                  <div className="dash-mini-stat">
                    <span className="dash-mini-stat__dot" style={{ background: "#ff5722" }} />
                    <span className="dash-mini-stat__text">Violation</span>
                    <span className="dash-mini-stat__value">{analytics.nonCompliantCount}</span>
                  </div>
                </div>
                <GaugeRing
                  value={analytics.complianceRate}
                  color={analytics.complianceRate >= 70 ? "#00ed64" : "#ff5722"}
                  label="Overall compliance rate across inspected commercial establishments"
                />
              </>
            ) : (
              <div className="dash-empty">
                <span className="material-symbols-outlined dash-empty__icon">storefront</span>
                <span className="dash-empty__text">No plastic ban inspections yet</span>
              </div>
            )}
          </ChartCard>

          {/* Chart 5: Waste Collection by Barangay */}
          <ChartCard
            icon="delete_sweep"
            title="Waste Collection Volume"
            subtitle="Total waste collected by barangay (kg)"
          >
            {analytics.wasteData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.wasteData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-hairline)" horizontal={false} />
                  <XAxis type="number" stroke="var(--c-stone)" fontSize={11} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="var(--c-stone)"
                    fontSize={11}
                    width={90}
                    tick={{ fill: "var(--c-slate)" }}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={{ color: "#ffffff" }}
                    labelStyle={{ color: "#00ed64", fontWeight: 700 }}
                    formatter={(val) => [`${val} kg`, "Volume"]}
                  />
                  <Bar dataKey="value" name="Volume (kg)" radius={[0, 6, 6, 0]}>
                    {analytics.wasteData.map((entry, idx) => (
                      <Cell key={`waste-${idx}`} fill={idx % 2 === 0 ? "#fa6e39" : "#f5a524"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="dash-empty">
                <span className="material-symbols-outlined dash-empty__icon">recycling</span>
                <span className="dash-empty__text">No waste collection logs yet</span>
              </div>
            )}
          </ChartCard>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;
