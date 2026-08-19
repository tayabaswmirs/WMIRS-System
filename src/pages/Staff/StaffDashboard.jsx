import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/layout/DashboardLayout";
import KpiCard from "../../components/common/KpiCard";
import ChartCard from "../../components/common/ChartCard";
import StatusGauge from "../../components/common/StatusGauge";
import RecentLogsList from "../../components/common/RecentLogsList";
import StatPill from "../../components/common/StatPill";
import { subscribeToAllIncidents } from "../../firebase/services/incidentService";
import { subscribeToCategoryMonitoring } from "../../firebase/services/monitoringService";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area, CartesianGrid, Legend, ComposedChart, Line
} from "recharts";
import "../../styles/dashboard.css";

/* ── Color & Chart Config Tokens ─────────────────────────── */

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

/* ── Reusable Gauge Ring (Used by monitoring dashboard) ────── */
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

/* ── Local Chart Card Wrapper (Used by monitoring dashboard) ── */
function LocalChartCard({ icon, title, subtitle, children }) {
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

/* ── Local KPI Card (Used by monitoring dashboard) ────────── */
function LocalKpiCard({ variant, icon, value, label, sub }) {
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

const getStatusGroup = (status) => {
  const norm = status?.toLowerCase() || "";
  if (norm === "submitted" || norm === "under review" || norm === "") {
    return "Submitted";
  }
  if (norm === "assigned" || norm === "unresolved") {
    return "Open Assignment";
  }
  if (norm === "resolved") {
    return "Pending Verification";
  }
  if (norm === "verified" || norm === "pending completion") {
    return "Pending Completion";
  }
  if (norm === "completed" || norm === "denied") {
    return "Completed / Denied";
  }
  return "Submitted";
};

/* ── Main Component ───────────────────────────────────────── */
function StaffDashboard() {
  const { staffScope } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Range and filter states for incident charts
  const [timeRange, setTimeRange] = useState("1M");
  const [severityTimeRange, setSeverityTimeRange] = useState("1M");
  const [categoryFilter, setCategoryFilter] = useState("All");

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
    if (isIncidents) {
      console.log("=== STAFF DASHBOARD DIAGNOSTICS ===");
      console.log("Items count:", items.length);
      console.log("Items details:", JSON.stringify(items.map(item => ({
        id: item.id,
        category: item.category,
        severity: item.severity,
        status: item.status
      }))));
      // 1. KPI Counts
      const totalIncidents = items.length;
      let openCount = 0;
      let completedCount = 0;

      items.forEach((item) => {
        const status = item.status?.toLowerCase();
        if (status === "assigned" || status === "unresolved") {
          openCount++;
        } else if (
          status === "verified" ||
          status === "pending completion" ||
          status === "completed" ||
          status === "denied"
        ) {
          completedCount++;
        }
      });

      // 2. Incident Status Gauge Data (First Gauge)
      const incidentGaugeCounts = {
        "Submitted": 0,
        "Open Assignment": 0,
        "Pending Verification": 0,
        "Pending Completion": 0,
        "Completed / Denied": 0
      };
      items.forEach((item) => {
        const grp = getStatusGroup(item.status);
        if (incidentGaugeCounts[grp] !== undefined) {
          incidentGaugeCounts[grp]++;
        }
      });
      const incidentGaugeData = [
        { name: "Submitted", value: incidentGaugeCounts["Submitted"], color: "#3d8eff" },
        { name: "Open Assignment", value: incidentGaugeCounts["Open Assignment"], color: "#fa6e39" },
        { name: "Pending Verification", value: incidentGaugeCounts["Pending Verification"], color: "#00a35c" },
        { name: "Pending Completion", value: incidentGaugeCounts["Pending Completion"], color: "#7b3ff2" },
        { name: "Completed / Denied", value: incidentGaugeCounts["Completed / Denied"], color: "#00ed64" }
      ];

      // 3. Active Assignments Gauge Data (Second Gauge)
      let activeQueueCount = 0;
      let pendingVerificationCount = 0;
      items.forEach((item) => {
        const status = item.status?.toLowerCase();
        if (status === "assigned" || status === "unresolved") {
          activeQueueCount++;
        } else if (status === "resolved") {
          pendingVerificationCount++;
        }
      });
      const activeGaugeData = [
        { name: "Open Queue", value: activeQueueCount, color: "#fa6e39" },
        { name: "Pending Verification", value: pendingVerificationCount, color: "#00a35c" }
      ];
      const totalActive = activeQueueCount + pendingVerificationCount;

      // 4. Recent Collections
      const recentIncidents = [...items]
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 5);

      const openRecentAssignments = items
        .filter(item => ["assigned", "unresolved", "resolved"].includes(item.status?.toLowerCase()))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 5);

      // 5. Category Stacked Bar Data
      const categoriesList = [
        "Forest Incidents",
        "Wildlife Incidents",
        "Water Resource Incidents",
        "Waste Incidents",
        "Compliance Incidents",
        "Ecosystem Protection Incidents"
      ];

      const LEGACY_CATEGORY_MAP = {
        "forest management": "Forest Incidents",
        "biodiversity monitoring": "Wildlife Incidents",
        "water resources management": "Water Resource Incidents",
        "water resource incidents": "Water Resource Incidents",
        "waste management": "Waste Incidents",
        "waste incidents": "Waste Incidents",
        "environmental compliance": "Compliance Incidents",
        "compliance incidents": "Compliance Incidents",
        "land and ecosystem protection": "Ecosystem Protection Incidents",
        "ecosystem protection incidents": "Ecosystem Protection Incidents"
      };

      const normalizeCategory = (cat) => {
        if (!cat) return "";
        const trimmed = cat.trim().toLowerCase();
        if (LEGACY_CATEGORY_MAP[trimmed]) return LEGACY_CATEGORY_MAP[trimmed];
        const found = categoriesList.find((c) => c.toLowerCase() === trimmed);
        return found || cat;
      };

      const categorySeverityData = categoriesList.map((cat) => {
        const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
        items.forEach((item) => {
          const itemCat = normalizeCategory(item.category);
          const isMatch = itemCat === cat || itemCat.toLowerCase() === cat.toLowerCase();

          if (isMatch) {
            const rawSev = item.severity || "Low";
            let sev = "Low";
            const norm = rawSev.toLowerCase();
            if (norm === "medium") sev = "Medium";
            else if (norm === "high") sev = "High";
            else if (norm === "critical") sev = "Critical";

            counts[sev]++;
          }
        });
        return {
          name: cat.replace(" Incidents", "").replace(" Resource", "").replace(" Protection", ""),
          fullName: cat,
          ...counts
        };
      });

      // Calculate maximum total incident count for dynamic X-axis ruler domain
      const totalSums = categorySeverityData.map(d => d.Low + d.Medium + d.High + d.Critical);
      const dataMax = Math.max(...totalSums, 0);
      // Dynamically set based on the highest count, plus 1 for breathing room
      const maxIncidentCount = dataMax > 0 ? dataMax + 1 : 5;

      console.log("Calculated categorySeverityData:", JSON.stringify(categorySeverityData));
      console.log("Calculated maxIncidentCount:", maxIncidentCount);

      // 6. Logging Per Day Category trends
      const now = new Date();
      let numBuckets;
      let timeLimitMs;

      if (timeRange === "1D") {
        numBuckets = 24;
        timeLimitMs = 24 * 60 * 60 * 1000;
      } else if (timeRange === "1W") {
        numBuckets = 7;
        timeLimitMs = 7 * 24 * 60 * 60 * 1000;
      } else {
        numBuckets = 30;
        timeLimitMs = 30 * 24 * 60 * 60 * 1000;
      }

      const startTimestamp = now.getTime() - timeLimitMs;
      const logBuckets = [];
      const logHalf = Math.floor(numBuckets / 2);

      for (let i = logHalf; i > logHalf - numBuckets; i--) {
        const d = new Date(now.getTime() - i * (timeRange === "1D" ? 3600000 : 86400000));
        const label = timeRange === "1D"
          ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "numeric", hour12: true })
          : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

        const bucketObj = { label, timestamp: d.getTime() };
        categoriesList.forEach((cat) => {
          bucketObj[cat] = 0;
        });
        logBuckets.push(bucketObj);
      }

      items.forEach((item) => {
        const ts = item.createdAt?.seconds ? item.createdAt.seconds * 1000 : null;
        if (!ts || ts < startTimestamp) return;

        const itemCat = normalizeCategory(item.category);
        const matchedCat = categoriesList.find((cat) => cat === itemCat || cat.toLowerCase() === itemCat.toLowerCase());

        if (!matchedCat) return;

        let bestIdx = 0;
        let minDiff = Infinity;
        logBuckets.forEach((bucket, idx) => {
          const diff = Math.abs(bucket.timestamp - ts);
          if (diff < minDiff) {
            minDiff = diff;
            bestIdx = idx;
          }
        });

        logBuckets[bestIdx][matchedCat]++;
      });

      // 7. Severity trends
      let sevNumBuckets;
      let sevTimeLimitMs;

      if (severityTimeRange === "1D") {
        sevNumBuckets = 24;
        sevTimeLimitMs = 24 * 60 * 60 * 1000;
      } else if (severityTimeRange === "1W") {
        sevNumBuckets = 7;
        sevTimeLimitMs = 7 * 24 * 60 * 60 * 1000;
      } else {
        sevNumBuckets = 30;
        sevTimeLimitMs = 30 * 24 * 60 * 60 * 1000;
      }

      const sevStartTimestamp = now.getTime() - sevTimeLimitMs;
      const severityTrendBuckets = [];
      const severities = ["Low", "Medium", "High", "Critical"];
      const sevHalf = Math.floor(sevNumBuckets / 2);

      for (let i = sevHalf; i > sevHalf - sevNumBuckets; i--) {
        const d = new Date(now.getTime() - i * (severityTimeRange === "1D" ? 3600000 : 86400000));
        const label = severityTimeRange === "1D"
          ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "numeric", hour12: true })
          : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

        const bucketObj = { label, timestamp: d.getTime() };
        severities.forEach((sev) => {
          bucketObj[sev] = 0;
        });
        severityTrendBuckets.push(bucketObj);
      }

      items.forEach((item) => {
        if (categoryFilter !== "All") {
          const itemCat = normalizeCategory(item.category);
          const filterCat = categoryFilter.trim();
          const isFilterMatch = itemCat === filterCat || itemCat.toLowerCase() === filterCat.toLowerCase();
          if (!isFilterMatch) return;
        }

        const ts = item.createdAt?.seconds ? item.createdAt.seconds * 1000 : null;
        if (!ts || ts < sevStartTimestamp) return;

        const rawSev = item.severity || "Low";
        let sev = "Low";
        const norm = rawSev.toLowerCase();
        if (norm === "medium") sev = "Medium";
        else if (norm === "high") sev = "High";
        else if (norm === "critical") sev = "Critical";

        let bestIdx = 0;
        let minDiff = Infinity;
        severityTrendBuckets.forEach((bucket, idx) => {
          const diff = Math.abs(bucket.timestamp - ts);
          if (diff < minDiff) {
            minDiff = diff;
            bestIdx = idx;
          }
        });

        severityTrendBuckets[bestIdx][sev]++;
      });

      return {
        totalIncidents,
        openCount,
        completedCount,
        incidentGaugeData,
        activeGaugeData,
        totalActive,
        recentIncidents,
        openRecentAssignments,
        categorySeverityData,
        maxIncidentCount,
        logBuckets,
        severityTrendBuckets,
        categoriesList
      };
    } else {
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

      // 4. Monitoring specific data structures
      let compliantCount = 0;
      let nonCompliantCount = 0;
      const subcategoryCount = {};

      items.forEach((item) => {
        const status = item.status?.toLowerCase();
        const ts = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : null;

        // Status aggregations
        if (status === "submitted" || status === "under review") {
          awaitingReview++;
        } else if (status === "assigned" || status === "unresolved") {
          activeTasks++;
        } else if (status === "resolved") {
          resolvedCount++;
        } else if (
          status === "verified" ||
          status === "pending completion" ||
          status === "completed" ||
          status === "denied"
        ) {
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

        if (item.compliant === true) {
          compliantCount++;
        } else if (item.compliant === false) {
          nonCompliantCount++;
        }
        const subcat = item.subcategory || "Unknown";
        subcategoryCount[subcat] = (subcategoryCount[subcat] || 0) + 1;
      });

      const monthlyData = Array.from(monthlyMap.values()).map((d) => ({
        ...d,
        velocity: d.volume > 0 ? Math.round((d.resolved / d.volume) * 100) : 0
      }));

      const velocity = total > 0 ? Math.round((completedCount / total) * 100) : 0;

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
        compliantCount,
        nonCompliantCount,
        complianceRate,
        subcatData
      };
    }
  }, [items, isIncidents, timeRange, severityTimeRange, categoryFilter]);

  if (isIncidents) {
    return (
      <DashboardLayout>
        <div className="incidents-page">
          {/* Scoped Dashboard Header */}
          <div className="inc-hero">
            <div className="inc-hero__left">
              <span className="inc-hero__eyebrow">Auditing & Intelligence</span>
              <h1 className="inc-hero__title">Incident Audits Dashboard</h1>
              <p className="inc-hero__subtitle">
                Visual field intelligence, severity metrics, and processing velocity scoped to your review domain.
              </p>
            </div>
          </div>

          {/* Scoped KPI Grid */}
          <div className="dash-kpi-grid dash-kpi-grid--three">
            <KpiCard
              variant="threat"
              icon="warning"
              value={analytics.totalIncidents}
              label="Total Incidents"
              sub="Total reported incidents in system"
            />
            <KpiCard
              variant="field"
              icon="assignment"
              value={analytics.openCount}
              label="Open Assignments"
              sub="Incidents currently assigned or unresolved"
            />
            <KpiCard
              variant="comply"
              icon="verified_user"
              value={analytics.completedCount}
              label="Completed Incidents"
              sub="Resolved, completed, or denied reports"
            />
          </div>

          {/* Row 2: Recent Incidents List (70%) & Incident Status Gauge (30%) */}
          {loading ? (
            <p className="loading-text" style={{ padding: "64px", textAlign: "center", color: "var(--c-steel)" }}>
              Loading dashboard analytics...
            </p>
          ) : (
            <>
              <div className="dash-row-70-30">
                <ChartCard icon="list_alt" title="Recent Incidents" subtitle="Last 5 reported ecological threats" accentColor="#fa6e39">
                  <RecentLogsList
                    items={analytics.recentIncidents}
                    type="incident"
                    emptyMessage="No incidents reported yet"
                  />
                </ChartCard>

                <ChartCard icon="query_stats" title="Incidents Status" subtitle="Breakdown of incidents by status" variant="dark">
                  <StatusGauge
                    data={analytics.incidentGaugeData}
                    total={analytics.totalIncidents}
                    label="Incidents"
                  />
                </ChartCard>
              </div>

              {/* Row 3: Active Status Gauge (30%) & Open Recent Assignments (70%) */}
              <div className="dash-row-30-70">
                <ChartCard icon="pie_chart" title="Active Status" subtitle="Breakdown of active queue by status" variant="dark">
                  <StatusGauge
                    data={analytics.activeGaugeData}
                    total={analytics.totalActive}
                    label="Assignments"
                  />
                </ChartCard>

                <ChartCard icon="assignment" title="Open Recent Assignments" subtitle="Last 5 assigned or unresolved incident tasks" accentColor="#7b3ff2">
                  <RecentLogsList
                    items={analytics.openRecentAssignments}
                    type="incident"
                    emptyMessage="No open assignments in your queue"
                  />
                </ChartCard>
              </div>

              {/* Row 4: Horizontal Stacked Bar Chart */}
              <div className="dash-full-width-row">
                <ChartCard icon="bar_chart" title="No. of Incidents" subtitle="Incident volume breakdown by category and severity" variant="mint" accentColor="#00ed64">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      key={`barchart-${items.length}`}
                      data={analytics.categorySeverityData}
                      layout="vertical"
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.15)" horizontal={false} vertical={true} />
                      <XAxis
                        type="number"
                        stroke="var(--c-stone)"
                        fontSize={11}
                        allowDecimals={false}
                        domain={[0, analytics.maxIncidentCount]}
                        tickCount={analytics.maxIncidentCount <= 10 ? analytics.maxIncidentCount + 1 : undefined}
                      />
                      <YAxis dataKey="name" type="category" stroke="var(--c-stone)" fontSize={11} width={120} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} iconType="circle" iconSize={8} />
                      <Bar dataKey="Low" name="Low" stackId="a" fill="#00ed64" />
                      <Bar dataKey="Medium" name="Medium" stackId="a" fill="#3d8eff" />
                      <Bar dataKey="High" name="High" stackId="a" fill="#f5a524" />
                      <Bar dataKey="Critical" name="Critical" stackId="a" fill="#ff5722" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Row 5: Logging Trend Chart */}
              <div className="dash-full-width-row">
                <ChartCard
                  icon="trending_up"
                  title="Logging Per Day"
                  subtitle="Submission trend per incident category over time"
                  variant="blue"
                  accentColor="#3d8eff"
                  extraHeader={
                    <div className="time-tabs">
                      {["1D", "1W", "1M"].map((range) => (
                        <button
                          key={range}
                          className={`time-tab ${timeRange === range ? "time-tab--active" : ""}`}
                          onClick={() => setTimeRange(range)}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={analytics.logBuckets} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="forestGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00a35c" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#00a35c" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="biodiversityGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7b3ff2" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#7b3ff2" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="waterGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3d4f9f" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#3d4f9f" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="wasteGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fa6e39" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#fa6e39" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="complianceGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f06bb8" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#f06bb8" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="landGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00684a" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#00684a" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.15)" />
                      <XAxis dataKey="label" stroke="rgba(0,0,0,0.5)" fontSize={11} />
                      <YAxis stroke="rgba(0,0,0,0.5)" fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} iconType="circle" iconSize={8} />

                      <Area type="monotone" dataKey="Forest Incidents" stroke="none" fill="url(#forestGlow)" legendType="none" />
                      <Area type="monotone" dataKey="Wildlife Incidents" stroke="none" fill="url(#biodiversityGlow)" legendType="none" />
                      <Area type="monotone" dataKey="Water Resource Incidents" stroke="none" fill="url(#waterGlow)" legendType="none" />
                      <Area type="monotone" dataKey="Waste Incidents" stroke="none" fill="url(#wasteGlow)" legendType="none" />
                      <Area type="monotone" dataKey="Compliance Incidents" stroke="none" fill="url(#complianceGlow)" legendType="none" />
                      <Area type="monotone" dataKey="Ecosystem Protection Incidents" stroke="none" fill="url(#landGlow)" legendType="none" />

                      <Line type="monotone" dataKey="Forest Incidents" name="Forest" stroke="#00a35c" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Wildlife Incidents" name="Wildlife" stroke="#7b3ff2" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Water Resource Incidents" name="Water" stroke="#3d4f9f" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Waste Incidents" name="Waste" stroke="#fa6e39" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Compliance Incidents" name="Compliance" stroke="#f06bb8" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Ecosystem Protection Incidents" name="Ecosystem" stroke="#00684a" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Row 6: Severity Trend Chart */}
              <div className="dash-full-width-row">
                <ChartCard
                  icon="monitoring"
                  title="Severity"
                  subtitle="Incident volume trend grouped by severity level"
                  variant="warm"
                  accentColor="#ff5722"
                  extraHeader={
                    <div className="dash-chart-controls">
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="dash-chart-select"
                        style={{
                          background: "var(--c-canvas)",
                          border: "1px solid var(--c-hairline)",
                          borderRadius: "var(--r-md)",
                          padding: "4px 8px",
                          fontSize: "12px",
                          color: "var(--c-ink)",
                          outline: "none"
                        }}
                      >
                        <option value="All">All Categories</option>
                        {analytics.categoriesList.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <div className="time-tabs">
                        {["1D", "1W", "1M"].map((range) => (
                          <button
                            key={range}
                            className={`time-tab ${severityTimeRange === range ? "time-tab--active" : ""}`}
                            onClick={() => setSeverityTimeRange(range)}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                  }
                >
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={analytics.severityTrendBuckets} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="lowGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ed64" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#00ed64" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="mediumGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3d8eff" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#3d8eff" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="highGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f5a524" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#f5a524" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="criticalGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff5722" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#ff5722" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.15)" />
                      <XAxis dataKey="label" stroke="rgba(0,0,0,0.5)" fontSize={11} />
                      <YAxis stroke="rgba(0,0,0,0.5)" fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} iconType="circle" iconSize={8} />

                      <Area type="monotone" dataKey="Low" stroke="none" fill="url(#lowGlow)" legendType="none" />
                      <Area type="monotone" dataKey="Medium" stroke="none" fill="url(#mediumGlow)" legendType="none" />
                      <Area type="monotone" dataKey="High" stroke="none" fill="url(#highGlow)" legendType="none" />
                      <Area type="monotone" dataKey="Critical" stroke="none" fill="url(#criticalGlow)" legendType="none" />

                      <Line type="monotone" dataKey="Low" name="Low" stroke="#00ed64" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Medium" name="Medium" stroke="#3d8eff" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="High" name="High" stroke="#f5a524" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Critical" name="Critical" stroke="#ff5722" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Original Monitoring return (safeguarded)
  return (
    <DashboardLayout>
      <div className="incidents-page">
        {/* Scoped Dashboard Header */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">Auditing & Intelligence</span>
            <h1 className="inc-hero__title">
              {staffScope} Monitoring Dashboard
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
          <LocalKpiCard
            variant="comply"
            icon="verified_user"
            value={`${analytics.complianceRate}%`}
            label="Compliance Rate"
            sub={`${analytics.compliantCount} compliant · ${analytics.nonCompliantCount} violations`}
          />
          <LocalKpiCard
            variant="field"
            icon="fact_check"
            value={analytics.total}
            label="Domain Submissions"
            sub={`Total reports under your scope`}
          />
          <LocalKpiCard
            variant="water"
            icon="assignment"
            value={analytics.activeTasks}
            label="Active Queue"
            sub="Ranger tasks currently unresolved"
          />
          <LocalKpiCard
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
            <LocalChartCard icon="monitoring" title="Monthly Submissions & Closures">
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
            </LocalChartCard>

            {/* Chart 2: Monitoring subcategory Breakdown */}
            <LocalChartCard icon="bar_chart" title="Monitoring Subcategory Breakdown">
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
            </LocalChartCard>

            {/* Gauge Row (Resolution Velocity vs Compliance / Category split) */}
            <LocalChartCard icon="donut_large" title="Review Metrics Oversight">
              <div className="flex justify-around items-center h-[300px]">
                <GaugeRing value={analytics.velocity} color="#00ed64" label="Resolution Velocity" />
                <GaugeRing value={analytics.complianceRate} color="#3d8eff" label="Compliance Rate" />
              </div>
            </LocalChartCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default StaffDashboard;
