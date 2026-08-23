/**
 * StatusFilterBar — Responsive filter switcher that renders horizontal pill tabs on desktop
 * and an accessible select dropdown on mobile (< 768px).
 *
 * @param {Object} props
 * @param {string[]} props.filters - Array of filter label strings
 * @param {string} props.activeFilter - Current active filter
 * @param {function(string): void} props.onSelectFilter - Callback when a filter is chosen
 * @param {string} [props.ariaLabel] - Accessibility label
 * @param {string} [props.selectId] - Optional unique ID for select element
 */
export default function StatusFilterBar({
  filters = [],
  activeFilter,
  onSelectFilter,
  ariaLabel = "Filter by status",
  selectId
}) {
  return (
    <>
      {/* Desktop Horizontal Filter Tabs */}
      <div className="inc-filter-tabs" role="tablist" aria-label={ariaLabel}>
        {filters.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={activeFilter === f}
            onClick={() => onSelectFilter(f)}
            className={`inc-filter-tab${activeFilter === f ? " inc-filter-tab--active" : ""}`}
            type="button"
          >
            {f}
          </button>
        ))}
      </div>

      {/* Mobile Select Dropdown */}
      <div className="inc-filter-select-wrap" aria-label={ariaLabel}>
        <span className="material-symbols-outlined inc-filter-select-icon" aria-hidden="true">
          filter_list
        </span>
        <select
          id={selectId}
          value={activeFilter}
          onChange={(e) => onSelectFilter(e.target.value)}
          className="inc-filter-select"
          aria-label={ariaLabel}
        >
          {filters.map((f) => (
            <option key={f} value={f}>
              {f === "All" ? "All" : f}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
