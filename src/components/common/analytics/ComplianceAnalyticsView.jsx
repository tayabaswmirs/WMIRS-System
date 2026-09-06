import { useState, useMemo } from "react";
import KpiCard from "../KpiCard";
import ChartCard from "../ChartCard";
import StatusGauge from "../StatusGauge";
import RecentLogsList from "../RecentLogsList";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, CartesianGrid, ComposedChart
} from "recharts";
import { TIME_RANGES, createTemporalBuckets, incrementTemporalBucket, extractTimestampMs } from "../../../utils/temporalBuckets";
import { resolveBarangay } from "../../../utils/tayabasBarangays";

const TOOLTIP_STYLE = {
  backgroundColor: "#001e2b",
  border: "1px solid #1c2d38",
  borderRadius: "var(--card-radius, 12px)",
  boxShadow: "var(--card-shadow, rgba(0, 30, 43, 0.08) 0px 4px 12px 0px)",
  fontSize: "12px",
  color: "#ffffff"
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

export default function ComplianceAnalyticsView({ items = [] }) {
  const [timeRange, setTimeRange] = useState("1M");

  const analytics = useMemo(() => {
    const filteredItems = items.filter(item => item.status?.toLowerCase() !== "denied");
    const completedItems = filteredItems.filter(item => item.status?.toLowerCase() === "completed");

    let compliantCount = 0;
    let nonCompliantCount = 0;
    let totalWasteKg = 0;
    let wasteRunsCount = 0;
    let enforcementActionsCount = 0;

    const statusCounts = { "Submitted": 0, "Open Assignment": 0, "Pending Verification": 0, "Pending Completion": 0, "Completed": 0 };
    const businessMap = {
      "Commercial Establishment": { compliant: 0, nonCompliant: 0 },
      "Public Market Vendor": { compliant: 0, nonCompliant: 0 },
      "Supermarket": { compliant: 0, nonCompliant: 0 },
      "Convenience Store": { compliant: 0, nonCompliant: 0 },
      "Restaurant/Eatery": { compliant: 0, nonCompliant: 0 },
      "Wholesale/Retail Store": { compliant: 0, nonCompliant: 0 },
      "Individual": { compliant: 0, nonCompliant: 0 }
    };
    const barangayWasteMap = {};
    const enforcementTypes = { "Verbal Warning": 0, "Written Notice": 0, "Citation": 0 };
    const recentOperationalIssues = [];

    // Temporal setup via centralized engine
    const temporalBuckets = createTemporalBuckets(timeRange, filteredItems, {
      wasteLogs: 0,
      inspections: 0
    });

    filteredItems.forEach((item) => {
      const grp = getStatusGroup(item.status);
      if (statusCounts[grp] !== undefined) statusCounts[grp]++;

      if (item.subcategory === "Waste Collection Tracking Form") {
        wasteRunsCount++;
      } else if (item.subcategory === "Operational Issue" || (item.type === "incident" && item.category === "Compliance Incidents")) {
        recentOperationalIssues.push(item);
      }

      const ts = extractTimestampMs(item.createdAt || item.dateTime);
      if (ts) {
        incrementTemporalBucket(temporalBuckets, timeRange, ts, (bucket) => {
          if (item.subcategory === "Waste Collection Tracking Form") bucket.wasteLogs++;
          else if (item.subcategory === "Plastic Bag Ban Inspection Form") bucket.inspections++;
        });
      }
    });

    completedItems.forEach((item) => {
      if (item.compliant === true) compliantCount++;
      else if (item.compliant === false) nonCompliantCount++;

      if (item.subcategory === "Waste Collection Tracking Form") {
        let amt = Number(item.volumeValue || 0);
        if (item.volumeUnit === "tons") amt *= 1000;
        totalWasteKg += amt;

        const bName = resolveBarangay(item);
        if (bName && bName !== "Unclassified") {
          barangayWasteMap[bName] = (barangayWasteMap[bName] || 0) + amt;
        }
      } else if (item.subcategory === "Plastic Bag Ban Inspection Form") {
        let bType = item.businessType || "Commercial Establishment";
        if (bType.toLowerCase() === "establishment") bType = "Commercial Establishment";

        if (businessMap[bType]) {
          if (item.compliant) businessMap[bType].compliant++;
          else businessMap[bType].nonCompliant++;
        } else {
          businessMap["Commercial Establishment"][item.compliant ? "compliant" : "nonCompliant"]++;
        }

        if (item.compliant === false) {
          enforcementActionsCount++;
          if (item.actionToken === "Verbal Warning") enforcementTypes["Verbal Warning"]++;
          else if (item.actionToken?.includes("Written")) enforcementTypes["Written Notice"]++;
          else if (item.actionToken?.includes("Citation")) enforcementTypes["Citation"]++;
        }
      }
    });

    const complianceRate = (compliantCount + nonCompliantCount) > 0
      ? Math.round((compliantCount / (compliantCount + nonCompliantCount)) * 100)
      : 0;

    const gaugeData = [
      { name: "Submitted", value: statusCounts["Submitted"], color: "#3d8eff" },
      { name: "Open Assignment", value: statusCounts["Open Assignment"], color: "#fa6e39" },
      { name: "Pending Verification", value: statusCounts["Pending Verification"], color: "#00a35c" },
      { name: "Pending Completion", value: statusCounts["Pending Completion"], color: "#7b3ff2" },
      { name: "Completed", value: statusCounts["Completed"], color: "#00ed64" }
    ];

    const businessMatrixData = Object.entries(businessMap).map(([name, data]) => ({
      name: name.replace(" Store", "").replace(" Vendor", "").replace("Commercial ", ""),
      fullName: name,
      Compliant: data.compliant,
      "Non-Compliant": data.nonCompliant
    }));

    const barangayData = Object.entries(barangayWasteMap).map(([name, kg]) => ({
      name,
      kg: Number(kg.toFixed(2))
    })).sort((a, b) => b.kg - a.kg);

    const recentLogs = [...filteredItems]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 5);

    return {
      totalAudits: filteredItems.length,
      complianceRate,
      totalWasteKg: Number(totalWasteKg.toFixed(2)),
      wasteRunsCount,
      enforcementActionsCount,
      gaugeData,
      businessMatrixData,
      temporalBuckets,
      barangayData,
      enforcementTypes,
      recentOperationalIssues: recentOperationalIssues.slice(0, 3),
      recentLogs
    };
  }, [items, timeRange]);

  return (
    <div className="flex flex-col gap-6">
      {/* Tier 1: KPIs */}
      <div className="dash-kpi-grid">
        <KpiCard variant="field" icon="receipt_long" value={analytics.totalAudits} label="Total Audits & Logs" sub="Submitted this period" />
        <KpiCard variant="comply" icon="verified_user" value={`${analytics.complianceRate}%`} label="Compliance Rate" sub="Overall adherence percentage" />
        <KpiCard variant="water" icon="delete" value={`${analytics.totalWasteKg} kg`} label="Total Waste Tracked" sub={`Across ${analytics.wasteRunsCount} collection runs`} />
        <KpiCard variant="threat" icon="gavel" value={analytics.enforcementActionsCount} label="Enforcement Actions" sub="Total violations issued" />
      </div>

      {/* Tier 2: Recent Activity & Status Gauge */}
      <div className="dash-row-70-30">
        <ChartCard icon="history" title="Recent Activity" subtitle="Live compliance feed" variant="transparent" noPadding accentColor="#3d8eff">
          <RecentLogsList items={analytics.recentLogs} type="compliance" emptyMessage="No compliance logs yet" />
        </ChartCard>

        <ChartCard icon="donut_large" title="Status Distribution Matrix" subtitle="Breakdown of tracking and inspection items" variant="dark" accentColor="#3d8eff">
          <StatusGauge data={analytics.gaugeData} total={analytics.totalAudits} label="Logs" />
        </ChartCard>
      </div>

      {/* Tier 3: Business Matrix */}
      <div className="dash-full-width-row">
        <ChartCard icon="storefront" title="Business Type Compliance Audit Matrix" subtitle="Inspections performance across retail categories" variant="dark" accentColor="#00ed64">
          <div className="dash-chart-scroll-wrap">
            <div className="dash-chart-canvas-min">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.businessMatrixData} margin={{ top: 10, right: 15, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--c-stone)" fontSize={11} angle={-15} textAnchor="end" interval={0} />
                  <YAxis stroke="var(--c-stone)" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="Compliant" stackId="a" fill="#00ed64" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Non-Compliant" stackId="a" fill="#fa6e39" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="dash-chart-legend">
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#00ed64" }} />
              <span className="dash-chart-legend__label">Compliant</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#fa6e39" }} />
              <span className="dash-chart-legend__label">Non-Compliant</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Tier 4: Temporal Activity */}
      <div className="dash-full-width-row">
        <ChartCard
          icon="insights"
          title="Temporal Compliance & Logistics Activity"
          subtitle="Comparison of Waste Tracking vs Plastic Ban Inspections over time"
          variant="transparent"
          extraHeader={
            <div className="time-tabs">
              {TIME_RANGES.map((range) => (
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
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={analytics.temporalBuckets} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="wasteGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3d8eff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3d8eff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="inspGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ed64" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00ed64" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="label" stroke="var(--c-stone)" fontSize={11} />
                  <YAxis stroke="var(--c-stone)" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => Math.round(value)} />
                  <Area type="monotone" dataKey="wasteLogs" name="Waste Tracking Logs" stroke="#3d8eff" strokeWidth={3} fill="url(#wasteGlow)" />
                  <Area type="monotone" dataKey="inspections" name="Inspections Conducted" stroke="#00ed64" strokeWidth={2} fill="url(#inspGlow)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="dash-chart-legend">
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#3d8eff" }} />
              <span className="dash-chart-legend__label">Waste Tracking Logs</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#00ed64" }} />
              <span className="dash-chart-legend__label">Inspections Conducted</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Tier 5: Barangay Waste Logistics (70) + Enforcement Panel (30) */}
      <div className="dash-row-70-30">
        <ChartCard icon="local_shipping" title="Barangay Waste Logistics" subtitle="Aggregate volume collected per route" variant="warm" accentColor="#fa6e39">
          <div className="dash-chart-scroll-wrap">
            <div className="dash-chart-canvas-min">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.barangayData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" horizontal={false} vertical={true} />
                  <XAxis type="number" stroke="var(--c-stone)" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--c-stone)" fontSize={11} width={80} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="kg" name="Volume (kg)" fill="#fa6e39" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="dash-chart-legend">
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#fa6e39" }} />
              <span className="dash-chart-legend__label">Volume (kg)</span>
            </div>
          </div>
        </ChartCard>

        <ChartCard icon="gavel" title="Enforcement Actions Panel" subtitle="Current non-compliance warnings and citations" variant="dark" accentColor="#7b3ff2">
          <div className="flex flex-col gap-4 p-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <div className="text-xl font-bold text-[#ff5722]">{analytics.enforcementTypes["Verbal Warning"] || 0}</div>
                <div className="text-[11px] text-gray-400 mt-1">Verbal Warnings</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <div className="text-xl font-bold text-[#fa6e39]">{analytics.enforcementTypes["Written Notice"] || 0}</div>
                <div className="text-[11px] text-gray-400 mt-1">Written Notices</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <div className="text-xl font-bold text-[#7b3ff2]">{analytics.enforcementTypes["Citation"] || 0}</div>
                <div className="text-[11px] text-gray-400 mt-1">Citations</div>
              </div>
            </div>

            <div className="mt-2">
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--c-on-dark)" }}>Recent Operational Issues</span>
              {analytics.recentOperationalIssues.length === 0 ? (
                <div className="text-xs text-gray-400 italic text-center py-3">No operational bottlenecks logged.</div>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  {analytics.recentOperationalIssues.map(issue => (
                    <div key={issue.id} className="p-2.5 rounded bg-[#001e2b]/50 border-l-2 border-[#ff5722]">
                      <span className="text-xs font-semibold text-white">{issue.category || "Issue"}</span>
                      <p className="text-xs text-gray-300 mt-0.5 truncate">{issue.description || "Operational bottleneck"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
