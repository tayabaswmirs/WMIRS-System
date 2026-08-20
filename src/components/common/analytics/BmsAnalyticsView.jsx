import { useState, useMemo } from "react";
import KpiCard from "../KpiCard";
import ChartCard from "../ChartCard";
import StatusGauge from "../StatusGauge";
import RecentLogsList from "../RecentLogsList";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, CartesianGrid, Legend, ComposedChart, Line
} from "recharts";

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

export default function BmsAnalyticsView({ items = [] }) {
  const [timeRange, setTimeRange] = useState("1M");

  const analytics = useMemo(() => {
    const filteredItems = items.filter(item => item.status?.toLowerCase() !== "denied");
    let avianCount = 0;
    let wildlifeCount = 0;
    let totalOrganisms = 0;

    const bmsGaugeCounts = { "Submitted": 0, "Open Assignment": 0, "Pending Verification": 0, "Pending Completion": 0, "Completed": 0 };
    const taxonomicMap = {
      "Avian": { organisms: 0, logs: 0 },
      "Mammal": { organisms: 0, logs: 0 },
      "Reptile": { organisms: 0, logs: 0 },
      "Amphibian": { organisms: 0, logs: 0 },
      "Insect": { organisms: 0, logs: 0 },
      "Other": { organisms: 0, logs: 0 }
    };
    const avianBehaviors = { "Nesting": 0, "Foraging": 0, "Flying": 0, "Perching": 0 };

    filteredItems.forEach((item) => {
      const isAvian = item.subcategory === "Avian Tracking Form";
      const isWildlife = item.subcategory === "Wildlife Observations Form";
      if (isAvian) avianCount++;
      if (isWildlife) wildlifeCount++;

      const grp = getStatusGroup(item.status);
      if (bmsGaugeCounts[grp] !== undefined) bmsGaugeCounts[grp]++;

      const count = Number(item.count || item.quantity || 0);
      totalOrganisms += count;

      let taxClass = "Other";
      if (isAvian || item.classification === "Avian") taxClass = "Avian";
      else if (item.classification && taxonomicMap[item.classification]) taxClass = item.classification;

      taxonomicMap[taxClass].logs++;
      taxonomicMap[taxClass].organisms += count;

      if (isAvian && Array.isArray(item.activities)) {
        item.activities.forEach((act) => {
          if (avianBehaviors[act] !== undefined) avianBehaviors[act]++;
        });
      }
    });

    const taxonomicData = Object.keys(taxonomicMap).map(key => ({
      name: key,
      Organisms: taxonomicMap[key].organisms,
      Logs: taxonomicMap[key].logs
    }));
    const maxTaxonomic = Math.max(...taxonomicData.map(d => Math.max(d.Organisms, d.Logs)), 5);

    const behaviorData = Object.keys(avianBehaviors).map(key => ({
      name: key,
      Count: avianBehaviors[key]
    }));

    // Temporal logging buckets
    const now = new Date();
    const numBuckets = timeRange === "1D" ? 24 : timeRange === "1W" ? 7 : 30;
    const timeLimitMs = (timeRange === "1D" ? 24 : timeRange === "1W" ? 7 : 30) * (timeRange === "1D" ? 3600000 : 86400000);
    const startTimestamp = now.getTime() - timeLimitMs;
    const bmsLogBuckets = [];
    const half = Math.floor(numBuckets / 2);

    for (let i = half; i > half - numBuckets; i--) {
      const d = new Date(now.getTime() - i * (timeRange === "1D" ? 3600000 : 86400000));
      const label = timeRange === "1D"
        ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "numeric", hour12: true })
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      bmsLogBuckets.push({ label, timestamp: d.getTime(), "Avian Census": 0, "Wildlife Sightings": 0 });
    }

    filteredItems.forEach((item) => {
      const ts = item.createdAt?.seconds ? item.createdAt.seconds * 1000 : null;
      if (!ts || ts < startTimestamp) return;

      let seriesName = null;
      if (item.subcategory === "Avian Tracking Form") seriesName = "Avian Census";
      else if (item.subcategory === "Wildlife Observations Form") seriesName = "Wildlife Sightings";
      if (!seriesName) return;

      let bestIdx = 0, minDiff = Infinity;
      bmsLogBuckets.forEach((bucket, idx) => {
        const diff = Math.abs(bucket.timestamp - ts);
        if (diff < minDiff) { minDiff = diff; bestIdx = idx; }
      });
      bmsLogBuckets[bestIdx][seriesName]++;
    });

    const recentBMS = [...filteredItems]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 5);

    const bmsGaugeData = [
      { name: "Submitted", value: bmsGaugeCounts["Submitted"], color: "#3d8eff" },
      { name: "Open Assignment", value: bmsGaugeCounts["Open Assignment"], color: "#fa6e39" },
      { name: "Pending Verification", value: bmsGaugeCounts["Pending Verification"], color: "#00a35c" },
      { name: "Pending Completion", value: bmsGaugeCounts["Pending Completion"], color: "#7b3ff2" },
      { name: "Completed", value: bmsGaugeCounts["Completed"], color: "#00ed64" }
    ];

    return {
      total: filteredItems.length,
      avianCount,
      wildlifeCount,
      totalOrganisms,
      bmsGaugeData,
      taxonomicData,
      maxTaxonomic,
      behaviorData,
      bmsLogBuckets,
      recentBMS
    };
  }, [items, timeRange]);

  return (
    <div className="flex flex-col gap-6">
      {/* Tier 1: KPIs */}
      <div className="dash-kpi-grid dash-kpi-grid--four">
        <KpiCard variant="comply" icon="forest" value={analytics.total} label="Total Submissions" sub="Total biodiversity logs" />
        <KpiCard variant="field" icon="flutter" value={analytics.avianCount} label="Avian Census Logs" sub="Bird tracking surveys" />
        <KpiCard variant="water" icon="cruelty_free" value={analytics.wildlifeCount} label="Wildlife Sightings" sub="Fauna observations" />
        <KpiCard variant="threat" icon="pets" value={analytics.totalOrganisms} label="Organisms Observed" sub="Total individual fauna tallied" />
      </div>

      {/* Tier 2: Recent Feed & Gauge */}
      <div className="dash-row-70-30">
        <ChartCard icon="list_alt" title="Recent Field Observations" subtitle="Latest biodiversity logs submitted" accentColor="#3d8eff">
          <RecentLogsList items={analytics.recentBMS} type="bms" emptyMessage="No biodiversity logs reported yet" />
        </ChartCard>

        <ChartCard icon="query_stats" title="Monitoring Status" subtitle="Breakdown of BMS logs" variant="dark">
          <StatusGauge data={analytics.bmsGaugeData} total={analytics.total} label="Logs" />
        </ChartCard>
      </div>

      {/* Tier 3: Taxonomic Breakdown */}
      <div className="dash-full-width-row">
        <ChartCard icon="bar_chart" title="Taxonomic Classification Breakdown" subtitle="Organism abundance and log frequency per class" variant="mint" accentColor="#00ed64">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.taxonomicData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.15)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--c-stone)" fontSize={11} />
              <YAxis stroke="var(--c-stone)" fontSize={11} allowDecimals={false} domain={[0, analytics.maxTaxonomic + 2]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} iconType="circle" iconSize={8} />
              <Bar dataKey="Organisms" name="Organisms Sighted" fill="#00ed64" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Logs" name="Observation Logs" fill="#3d8eff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tier 4: Temporal Sighting Trends */}
      <div className="dash-full-width-row">
        <ChartCard
          icon="trending_up"
          title="Temporal Sighting Trends"
          subtitle="Avian vs. Wildlife logging frequency over time"
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
            <ComposedChart data={analytics.bmsLogBuckets} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="avianGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00a35c" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#00a35c" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="wildlifeGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7b3ff2" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#7b3ff2" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.15)" />
              <XAxis dataKey="label" stroke="rgba(0,0,0,0.5)" fontSize={11} />
              <YAxis stroke="rgba(0,0,0,0.5)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="Avian Census" stroke="none" fill="url(#avianGlow)" legendType="none" />
              <Area type="monotone" dataKey="Wildlife Sightings" stroke="none" fill="url(#wildlifeGlow)" legendType="none" />
              <Line type="monotone" dataKey="Avian Census" name="Avian Census" stroke="#00a35c" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Wildlife Sightings" name="Wildlife Sightings" stroke="#7b3ff2" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tier 5: Avian Behavior Distribution */}
      <div className="dash-full-width-row">
        <ChartCard icon="flight" title="Avian Behavioral Activity" subtitle="Observed behavioral states during census runs" variant="warm" accentColor="#fa6e39">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.behaviorData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--c-stone)" fontSize={11} />
              <YAxis stroke="var(--c-stone)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="Count" fill="#fa6e39" radius={[4, 4, 0, 0]} name="Observations" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
