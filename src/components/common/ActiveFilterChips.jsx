/**
 * ActiveFilterChips — Displays removable badges for active filters with "Clear All".
 */
export default function ActiveFilterChips({ chips = [], onClearAll }) {
  if (chips.length === 0) return null;

  return (
    <div className="wmirs-active-chips-row" role="region" aria-label="Active filters">
      {chips.map((chip) => (
        <span key={chip.id} className="wmirs-active-chip">
          <span>{chip.label}</span>
          <button
            type="button"
            className="wmirs-chip-remove-btn"
            onClick={chip.onRemove}
            aria-label={`Remove filter ${chip.label}`}
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        className="wmirs-clear-all-btn"
        onClick={onClearAll}
      >
        Clear All
      </button>
    </div>
  );
}
