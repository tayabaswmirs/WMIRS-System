import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatPill from "../components/common/StatPill";
import KpiCard from "../components/common/KpiCard";
import ChartCard from "../components/common/ChartCard";
import StatusGauge from "../components/common/StatusGauge";
import RecentLogsList from "../components/common/RecentLogsList";
import { getAllUsers } from "../firebase/services/userService";
import { subscribeToAllIncidents } from "../firebase/services/incidentService";
import { subscribeToAllMonitoring } from "../firebase/services/monitoringService";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Line, CartesianGrid, Area
} from "recharts";
import "../styles/dashboard.css";

/** Shared dark-mode tooltip styling for Recharts */
const TOOLTIP_STYLE = {
  backgroundColor: "#001e2b",
  border: "1px solid #1c2d38",
  borderRadius: "var(--card-radius, 12px)",
  boxShadow: "var(--card-shadow, rgba(0, 30, 43, 0.08) 0px 4px 12px 0px)",
  fontSize: "12px",
  color: "#ffffff"
};

/* ── Date and Color Formatting Utilities ───────────────────── */
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

/* ═══════════════════════════════════════════════════════════════
   Main Admin Dashboard Component
   ═══════════════════════════════════════════════════════════════ */
function AdminDashboard() {
  const [counts, setCounts] = useState({ admin: 0, staff: 0, ranger: 0 });
  const [incidents, setIncidents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [timeRange, setTimeRange] = useState("1M"); // "1D", "1W", "1M"

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
  const completedLogsCount = useMemo(() => {
    const compIncidents = incidents.filter(
      (i) => i.status === "completed" || i.status === "denied"
    ).length;
    const compLogs = logs.filter(
      (l) => l.status === "completed" || l.status === "denied"
    ).length;
    return compIncidents + compLogs;
  }, [incidents, logs]);

  const recentIncidents = useMemo(() => {
    return [...incidents]
      .sort((a, b) => {
        const secA = a.createdAt?.seconds || 0;
        const secB = b.createdAt?.seconds || 0;
        return secB - secA;
      })
      .slice(0, 5);
  }, [incidents]);

  const recentLogs = useMemo(() => {
    return [...logs]
      .sort((a, b) => {
        const secA = a.createdAt?.seconds || 0;
        const secB = b.createdAt?.seconds || 0;
        return secB - secA;
      })
      .slice(0, 5);
  }, [logs]);

  const incidentGaugeData = useMemo(() => {
    const countsMap = {
      "Submitted": 0,
      "Open Assignment": 0,
      "Pending Verification": 0,
      "Pending Completion": 0,
      "Completed / Denied": 0
    };
    incidents.forEach((item) => {
      const group = getStatusGroup(item.status);
      countsMap[group]++;
    });
    return [
      { name: "Submitted", value: countsMap["Submitted"], color: "var(--c-accent-blue)" },
      { name: "Open Assignment", value: countsMap["Open Assignment"], color: "var(--c-accent-orange)" },
      { name: "Pending Verification", value: countsMap["Pending Verification"], color: "var(--c-teal)" },
      { name: "Pending Completion", value: countsMap["Pending Completion"], color: "var(--c-accent-purple)" },
      { name: "Completed / Denied", value: countsMap["Completed / Denied"], color: "var(--c-green)" }
    ];
  }, [incidents]);

  const monitoringGaugeData = useMemo(() => {
    const countsMap = {
      "Submitted": 0,
      "Open Assignment": 0,
      "Pending Verification": 0,
      "Pending Completion": 0,
      "Completed / Denied": 0
    };
    logs.forEach((item) => {
      const group = getStatusGroup(item.status);
      countsMap[group]++;
    });
    return [
      { name: "Submitted", value: countsMap["Submitted"], color: "var(--c-accent-blue)" },
      { name: "Open Assignment", value: countsMap["Open Assignment"], color: "var(--c-accent-orange)" },
      { name: "Pending Verification", value: countsMap["Pending Verification"], color: "var(--c-teal)" },
      { name: "Pending Completion", value: countsMap["Pending Completion"], color: "var(--c-accent-purple)" },
      { name: "Completed / Denied", value: countsMap["Completed / Denied"], color: "var(--c-green)" }
    ];
  }, [logs]);

  const chartData = useMemo(() => {
    const now = new Date();
    if (timeRange === "1D") {
      const buckets = [];
      for (let i = 12; i >= -11; i--) {
        const d = new Date(now.getTime() - i * 3600000);
        d.setMinutes(0, 0, 0);
        buckets.push({
          time: d,
          label: d.toLocaleTimeString(undefined, { hour: "numeric", hour12: true }),
          incidents: 0,
          monitoring: 0
        });
      }
      incidents.forEach((item) => {
        const ts = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt);
        if (isNaN(ts.getTime())) return;
        const diffHours = Math.floor((now - ts) / 3600000);
        if (diffHours >= 0 && diffHours < 24) {
          buckets[23 - diffHours].incidents++;
        }
      });
      logs.forEach((item) => {
        const ts = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt);
        if (isNaN(ts.getTime())) return;
        const diffHours = Math.floor((now - ts) / 3600000);
        if (diffHours >= 0 && diffHours < 24) {
          buckets[23 - diffHours].monitoring++;
        }
      });
      return buckets;
    } else if (timeRange === "1W") {
      const buckets = [];
      for (let i = 3; i >= -3; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        d.setHours(0, 0, 0, 0);
        buckets.push({
          time: d,
          label: d.toLocaleDateString(undefined, { weekday: "short" }),
          incidents: 0,
          monitoring: 0
        });
      }
      incidents.forEach((item) => {
        const ts = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt);
        if (isNaN(ts.getTime())) return;
        const itemDate = new Date(ts);
        itemDate.setHours(0, 0, 0, 0);
        const idx = buckets.findIndex((b) => b.time.getTime() === itemDate.getTime());
        if (idx !== -1) {
          buckets[idx].incidents++;
        }
      });
      logs.forEach((item) => {
        const ts = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt);
        if (isNaN(ts.getTime())) return;
        const itemDate = new Date(ts);
        itemDate.setHours(0, 0, 0, 0);
        const idx = buckets.findIndex((b) => b.time.getTime() === itemDate.getTime());
        if (idx !== -1) {
          buckets[idx].monitoring++;
        }
      });
      return buckets;
    } else { // "1M"
      const buckets = [];
      for (let i = 15; i >= -14; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        d.setHours(0, 0, 0, 0);
        buckets.push({
          time: d,
          label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          incidents: 0,
          monitoring: 0
        });
      }
      incidents.forEach((item) => {
        const ts = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt);
        if (isNaN(ts.getTime())) return;
        const itemDate = new Date(ts);
        itemDate.setHours(0, 0, 0, 0);
        const idx = buckets.findIndex((b) => b.time.getTime() === itemDate.getTime());
        if (idx !== -1) {
          buckets[idx].incidents++;
        }
      });
      logs.forEach((item) => {
        const ts = item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : new Date(item.createdAt);
        if (isNaN(ts.getTime())) return;
        const itemDate = new Date(ts);
        itemDate.setHours(0, 0, 0, 0);
        const idx = buckets.findIndex((b) => b.time.getTime() === itemDate.getTime());
        if (idx !== -1) {
          buckets[idx].monitoring++;
        }
      });
      return buckets;
    }
  }, [incidents, logs, timeRange]);

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
        <div className="dash-kpi-grid dash-kpi-grid--three">
          <KpiCard
            variant="threat"
            icon="warning"
            value={incidents.length}
            label="Incidents Log"
            sub="Total incidents reported"
          />
          <KpiCard
            variant="field"
            icon="forest"
            value={logs.length}
            label="Monitoring Logs"
            sub="Total monitoring logs reported"
          />
          <KpiCard
            variant="comply"
            icon="verified_user"
            value={completedLogsCount}
            label="Completed Logs"
            sub="Combined completed & denied logs"
          />
        </div>

        {/* ══ TIER 2 & 3: Overhauled Visual Grid ═════════════════ */}
        <div className="dash-row-70-30">
          {/* Row 1: Recent Incidents List (70%) & Incident Gauge (30%) */}
          <ChartCard icon="list_alt" title="Recent Incidents" subtitle="Last 5 reported ecological threats" accentColor="#fa6e39">
            <RecentLogsList
              items={recentIncidents}
              type="incident"
              emptyMessage="No incidents reported yet"
            />
          </ChartCard>

          <ChartCard icon="query_stats" title="Incidents Status" subtitle="Breakdown of incidents by status" variant="dark">
            <StatusGauge
              data={incidentGaugeData}
              total={incidents.length}
              label="Incidents"
            />
          </ChartCard>
        </div>

        <div className="dash-row-30-70">
          {/* Row 2: Monitoring Gauge (30%) & Recent Monitoring Logs (70%) */}
          <ChartCard icon="pie_chart" title="Monitoring Status" subtitle="Breakdown of monitoring logs by status" variant="dark">
            <StatusGauge
              data={monitoringGaugeData}
              total={logs.length}
              label="Monitoring Logs"
            />
          </ChartCard>

          <ChartCard icon="list_alt" title="Recent Monitoring Logs" subtitle="Last 5 reported field observations" accentColor="#00ed64">
            <RecentLogsList
              items={recentLogs}
              type="monitoring"
              emptyMessage="No monitoring logs reported yet"
            />
          </ChartCard>
        </div>

        {/* Row 3: Logging Frequency Line Chart (Full Width) */}
        <div className="dash-full-width-row">
          <ChartCard
            icon="trending_up"
            title="No of Logging"
            subtitle="Comparison trend of incidents vs monitoring submissions"
            variant="blue"
            accentColor="#3d8eff"
            extraHeader={
              <div className="time-tabs">
                <button
                  className={`time-tab ${timeRange === "1D" ? "time-tab--active" : ""}`}
                  onClick={() => setTimeRange("1D")}
                >
                  1D
                </button>
                <button
                  className={`time-tab ${timeRange === "1W" ? "time-tab--active" : ""}`}
                  onClick={() => setTimeRange("1W")}
                >
                  1W
                </button>
                <button
                  className={`time-tab ${timeRange === "1M" ? "time-tab--active" : ""}`}
                  onClick={() => setTimeRange("1M")}
                >
                  1M
                </button>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="adminIncidentGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7b3ff2" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#7b3ff2" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="adminMonitoringGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ed64" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#00ed64" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-hairline)" />
                <XAxis dataKey="label" stroke="var(--c-stone)" fontSize={11} />
                <YAxis stroke="var(--c-stone)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={{ color: "#ffffff" }}
                  labelStyle={{ color: "#00ed64", fontWeight: 700 }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} iconType="circle" iconSize={8} />
                <Area
                  type="monotone"
                  dataKey="incidents"
                  stroke="none"
                  fill="url(#adminIncidentGlow)"
                  legendType="none"
                />
                <Area
                  type="monotone"
                  dataKey="monitoring"
                  stroke="none"
                  fill="url(#adminMonitoringGlow)"
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="incidents"
                  name="Incident"
                  stroke="#7b3ff2"
                  strokeWidth={2.5}
                  dot={{ fill: "#7b3ff2", r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="monitoring"
                  name="Monitoring Log"
                  stroke="#00ed64"
                  strokeWidth={2.5}
                  dot={{ fill: "#00ed64", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;

