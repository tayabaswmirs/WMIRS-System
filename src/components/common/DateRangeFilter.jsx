const DATE_PRESETS = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "custom", label: "Custom Range" }
];

/**
 * DateRangeFilter — Preset pill buttons with clean custom calendar inputs.
 */
export default function DateRangeFilter({
  preset = "all",
  onSelectPreset,
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange
}) {
  return (
    <div className="wmirs-filter-section">
      <span className="wmirs-filter-label">
        <span className="material-symbols-outlined" style={{ fontSize: "15px" }} aria-hidden="true">
          calendar_today
        </span>
        Date Added / Reported
      </span>
      <div className="wmirs-date-controls">
        <div className="wmirs-pill-group" role="radiogroup" aria-label="Date range preset">
          {DATE_PRESETS.map((p) => {
            const isSelected = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`wmirs-pill-btn${isSelected ? " is-selected" : ""}`}
                onClick={() => onSelectPreset(p.id)}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {preset === "custom" && (
          <div className="wmirs-custom-date-inputs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="wmirs-date-input-field"
              aria-label="Filter start date"
            />
            <span className="wmirs-date-separator">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="wmirs-date-input-field"
              aria-label="Filter end date"
            />
          </div>
        )}
      </div>
    </div>
  );
}
