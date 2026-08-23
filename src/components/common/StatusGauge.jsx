import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#001e2b",
  border: "1px solid #1c2d38",
  borderRadius: "var(--card-radius, 12px)",
  boxShadow: "var(--card-shadow, rgba(0, 30, 43, 0.08) 0px 4px 12px 0px)",
  fontSize: "12px",
  color: "#ffffff"
};

export default function StatusGauge({ data = [], total = 0, label }) {
  const activeData = useMemo(() => data.filter((d) => d.value > 0), [data]);

  return (
    <div className="gauge-card-container">
      <div className="gauge-chart-wrapper">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            {/* Background track rail */}
            <Pie
              data={[{ value: 1 }]}
              cx="50%"
              cy="95%"
              innerRadius={72}
              outerRadius={112}
              startAngle={180}
              endAngle={0}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
              fill="rgba(255, 255, 255, 0.06)"
            />
            {/* Active colored segments */}
            {activeData.length > 0 && (
              <Pie
                data={activeData}
                cx="50%"
                cy="95%"
                innerRadius={72}
                outerRadius={112}
                startAngle={180}
                endAngle={0}
                dataKey="value"
                paddingAngle={activeData.length > 1 ? 3 : 0}
                stroke="none"
              >
                {activeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            )}
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "#ffffff" }}
              formatter={(val, name) => [
                `${val} (${total > 0 ? Math.round((val / total) * 100) : 0}%)`,
                name
              ]}
              labelFormatter={() => label}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="gauge-center-label">
          <span className="gauge-center-value">{total}</span>
          <span className="gauge-center-text">Total</span>
        </div>
      </div>

      <div className="gauge-status-box">
        {/* Complete Status Breakdown Stack */}
        <div className="gauge-status-list">
          {data.map((item, idx) => {
            const val = item.value || 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            const isZero = val === 0;

            return (
              <div
                key={item.name || idx}
                className={`gauge-status-row ${isZero ? "gauge-status-row--zero" : ""}`}
              >
                <div className="gauge-status-left">
                  <span
                    className="gauge-status-dot"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: isZero ? "none" : `0 0 8px ${item.color}80`,
                      opacity: isZero ? 0.35 : 1
                    }}
                  />
                  <span
                    className="gauge-status-name"
                    style={{ opacity: isZero ? 0.65 : 1 }}
                  >
                    {item.name}
                  </span>
                </div>
                <div className="gauge-status-right">
                  <span
                    className="gauge-status-count"
                    style={{ opacity: isZero ? 0.5 : 1 }}
                  >
                    {val}
                  </span>
                  <span
                    className="gauge-status-pct"
                    style={{ opacity: isZero ? 0.45 : 1 }}
                  >
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Distribution mini-bar */}
        <div className="gauge-dist-bar">
          {total > 0 && activeData.length > 0 ? (
            activeData.map((item, idx) => {
              const pct = (item.value / total) * 100;
              return (
                <div
                  key={idx}
                  className="gauge-dist-segment"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: item.color
                  }}
                  title={`${item.name}: ${item.value} (${Math.round(pct)}%)`}
                />
              );
            })
          ) : (
            <div
              className="gauge-dist-segment"
              style={{
                width: "100%",
                backgroundColor: "rgba(255, 255, 255, 0.08)"
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
