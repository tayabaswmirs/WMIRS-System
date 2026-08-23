import { useState, useMemo } from "react";
import KpiCard from "../KpiCard";
import ChartCard from "../ChartCard";
import StatusGauge from "../StatusGauge";
import RecentLogsList from "../RecentLogsList";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ComposedChart, Line
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#001e2b",
  border: "1px solid #1c2d38",
  borderRadius: "var(--card-radius, 12px)",
  boxShadow: "var(--card-shadow, rgba(0, 30, 43, 0.08) 0px 4px 12px 0px)",
  fontSize: "12px",
  color: "#ffffff"
};

const CATEGORIES_LIST = [
  "Forest Incidents",
  "Wildlife Incidents",
  "Water Resource Incidents",
  "Waste Incidents",
  "Compliance Incidents",
  "Ecosystem Protection Incidents"
];

const LEGACY_MAP = {
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
  if (LEGACY_MAP[trimmed]) return LEGACY_MAP[trimmed];
  const found = CATEGORIES_LIST.find((c) => c.toLowerCase() === trimmed);
  return found || cat;
};

const getStatusGroup = (status) => {
  const norm = status?.toLowerCase() || "";
  if (norm === "submitted" || norm === "under review" || norm === "") return "Submitted";
  if (norm === "assigned" || norm === "unresolved") return "Open Assignment";
  if (norm === "resolved") return "Pending Verification";
  if (norm === "verified" || norm === "pending completion") return "Pending Completion";
  if (norm === "completed" || norm === "denied") return "Completed";
  return "Submitted";
};

