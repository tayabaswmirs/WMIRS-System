import SearchFilterBar from "../SearchFilterBar";
import AdminIncidentTable from "../AdminIncidentTable";
import MonitoringTable from "../monitoring/MonitoringTable";

/**
 * StaffWorkspaceContent — Container card hosting SearchFilterBar, empty states, and table rendering.
 */
export default function StaffWorkspaceContent({
  config,
  stageId,
  isIncidents,
  loading,
  filterHook,
  onStatusChange,
  onViewDetails
}) {
  const { filteredItems, activeFilterCount, resetFilters } = filterHook;

  return (
    <div className="inc-history-card card-base">
      <div className="inc-history-card__head">
        <h2 className="inc-history-card__title">
          {config.title} Queue
        </h2>
      </div>

      {/* Comprehensive Search & Multi-Toggle Filter Bar */}
      <SearchFilterBar
        filterHook={filterHook}
        placeholder={
          isIncidents
            ? "Search incident type, category, location, reporter..."
            : "Search subcategory, reporter, species, location..."
        }
        mode={isIncidents ? "incident" : "monitoring"}
        isAdmin={false}
      />

      {loading ? (
        <p className="loading-text" style={{ padding: "32px", textAlign: "center", color: "var(--c-steel)" }}>
          Loading queue items...
        </p>
      ) : filteredItems.length === 0 ? (
        <div className="inc-empty-state" style={{ padding: "48px 32px" }}>
          <span className="material-symbols-outlined inc-empty-state__icon" style={{ fontSize: "40px", color: "var(--c-muted)" }}>
            {activeFilterCount > 0 ? "filter_list_off" : "check_circle"}
          </span>
          <p className="inc-empty-state__text">
            {activeFilterCount > 0 ? "No records match your active filters." : config.emptyText}
          </p>
          {activeFilterCount > 0 && (
            <button
              type="button"
              className="wmirs-clear-all-btn"
              style={{ marginTop: "12px" }}
              onClick={resetFilters}
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : isIncidents ? (
        <AdminIncidentTable
          incidents={filteredItems}
          onStatusChange={onStatusChange}
          onViewDetails={onViewDetails}
          readOnly={!config.editable}
          stageId={stageId}
        />
      ) : (
        <MonitoringTable
          logs={filteredItems}
          isAdmin={config.editable}
          onStatusChange={onStatusChange}
          onViewDetails={onViewDetails}
        />
      )}
    </div>
  );
}
