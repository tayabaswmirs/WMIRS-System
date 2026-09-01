import { useState, useMemo } from "react";
import ChartCard from "../ChartCard";

export default function SpeciesBreakdownCard({ items = [] }) {
  const [activeTab, setActiveTab] = useState("avian");

  const { rankedList, totalCount } = useMemo(() => {
    const map = {};
    let total = 0;

    items.forEach((item) => {
      const isTarget = activeTab === "avian"
        ? (item.subcategory === "Avian Tracking Form" || item.classification === "Avian")
        : (item.subcategory === "Wildlife Observations Form" && item.classification !== "Avian");

      if (!isTarget) return;

      const name = (activeTab === "avian"
        ? item.avianSpecies || item.speciesName
        : item.species || item.speciesName || item.commonName || item.animalName || "Unspecified Wildlife")?.trim();

      if (!name) return;
      const count = Number(item.count || item.quantity || 1);
      total += count;
      map[name] = (map[name] || 0) + count;
    });

    const entries = Object.entries(map);
    const max = entries.length > 0 ? Math.max(...entries.map(([, c]) => c)) : 1;

    const list = entries
      .map(([species, count]) => ({
        species,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0,
        barWidth: `${Math.max(Math.round((count / max) * 100), 4)}%`
      }))
      .sort((a, b) => b.count - a.count);

    return { rankedList: list, totalCount: total, maxCount: max };
  }, [items, activeTab]);

  const barColor = activeTab === "avian" ? "#00ed64" : "#3d8eff";

  return (
    <ChartCard
      icon={activeTab === "avian" ? "flutter_dash" : "pets"}
      title="Species Census Breakdown"
      subtitle={`Tracked breakdown across ${rankedList.length} distinct species (${totalCount} total organisms)`}
      variant="transparent"
      accentColor={barColor}
      extraHeader={
        <div className="time-tabs">
          <button
            className={`time-tab ${activeTab === "avian" ? "time-tab--active" : ""}`}
            onClick={() => setActiveTab("avian")}
            type="button"
          >
            Birds (Avian)
          </button>
          <button
            className={`time-tab ${activeTab === "wildlife" ? "time-tab--active" : ""}`}
            onClick={() => setActiveTab("wildlife")}
            type="button"
          >
            Wildlife (Animals)
          </button>
        </div>
      }
    >
      {rankedList.length === 0 ? (
        <div className="dash-empty-state" style={{ padding: "40px 16px", textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "36px", opacity: 0.4, color: "var(--c-stone)" }}>
            nature_people
          </span>
          <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--c-stone)" }}>
            No {activeTab === "avian" ? "avian" : "wildlife"} species records logged yet.
          </p>
        </div>
      ) : (
        <div
          style={{
            maxHeight: "340px",
            overflowY: "auto",
            paddingRight: "6px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          {rankedList.map((item, idx) => (
            <div
              key={item.species}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(0, 30, 43, 0.03)",
                border: "1px solid rgba(0, 30, 43, 0.08)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "800",
                      color: idx < 3 ? barColor : "var(--c-stone, #6b7280)",
                      minWidth: "24px"
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "var(--c-ink, #001e2b)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                    title={item.species}
                  >
                    {item.species}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--c-ink, #001e2b)" }}>
                    {item.count} <span style={{ fontSize: "11px", fontWeight: "500", color: "var(--c-stone, #6b7280)" }}>seen</span>
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "rgba(0, 30, 43, 0.06)",
                      color: "var(--c-ink, #001e2b)"
                    }}
                  >
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Proportional Distribution Bar */}
              <div
                style={{
                  height: "6px",
                  borderRadius: "3px",
                  background: "rgba(0, 30, 43, 0.08)",
                  overflow: "hidden",
                  width: "100%"
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: item.barWidth,
                    borderRadius: "3px",
                    backgroundColor: barColor,
                    transition: "width 0.4s ease-out"
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
