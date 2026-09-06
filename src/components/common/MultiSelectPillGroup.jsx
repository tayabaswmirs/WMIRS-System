/**
 * MultiSelectPillGroup — Accessible multi-toggle pill button row.
 * Adheres to MongoDB Design System (mongodb-DESIGN.md) pill specifications.
 */
export default function MultiSelectPillGroup({
  label,
  options = [],
  selectedValues = [],
  onToggle
}) {
  return (
    <div className="wmirs-filter-section">
      {label && <span className="wmirs-filter-label">{label}</span>}
      <div className="wmirs-pill-group" role="group" aria-label={label}>
        {options.map((option) => {
          const value = typeof option === "object" ? option.value : option;
          const optLabel = typeof option === "object" ? option.label : option;
          const colorDot = typeof option === "object" ? option.color : null;
          const isSelected = selectedValues.includes(value);

          // Detect severity option for semantic color styling
          const severityClass = ["low", "medium", "high", "critical"].includes(
            String(value).toLowerCase()
          )
            ? ` is-severity-${String(value).toLowerCase()}`
            : "";

          return (
            <button
              key={value}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              className={`wmirs-pill-btn${severityClass}${isSelected ? " is-selected" : ""}`}
              onClick={() => onToggle(value)}
            >
              {colorDot && !isSelected && (
                <span
                  className="wmirs-pill-dot"
                  style={{ backgroundColor: colorDot }}
                  aria-hidden="true"
                />
              )}
              <span>{optLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
