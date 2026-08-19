const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "Unknown date";
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  if (isNaN(date.getTime())) return "Unknown date";
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const getStatusDotColor = (status) => {
  const norm = status?.toLowerCase() || "";
  if (norm === "submitted" || norm === "under review" || norm === "") return "var(--c-accent-blue)";
  if (norm === "assigned" || norm === "unresolved") return "var(--c-accent-orange)";
  if (norm === "resolved") return "var(--c-teal)";
  if (norm === "verified" || norm === "pending completion") return "var(--c-accent-purple)";
  if (norm === "completed") return "var(--c-green)";
  if (norm === "denied") return "#ff5722";
  return "var(--c-accent-blue)";
};

export default function RecentLogsList({ items = [], type, emptyMessage }) {
  const displayItems = (items || []).slice(0, 5);
  const emptySlotsCount = Math.max(0, 5 - displayItems.length);

  return (
    <div className="recent-list">
      {displayItems.map((item, idx) => (
        <div key={item.id || `item-${idx}`} className="recent-item">
          <span
            className="recent-item__status-dot"
            style={{ backgroundColor: getStatusDotColor(item.status) }}
          />
          <div className="recent-item__content">
            <div className="recent-item__header">
              <span className="recent-item__category">
                {type === "incident" ? item.category : (type === "bms" ? (item.subcategory || "Biodiversity Monitoring") : type === "water" ? (item.subcategory || "Water Monitoring") : (item.subcategory || "General Monitoring"))}
              </span>
              <span className="recent-item__time">
                {formatRelativeTime(item.createdAt)}
              </span>
            </div>
            <p className="recent-item__snippet">
              {type === "incident" 
                ? (item.description || "No description provided.") 
                : type === "bms"
                  ? `${item.avianSpecies || item.speciesName || "Fauna observation"} (${item.count || item.quantity || 1} sighted) • ${item.stationId || item.barangay || "Field Station"}`
                  : type === "water"
                    ? `${item.sourceType || "Water Source"} at ${item.barangay || "Field Station"} • ${item.waterClarity || item.flowRate || "Status logged"}`
                    : `Reported by Ranger (Barangay: ${item.barangay || "N/A"})`}
            </p>
          </div>
        </div>
      ))}

      {Array.from({ length: emptySlotsCount }).map((_, slotIdx) => (
        <div
          key={`empty-slot-${slotIdx}`}
          className="recent-item recent-item--empty"
        >
          <span className="recent-item__status-dot recent-item__status-dot--empty" />
          <div className="recent-item__content">
            <div className="recent-item__header">
              <span className="recent-item__category recent-item__category--empty">
                {displayItems.length === 0 && slotIdx === 0
                  ? (emptyMessage || "No logs reported yet")
                  : "Empty slot"}
              </span>
              <span className="recent-item__time recent-item__time--empty">—</span>
            </div>
            <p className="recent-item__snippet recent-item__snippet--empty">
              {displayItems.length === 0 && slotIdx === 0
                ? "Awaiting new field submissions..."
                : "No log recorded for this position"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
