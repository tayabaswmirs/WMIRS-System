import { useState, useMemo } from "react";
import KpiCard from "../KpiCard";
import ChartCard from "../ChartCard";
import StatusGauge from "../StatusGauge";
import RecentLogsList from "../RecentLogsList";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, CartesianGrid, ComposedChart, Line
} from "recharts";
import { TIME_RANGES, createTemporalBuckets, incrementTemporalBucket, extractTimestampMs } from "../../../utils/temporalBuckets";

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

export default function WaterAnalyticsView({ items = [] }) {
  const [timeRange, setTimeRange] = useState("1M");
  const [selectedWaterBody, setSelectedWaterBody] = useState("All");

  const analytics = useMemo(() => {
    const rawFiltered = items.filter(item => item.status?.toLowerCase() !== "denied");
    const uniqueWaterBodies = new Set();
    rawFiltered.forEach(item => {
      if (item.waterBody) uniqueWaterBodies.add(item.waterBody);
    });
    const waterBodiesList = Array.from(uniqueWaterBodies).sort();

    const filteredItems = selectedWaterBody === "All"
      ? rawFiltered
      : rawFiltered.filter(item => item.waterBody === selectedWaterBody);

    const completedFilteredItems = filteredItems.filter(item => item.status?.toLowerCase() === "completed");

    let surveysCount = 0;
    let conservationCount = 0;
    let threatsAlerts = 0;
    const waterGaugeCounts = { "Submitted": 0, "Open Assignment": 0, "Pending Verification": 0, "Pending Completion": 0, "Completed": 0 };

    const clarityFlowDataMap = {};
    const pollutionRiskMap = {};
    let totalKits = 0;
    let sumPH = 0;
    let sumTemp = 0;
    let sumDO = 0;

    filteredItems.forEach((item) => {
      const isSurvey = item.subcategory === "Local Water Source Monitoring Form";
      const isConservation = item.subcategory === "Ecosystem Conservation Log";
      if (isSurvey) surveysCount++;
      if (isConservation) conservationCount++;

      const isSevereThreat = item.threatSeverity === "High" || item.threatSeverity === "Critical";
      const hasPollution = item.pollutionIndicators && item.pollutionIndicators.length > 0;
      if (isSevereThreat || hasPollution) threatsAlerts++;

      const grp = getStatusGroup(item.status);
      if (waterGaugeCounts[grp] !== undefined) waterGaugeCounts[grp]++;
    });

    completedFilteredItems.forEach((item) => {
      const isSurvey = item.subcategory === "Local Water Source Monitoring Form";
      if (isSurvey) {
        const flow = item.flowLevel || "Unknown Flow";
        const clarity = item.waterClarity || "Unknown Clarity";
        if (!clarityFlowDataMap[flow]) {
          clarityFlowDataMap[flow] = { flowRate: flow, "Clear": 0, "Slightly Turbid": 0, "Highly Turbid": 0, "Stagnant / Algal Bloom": 0, "Unknown Clarity": 0 };
        }
        if (clarityFlowDataMap[flow][clarity] !== undefined) clarityFlowDataMap[flow][clarity]++;
        else clarityFlowDataMap[flow][clarity] = 1;
      }

      if (item.pollutionIndicators && Array.isArray(item.pollutionIndicators)) {
        item.pollutionIndicators.forEach(ind => {
          pollutionRiskMap[ind] = (pollutionRiskMap[ind] || 0) + 1;
        });
      }

      if (item.phLevel || item.temperature || item.dissolvedOxygen) {
        totalKits++;
        if (item.phLevel) sumPH += Number(item.phLevel);
        if (item.temperature) sumTemp += Number(item.temperature);
        if (item.dissolvedOxygen) sumDO += Number(item.dissolvedOxygen);
      }
    });

    const clarityFlowData = Object.values(clarityFlowDataMap);
    const pollutionRiskData = Object.keys(pollutionRiskMap).map(key => ({
      name: key,
      Frequency: pollutionRiskMap[key]
    })).sort((a, b) => b.Frequency - a.Frequency);

    const avgPH = totalKits > 0 ? (sumPH / totalKits).toFixed(1) : "N/A";
    const avgTemp = totalKits > 0 ? (sumTemp / totalKits).toFixed(1) : "N/A";
    const avgDO = totalKits > 0 ? (sumDO / totalKits).toFixed(1) : "N/A";

    // Temporal logging trends
    const waterLogBuckets = createTemporalBuckets(timeRange, filteredItems, {
      "Water Source Surveys": 0,
      "Conservation Logs": 0
    });

    const fieldKitTrendBuckets = createTemporalBuckets(timeRange, completedFilteredItems, {
      sumPH: 0, countPH: 0,
      sumTemp: 0, countTemp: 0,
      sumDO: 0, countDO: 0
    });

    filteredItems.forEach((item) => {
      const ts = extractTimestampMs(item.createdAt || item.dateTime);
      if (!ts) return;
      const seriesName = item.subcategory === "Ecosystem Conservation Log" ? "Conservation Logs" : "Water Source Surveys";

      incrementTemporalBucket(waterLogBuckets, timeRange, ts, (bucket) => {
        bucket[seriesName] = (bucket[seriesName] || 0) + 1;
      });
    });

    completedFilteredItems.forEach((item) => {
      const ts = extractTimestampMs(item.createdAt || item.dateTime);
      if (!ts) return;

      incrementTemporalBucket(fieldKitTrendBuckets, timeRange, ts, (bucket) => {
        if (item.phLevel) {
          bucket.sumPH += Number(item.phLevel);
          bucket.countPH++;
        }
        if (item.temperature) {
          bucket.sumTemp += Number(item.temperature);
          bucket.countTemp++;
        }
        if (item.dissolvedOxygen) {
          bucket.sumDO += Number(item.dissolvedOxygen);
          bucket.countDO++;
        }
      });
    });

    const fieldKitTrends = fieldKitTrendBuckets.map(b => ({
      label: b.label,
      "pH Level": b.countPH > 0 ? Number((b.sumPH / b.countPH).toFixed(1)) : 0,
      "Temperature (°C)": b.countTemp > 0 ? Number((b.sumTemp / b.countTemp).toFixed(1)) : 0,
      "Dissolved Oxygen (mg/L)": b.countDO > 0 ? Number((b.sumDO / b.countDO).toFixed(1)) : 0
    }));

    const recentWater = [...filteredItems]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 5);

    const waterGaugeData = [
      { name: "Submitted", value: waterGaugeCounts["Submitted"], color: "#3d8eff" },
      { name: "Open Assignment", value: waterGaugeCounts["Open Assignment"], color: "#fa6e39" },
      { name: "Pending Verification", value: waterGaugeCounts["Pending Verification"], color: "#00a35c" },
      { name: "Pending Completion", value: waterGaugeCounts["Pending Completion"], color: "#7b3ff2" },
      { name: "Completed", value: waterGaugeCounts["Completed"], color: "#00ed64" }
    ];

    return {
      total: filteredItems.length,
      surveysCount,
      conservationCount,
      threatsAlerts,
      waterGaugeData,
      recentWater,
      clarityFlowData,
      waterLogBuckets,
      pollutionRiskData,
      avgPH,
      avgTemp,
      avgDO,
      fieldKitTrends,
      waterBodiesList
    };
  }, [items, timeRange, selectedWaterBody]);

  return (
    <div className="flex flex-col gap-6">
      {/* Water Body Filter */}
      {analytics.waterBodiesList.length > 0 && (
        <div className="flex items-center justify-end gap-2">
          <span style={{ fontSize: "12px", color: "var(--c-stone)" }}>Filter Water Body:</span>
          <select
            value={selectedWaterBody}
            onChange={(e) => setSelectedWaterBody(e.target.value)}
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
            <option value="All">All Water Bodies</option>
            {analytics.waterBodiesList.map(wb => (
              <option key={wb} value={wb}>{wb}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tier 1: KPIs */}
      <div className="dash-kpi-grid dash-kpi-grid--four">
        <KpiCard variant="comply" icon="water_drop" value={analytics.total} label="Total Water Logs" sub="Submitted this period" />
        <KpiCard variant="field" icon="explore" value={analytics.surveysCount} label="Water Surveys" sub="Source parameter logs" />
        <KpiCard variant="water" icon="nature" value={analytics.conservationCount} label="Conservation Runs" sub="Ecosystem protection" />
        <KpiCard variant="threat" icon="crisis_alert" value={analytics.threatsAlerts} label="Threat Alerts" sub="High risk or pollutants" />
      </div>

      {/* Tier 2: Recent Observations Feed & Gauge */}
      <div className="dash-row-70-30">
        <ChartCard icon="list_alt" title="Recent Field Observations" subtitle="Latest water monitoring reports" accentColor="#3d8eff">
          <RecentLogsList items={analytics.recentWater} type="water" emptyMessage="No water resource logs reported yet" />
        </ChartCard>

        <ChartCard icon="query_stats" title="Monitoring Status" subtitle="Breakdown of water logs" variant="dark">
          <StatusGauge data={analytics.waterGaugeData} total={analytics.total} label="Logs" />
        </ChartCard>
      </div>

      {/* Tier 3: Clarity vs Flow Rate */}
      <div className="dash-full-width-row">
        <ChartCard icon="stacked_bar_chart" title="Water Clarity vs. Flow Rate Matrix" subtitle="Clarity distribution across river flow conditions" variant="dark" accentColor="#00ed64">
          <div className="dash-chart-scroll-wrap">
            <div className="dash-chart-canvas-min">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.clarityFlowData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="flowRate" stroke="var(--c-stone)" fontSize={11} />
                  <YAxis stroke="var(--c-stone)" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="Clear" stackId="a" fill="#00ed64" />
                  <Bar dataKey="Slightly Turbid" stackId="a" fill="#ffc107" />
                  <Bar dataKey="Highly Turbid" stackId="a" fill="#fa6e39" />
                  <Bar dataKey="Stagnant / Algal Bloom" stackId="a" fill="#7b3ff2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="dash-chart-legend">
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#00ed64" }} />
              <span className="dash-chart-legend__label">Clear</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#ffc107" }} />
              <span className="dash-chart-legend__label">Slightly Turbid</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#fa6e39" }} />
              <span className="dash-chart-legend__label">Highly Turbid</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#7b3ff2" }} />
              <span className="dash-chart-legend__label">Stagnant / Algal Bloom</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Tier 4: Temporal Surveys vs Conservation */}
      <div className="dash-full-width-row">
        <ChartCard
          icon="trending_up"
          title="Temporal Water Logging Trends"
          subtitle="Surveys vs Conservation logs over time"
          variant="blue"
          accentColor="#3d8eff"
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
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={analytics.waterLogBuckets} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="surveyGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3d8eff" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#3d8eff" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="conservGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ed64" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#00ed64" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.15)" />
                  <XAxis dataKey="label" stroke="rgba(0,0,0,0.5)" fontSize={11} />
                  <YAxis stroke="rgba(0,0,0,0.5)" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="Water Source Surveys" stroke="none" fill="url(#surveyGlow)" legendType="none" />
                  <Area type="monotone" dataKey="Conservation Logs" stroke="none" fill="url(#conservGlow)" legendType="none" />
                  <Line type="monotone" dataKey="Water Source Surveys" name="Water Source Surveys" stroke="#3d8eff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Conservation Logs" name="Conservation Logs" stroke="#00ed64" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="dash-chart-legend">
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#3d8eff" }} />
              <span className="dash-chart-legend__label">Water Source Surveys</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#00ed64" }} />
              <span className="dash-chart-legend__label">Conservation Logs</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Tier 5: Pollution Risks + Field-Kit Parameter Trends */}
      <div className="dash-row-70-30">
        <ChartCard icon="insights" title="Field-Kit Metrics (pH / DO / Temp)" subtitle={`Average: pH ${analytics.avgPH} | Temp ${analytics.avgTemp}°C | DO ${analytics.avgDO} mg/L`} variant="warm" accentColor="#fa6e39">
          <div className="dash-chart-scroll-wrap">
            <div className="dash-chart-canvas-min">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={analytics.fieldKitTrends} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.15)" />
                  <XAxis dataKey="label" stroke="rgba(0,0,0,0.5)" fontSize={11} />
                  <YAxis stroke="rgba(0,0,0,0.5)" fontSize={11} allowDecimals={true} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="pH Level" stroke="#00ed64" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Temperature (°C)" stroke="#3d8eff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Dissolved Oxygen (mg/L)" stroke="#fa6e39" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="dash-chart-legend">
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#00ed64" }} />
              <span className="dash-chart-legend__label">pH Level</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#3d8eff" }} />
              <span className="dash-chart-legend__label">Temperature (°C)</span>
            </div>
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#fa6e39" }} />
              <span className="dash-chart-legend__label">Dissolved Oxygen</span>
            </div>
          </div>
        </ChartCard>

        <ChartCard icon="warning" title="Pollution Risk Indicators" subtitle="Frequency of observed threats" variant="dark" accentColor="#ff5722">
          <div className="dash-chart-scroll-wrap">
            <div className="dash-chart-canvas-min">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.pollutionRiskData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} vertical={true} />
                  <XAxis type="number" stroke="var(--c-stone)" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--c-stone)" fontSize={10} width={90} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="Frequency" fill="#ff5722" radius={[0, 4, 4, 0]} name="Reports" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="dash-chart-legend">
            <div className="dash-chart-legend__item">
              <span className="dash-chart-legend__dot" style={{ backgroundColor: "#ff5722" }} />
              <span className="dash-chart-legend__label">Reports</span>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
