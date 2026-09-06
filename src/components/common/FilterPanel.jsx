import MultiSelectPillGroup from "./MultiSelectPillGroup";
import DateRangeFilter from "./DateRangeFilter";
import FilterSelect from "./FilterSelect";
import FilterPanelFooter from "./FilterPanelFooter";
import PriorityRankingToggle from "./PriorityRankingToggle";

const STATUS_OPTIONS = [
  "Submitted", "Denied", "Open Assignment", "Pending Verification", "Pending Completion", "Completed"
];

const SEVERITY_OPTIONS = [
  { value: "Low", label: "Low", color: "#00ed64" },
  { value: "Medium", label: "Medium", color: "#ffb020" },
  { value: "High", label: "High", color: "#fa6e39" },
  { value: "Critical", label: "Critical", color: "#ff3d57" }
];

/**
 * FilterPanel — Collapsible panel hosting all toggle and dropdown controls.
 */
export default function FilterPanel({
  mode = "incident",
  isAdmin = false,
  fixedCategory = null,
  selectedStatuses = [],
  toggleStatus,
  selectedSeverities = [],
  toggleSeverity,
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  selectedBarangay,
  setSelectedBarangay,
  selectedReporter,
  setSelectedReporter,
  datePreset,
  setDatePreset,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  dynamicOptions = {},
  activeFilterCount = 0,
  onReset,
  onClose,
  prioritizeCritical = true,
  onTogglePriority,
  stageId = null,
  allowedStatusOptions = null
}) {
  const statusOptions = allowedStatusOptions && allowedStatusOptions.length > 0
    ? allowedStatusOptions
    : STATUS_OPTIONS;

  return (
    <div className="wmirs-filter-panel" role="region" aria-label="Detailed filter options">
      {/* 1. Status Multi-Toggle */}
      <MultiSelectPillGroup
        label="Workflow Status (Multi-Select)"
        options={statusOptions}
        selectedValues={selectedStatuses}
        onToggle={toggleStatus}
      />

      {/* 2. Severity Multi-Toggle (Incidents Only) */}
      {mode === "incident" && (
        <MultiSelectPillGroup
          label="Incident Severity (Multi-Select)"
          options={SEVERITY_OPTIONS}
          selectedValues={selectedSeverities}
          onToggle={toggleSeverity}
        />
      )}

      {/* 3. Sorting Priority Control (Incidents Only, hidden for completed archive) */}
      {mode === "incident" && onTogglePriority && stageId !== "completed-archive" && (
        <PriorityRankingToggle
          prioritizeCritical={prioritizeCritical}
          onTogglePriority={onTogglePriority}
        />
      )}


      {/* 4. Category / Subcategory / Location / Reporter Selects */}
      <div className="wmirs-filter-grid">
        {!fixedCategory && (
          <FilterSelect
            label="Category"
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={dynamicOptions.categories || []}
            defaultOptionLabel="All Categories"
            icon="folder_open"
          />
        )}

        {mode === "monitoring" && (
          <FilterSelect
            label="Subcategory"
            value={selectedSubcategory}
            onChange={setSelectedSubcategory}
            options={dynamicOptions.subcategories || []}
            defaultOptionLabel="All Subcategories"
            icon="subdirectory_arrow_right"
          />
        )}

        <FilterSelect
          label="Barangay / Location"
          value={selectedBarangay}
          onChange={setSelectedBarangay}
          options={dynamicOptions.barangays || []}
          defaultOptionLabel="All Locations"
          icon="location_on"
        />

        {isAdmin && (
          <FilterSelect
            label="Reporter / Staff"
            value={selectedReporter}
            onChange={setSelectedReporter}
            options={dynamicOptions.reporters || []}
            defaultOptionLabel="All Reporters"
            icon="person"
          />
        )}
      </div>

      {/* 5. Date Range Filter */}
      <DateRangeFilter
        preset={datePreset}
        onSelectPreset={setDatePreset}
        startDate={customStartDate}
        endDate={customEndDate}
        onStartDateChange={setCustomStartDate}
        onEndDateChange={setCustomEndDate}
      />

      {/* 6. Bottom Action Footer */}
      <FilterPanelFooter
        activeFilterCount={activeFilterCount}
        onReset={onReset}
        onClose={onClose}
      />
    </div>
  );
}
