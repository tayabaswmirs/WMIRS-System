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

export default function StatusGauge({ data, total, label }) {
  const activeData = useMemo(() => data.filter((d) => d.value > 0), [data]);

  return (
    <div className="gauge-card-container">
      {total > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={activeData}
                cx="50%"
                cy="100%"
                innerRadius={65}
                outerRadius={85}
                startAngle={180}
                endAngle={0}
                dataKey="value"
                paddingAngle={2}
              >
                {activeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: "#ffffff" }}
                labelFormatter={() => label}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="gauge-center-label">
            <span className="gauge-center-value">{total}</span>
            <span className="gauge-center-text">Total</span>
          </div>

          <div className="gauge-legend">
            {data.map((item, idx) => (
              <div key={idx} className="gauge-legend-item">
                <span className="gauge-legend-dot" style={{ backgroundColor: item.color }} />
                <span>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="dash-empty">
          <span className="material-symbols-outlined dash-empty__icon">pie_chart</span>
          <span className="dash-empty__text">No log status data yet</span>
        </div>
      )}
    </div>
  );
}
