/**
 * AssignmentFilterToolbar — Unified filter bar for task role and record type.
 *
 * @param {Object} props
 * @param {string} props.roleFilter - "All" | "Leading" | "Assisting"
 * @param {function(string): void} props.onRoleFilterChange
 * @param {string} props.activeType - "All" | "Incident" | "Monitoring"
 * @param {function(string): void} props.onTypeFilterChange
 * @param {{ total: number, incident: number, monitoring: number, leading: number, assisting: number }} props.stats
 * @param {string} props.userRole - Current user role (e.g., "ranger", "staff", "admin")
 */
export default function AssignmentFilterToolbar({
  roleFilter,
  onRoleFilterChange,
  activeType,
  onTypeFilterChange,
  stats,
  userRole
}) {
  const isRanger = userRole === "ranger";

  return (
    <div className="assignment-toolbar">
      <div className="assignment-toolbar__row">
        {/* Ranger Role Tabs (Pill Group) */}
        {isRanger ? (
          <div className="assignment-pill-group" role="tablist" aria-label="Filter assignments by your team role">
            <button
              type="button"
              role="tab"
              aria-selected={roleFilter === "All"}
              className={`assignment-pill-btn ${roleFilter === "All" ? "active" : ""}`}
              onClick={() => onRoleFilterChange("All")}
            >
              All Tasks ({stats.total})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={roleFilter === "Leading"}
              className={`assignment-pill-btn ${roleFilter === "Leading" ? "active" : ""}`}
              onClick={() => onRoleFilterChange("Leading")}
            >
              <span className="material-symbols-outlined pill-icon-leading" aria-hidden="true">stars</span>
              <span>Leading ({stats.leading})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={roleFilter === "Assisting"}
              className={`assignment-pill-btn ${roleFilter === "Assisting" ? "active" : ""}`}
              onClick={() => onRoleFilterChange("Assisting")}
            >
              <span className="material-symbols-outlined pill-icon-assisting" aria-hidden="true">groups</span>
              <span>Assisting ({stats.assisting})</span>
            </button>
          </div>
        ) : (
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#1c2d38" }}>
            Field Task Filter
          </div>
        )}

        {/* Record Type Selector (Incident vs Monitoring) */}
        <div className="assignment-type-group" role="tablist" aria-label="Filter by record category">
          <button
            type="button"
            role="tab"
            aria-selected={activeType === "All"}
            className={`assignment-type-tab ${activeType === "All" ? "active" : ""}`}
            onClick={() => onTypeFilterChange("All")}
          >
            All Types
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeType === "Incident"}
            className={`assignment-type-tab ${activeType === "Incident" ? "active" : ""}`}
            onClick={() => onTypeFilterChange("Incident")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#fa6e39" }} aria-hidden="true">
              warning
            </span>
            <span>Incidents ({stats.incident})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeType === "Monitoring"}
            className={`assignment-type-tab ${activeType === "Monitoring" ? "active" : ""}`}
            onClick={() => onTypeFilterChange("Monitoring")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#0284c7" }} aria-hidden="true">
              visibility
            </span>
            <span>Monitoring ({stats.monitoring})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