export default function IncidentsAnalyticsView({ items = [] }) {
  const [timeRange, setTimeRange] = useState("1M");
  const [severityTimeRange, setSeverityTimeRange] = useState("1M");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const analytics = useMemo(() => {
    const filteredItems = items.filter(item => item.status?.toLowerCase() !== "denied");
    const completedItems = filteredItems.filter(item => item.status?.toLowerCase() === "completed");

    let openCount = 0;
    let completedCount = 0;
    const gaugeCounts = { "Submitted": 0, "Open Assignment": 0, "Pending Verification": 0, "Pending Completion": 0, "Completed": 0 };

    filteredItems.forEach((item) => {
      const status = item.status?.toLowerCase();
      if (status === "assigned" || status === "unresolved") openCount++;
      else if (status === "completed") completedCount++;
      const grp = getStatusGroup(item.status);
      if (gaugeCounts[grp] !== undefined) gaugeCounts[grp]++;
    });

    const incidentGaugeData = [
      { name: "Submitted", value: gaugeCounts["Submitted"], color: "#3d8eff" },
      { name: "Open Assignment", value: gaugeCounts["Open Assignment"], color: "#fa6e39" },
      { name: "Pending Verification", value: gaugeCounts["Pending Verification"], color: "#00a35c" },
      { name: "Pending Completion", value: gaugeCounts["Pending Completion"], color: "#7b3ff2" },
      { name: "Completed", value: gaugeCounts["Completed"], color: "#00ed64" }
    ];

    const recentIncidents = [...filteredItems]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 5);

    const categorySeverityData = CATEGORIES_LIST.map((cat) => {
      const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
      completedItems.forEach((item) => {
        const itemCat = normalizeCategory(item.category);
        if (itemCat === cat || itemCat.toLowerCase() === cat.toLowerCase()) {
          const norm = (item.severity || "Low").toLowerCase();
          const sev = norm === "critical" ? "Critical" : norm === "high" ? "High" : norm === "medium" ? "Medium" : "Low";
          counts[sev]++;
        }
      });
      return { name: cat.replace(" Incidents", "").replace(" Resource", "").replace(" Protection", ""), fullName: cat, ...counts };
    });

    // Logging per Day temporal buckets
    const now = new Date();
    const numBuckets = timeRange === "1D" ? 24 : timeRange === "1W" ? 7 : 30;
    const timeLimitMs = (timeRange === "1D" ? 24 : timeRange === "1W" ? 7 : 30) * (timeRange === "1D" ? 3600000 : 86400000);
    const startTimestamp = now.getTime() - timeLimitMs;
    const logBuckets = [];
    const half = Math.floor(numBuckets / 2);

    for (let i = half; i > half - numBuckets; i--) {
      const d = new Date(now.getTime() - i * (timeRange === "1D" ? 3600000 : 86400000));
      const label = timeRange === "1D"
        ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "numeric", hour12: true })
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const bucketObj = { label, timestamp: d.getTime() };
      CATEGORIES_LIST.forEach((cat) => { bucketObj[cat] = 0; });
      logBuckets.push(bucketObj);
    }

    filteredItems.forEach((item) => {
      const ts = item.createdAt?.seconds ? item.createdAt.seconds * 1000 : null;
      if (!ts || ts < startTimestamp) return;
      const itemCat = normalizeCategory(item.category);
      const matchedCat = CATEGORIES_LIST.find((c) => c === itemCat || c.toLowerCase() === itemCat.toLowerCase());
      if (!matchedCat) return;

      let bestIdx = 0, minDiff = Infinity;
      logBuckets.forEach((bucket, idx) => {
        const diff = Math.abs(bucket.timestamp - ts);
        if (diff < minDiff) { minDiff = diff; bestIdx = idx; }
      });
      logBuckets[bestIdx][matchedCat]++;
    });

    // Severity Trends
    const sevNumBuckets = severityTimeRange === "1D" ? 24 : severityTimeRange === "1W" ? 7 : 30;
    const sevLimitMs = (severityTimeRange === "1D" ? 24 : severityTimeRange === "1W" ? 7 : 30) * (severityTimeRange === "1D" ? 3600000 : 86400000);
    const sevStartTimestamp = now.getTime() - sevLimitMs;
    const severityTrendBuckets = [];
    const sevHalf = Math.floor(sevNumBuckets / 2);

    for (let i = sevHalf; i > sevHalf - sevNumBuckets; i--) {
      const d = new Date(now.getTime() - i * (severityTimeRange === "1D" ? 3600000 : 86400000));
      const label = severityTimeRange === "1D"
        ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "numeric", hour12: true })
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      severityTrendBuckets.push({ label, timestamp: d.getTime(), Low: 0, Medium: 0, High: 0, Critical: 0 });
    }

    completedItems.forEach((item) => {
      if (categoryFilter !== "All") {
        const itemCat = normalizeCategory(item.category);
        if (itemCat !== categoryFilter && itemCat.toLowerCase() !== categoryFilter.toLowerCase()) return;
      }
      const ts = item.createdAt?.seconds ? item.createdAt.seconds * 1000 : null;
      if (!ts || ts < sevStartTimestamp) return;

      const norm = (item.severity || "Low").toLowerCase();
      const sev = norm === "critical" ? "Critical" : norm === "high" ? "High" : norm === "medium" ? "Medium" : "Low";

      let bestIdx = 0, minDiff = Infinity;
      severityTrendBuckets.forEach((bucket, idx) => {
        const diff = Math.abs(bucket.timestamp - ts);
        if (diff < minDiff) { minDiff = diff; bestIdx = idx; }
      });
      severityTrendBuckets[bestIdx][sev]++;
    });

    return {
      total: filteredItems.length,
      openCount,
      completedCount,
      incidentGaugeData,
      recentIncidents,
      categorySeverityData,
      logBuckets,
      severityTrendBuckets
    };
  }, [items, timeRange, severityTimeRange, categoryFilter]);

  return (
    <div className="flex flex-col gap-6">
      {/* Tier 1: KPIs */}
      <div className="dash-kpi-grid dash-kpi-grid--three">
        <KpiCard variant="threat" icon="warning" value={analytics.total} label="Total Incidents" sub="Total reported incidents" />
        <KpiCard variant="field" icon="assignment" value={analytics.openCount} label="Open Assignments" sub="Currently assigned or unresolved" />
        <KpiCard variant="comply" icon="verified_user" value={analytics.completedCount} label="Completed Incidents" sub="Fully resolved and completed" />
      </div>

      {/* Tier 2: Recent List & Status Gauge */}
      <div className="dash-row-70-30">
        <ChartCard icon="list_alt" title="Recent Incidents" subtitle="Last 5 reported ecological threats" accentColor="#fa6e39">
          <RecentLogsList items={analytics.recentIncidents} type="incident" emptyMessage="No incidents reported yet" />
        </ChartCard>

        <ChartCard icon="query_stats" title="Incidents Status" subtitle="Breakdown of incidents by status" variant="dark">
          <StatusGauge data={analytics.incidentGaugeData} total={analytics.total} label="Incidents" />
        </ChartCard>
      </div>

      {/* Tier 3: Category Severity Stacked Bar */}
      <div className="dash-full-width-row">
        <ChartCard icon="bar_chart" title="Total Incidents by Category & Severity" subtitle="Cumulative volume of resolved incidents" variant="mint" accentColor="#00ed64">
          <div className="dash-chart-scroll-wrap">
            <div className="dash-chart-canvas-min dash-chart-canvas-min--tall">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.categorySeverityData} layout="vertical" margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" horizontal={false} vertical={true} />
                  <XAxis type="number" stroke="var(--c-stone)" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--c-stone)" fontSize={11} width={95} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="Low" stackId="a" fill="#00ed64" />
                  <Bar dataKey="Medium" stackId="a" fill="#3d8eff" />
                  <Bar dataKey="High" stackId="a" fill="#f5a524" />
                  <Bar dataKey="Critical" stackId="a" fill="#ff5722" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="dash-chart-legend">
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#00ed64" }} />
              <span className="dash-chart-legend__label">Low</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#3d8eff" }} />
              <span className="dash-chart-legend__label">Medium</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#f5a524" }} />
              <span className="dash-chart-legend__label">High</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#ff5722" }} />
              <span className="dash-chart-legend__label">Critical</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Tier 4: Temporal Logging Trends */}
      <div className="dash-full-width-row">
        <ChartCard
          icon="trending_up"
          title="Logging per Day (Category Trends)"
          subtitle="Incident volume distribution across categories over time"
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
          <div className="dash-chart-scroll-wrap">
            <div className="dash-chart-canvas-min">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={analytics.logBuckets} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.15)" />
                  <XAxis dataKey="label" stroke="rgba(0,0,0,0.5)" fontSize={11} />
                  <YAxis stroke="rgba(0,0,0,0.5)" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="Forest Incidents" stroke="#00ed64" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Wildlife Incidents" stroke="#3d8eff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Water Resource Incidents" stroke="#fa6e39" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Waste Incidents" stroke="#7b3ff2" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Compliance Incidents" stroke="#ffc107" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Ecosystem Protection Incidents" stroke="#00b545" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="dash-chart-legend">
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#00ed64" }} />
              <span className="dash-chart-legend__label">Forest</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#3d8eff" }} />
              <span className="dash-chart-legend__label">Wildlife</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#fa6e39" }} />
              <span className="dash-chart-legend__label">Water Resource</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#7b3ff2" }} />
              <span className="dash-chart-legend__label">Waste</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#ffc107" }} />
              <span className="dash-chart-legend__label">Compliance</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#00b545" }} />
              <span className="dash-chart-legend__label">Ecosystem</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Tier 5: Severity Trends */}
      <div className="dash-full-width-row">
        <ChartCard
          icon="show_chart"
          title="Incident Severity Trends"
          subtitle="Fluctuations in severity levels over selected timeframe"
          variant="warm"
          accentColor="#fa6e39"
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
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
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
          <div className="dash-chart-scroll-wrap">
            <div className="dash-chart-canvas-min">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={analytics.severityTrendBuckets} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.15)" />
                  <XAxis dataKey="label" stroke="rgba(0,0,0,0.5)" fontSize={11} />
                  <YAxis stroke="rgba(0,0,0,0.5)" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="Low" name="Low" stroke="#00ed64" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Medium" name="Medium" stroke="#3d8eff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="High" name="High" stroke="#f5a524" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Critical" name="Critical" stroke="#ff5722" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="dash-chart-legend">
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#00ed64" }} />
              <span className="dash-chart-legend__label">Low</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#3d8eff" }} />
              <span className="dash-chart-legend__label">Medium</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#f5a524" }} />
              <span className="dash-chart-legend__label">High</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#ff5722" }} />
              <span className="dash-chart-legend__label">Critical</span>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
