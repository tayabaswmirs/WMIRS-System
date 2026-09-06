/**
 * PendingQueueHeader — Search input and segmented category pill tabs for the pending queue.
 *
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab ("all", "incident", "monitoring")
 * @param {function(string): void} props.onTabChange - Callback on tab switch
 * @param {{ all: number, incident: number, monitoring: number }} props.counts - Counts per domain
 * @param {string} props.searchQuery - Current search query text
 * @param {function(string): void} props.onSearchChange - Callback on search text change
 */
export default function PendingQueueHeader({
  activeTab,
  onTabChange,
  counts,
  searchQuery,
  onSearchChange
}) {
  const tabs = [
    { id: "all", label: "All Pending", count: counts.all },
    { id: "incident", label: "Incidents", count: counts.incident, dotColor: "#fa6e39" },
    { id: "monitoring", label: "Monitoring", count: counts.monitoring, dotColor: "#00ed64" }
  ];

  return (
    <div className="pending-queue-header-controls" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "12px",
      width: "100%"
    }}>
      {/* Segmented Pill Tabs */}
      <div className="time-tabs" role="tablist" style={{ margin: 0 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`time-tab ${activeTab === tab.id ? "time-tab--active" : ""}`}
            onClick={() => onTabChange(tab.id)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            {tab.dotColor && (
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: tab.dotColor,
                  display: "inline-block"
                }}
              />
            )}
            <span>{tab.label}</span>
            <span style={{
              fontSize: "11px",
              padding: "1px 6px",
              borderRadius: "10px",
              backgroundColor: activeTab === tab.id ? "rgba(0, 237, 100, 0.25)" : "var(--c-surface-soft, rgba(0,0,0,0.06))",
              fontWeight: 700
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Real-time Search Box */}
      <div className="wmirs-search-wrap" style={{ maxWidth: "280px", minWidth: "200px" }}>
        <span className="material-symbols-outlined wmirs-search-icon">search</span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter pending logs..."
          className="wmirs-search-input"
          aria-label="Filter pending logs"
        />
        {searchQuery && (
          <button
            type="button"
            className="wmirs-search-clear-btn"
            onClick={() => onSearchChange("")}
            aria-label="Clear search text"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
          </button>
        )}
      </div>
    </div>
  );
}
