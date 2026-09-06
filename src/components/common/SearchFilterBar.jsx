import FilterPanel from "./FilterPanel";
import ActiveFilterChips from "./ActiveFilterChips";
import "../../styles/filter-bar.css";

/**
 * SearchFilterBar — Master search and multi-toggle filter interface.
 */
export default function SearchFilterBar({
  filterHook,
  placeholder = "Search logs by type, location, reporter...",
  mode = "incident",
  isAdmin = false,
  fixedCategory = null
}) {
  const {
    searchQuery, setSearchQuery,
    selectedStatuses, toggleStatus,
    selectedSeverities, toggleSeverity,
    selectedCategory, setSelectedCategory,
    selectedSubcategory, setSelectedSubcategory,
    selectedBarangay, setSelectedBarangay,
    selectedReporter, setSelectedReporter,
    datePreset, setDatePreset,
    customStartDate, setCustomStartDate,
    customEndDate, setCustomEndDate,
    isPanelOpen, setIsPanelOpen,
    dynamicOptions, activeFilterCount,
    activeChips, resetFilters,
    prioritizeCritical, setPrioritizeCritical,
    stageId, allowedStatusOptions
  } = filterHook;


  return (
    <div className="wmirs-filter-system">
      <div className="wmirs-filter-bar">
        {/* Search Input Box */}
        <div className="wmirs-search-wrap">
          <span className="material-symbols-outlined wmirs-search-icon">search</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="wmirs-search-input"
            aria-label="Search records"
          />
          {searchQuery && (
            <button
              type="button"
              className="wmirs-search-clear-btn"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search text"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
            </button>
          )}
        </div>

        {/* Filters Panel Toggle Button */}
        <button
          type="button"
          className={`wmirs-filter-toggle-btn${isPanelOpen ? " is-open" : ""}${activeFilterCount > 0 ? " is-active" : ""}`}
          onClick={() => setIsPanelOpen((prev) => !prev)}
          aria-expanded={isPanelOpen}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            {isPanelOpen ? "tune" : "filter_list"}
          </span>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="wmirs-filter-badge">{activeFilterCount}</span>
          )}
        </button>

        {/* Quick Reset All Action in main row */}
        {activeFilterCount > 0 && (
          <button
            type="button"
            className="wmirs-clear-all-btn"
            onClick={resetFilters}
          >
            Reset
          </button>
        )}
      </div>

      {/* Expandable Filter Panel */}
      {isPanelOpen && (
        <FilterPanel
          mode={mode}
          isAdmin={isAdmin}
          fixedCategory={fixedCategory}
          selectedStatuses={selectedStatuses}
          toggleStatus={toggleStatus}
          selectedSeverities={selectedSeverities}
          toggleSeverity={toggleSeverity}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedSubcategory={selectedSubcategory}
          setSelectedSubcategory={setSelectedSubcategory}
          selectedBarangay={selectedBarangay}
          setSelectedBarangay={setSelectedBarangay}
          selectedReporter={selectedReporter}
          setSelectedReporter={setSelectedReporter}
          datePreset={datePreset}
          setDatePreset={setDatePreset}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          dynamicOptions={dynamicOptions}
          activeFilterCount={activeFilterCount}
          onReset={resetFilters}
          onClose={() => setIsPanelOpen(false)}
          prioritizeCritical={prioritizeCritical}
          onTogglePriority={setPrioritizeCritical}
          stageId={stageId}
          allowedStatusOptions={allowedStatusOptions}
        />
      )}

      {/* Active Filter Badges Strip */}
      <ActiveFilterChips chips={activeChips} onClearAll={resetFilters} />
    </div>
  );
}
