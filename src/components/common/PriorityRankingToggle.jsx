/**
 * PriorityRankingToggle — Switch between critical-first priority listing and chronological sorting.
 */
export default function PriorityRankingToggle({
  prioritizeCritical = true,
  onTogglePriority
}) {
  return (
    <div className="wmirs-filter-section">
      <span className="wmirs-filter-label">
        <span className="material-symbols-outlined" style={{ fontSize: "15px" }} aria-hidden="true">
          low_priority
        </span>
        Incident Priority Ranking
      </span>
      <div className="wmirs-pill-group" role="radiogroup" aria-label="Incident priority ranking">
        <button
          type="button"
          role="radio"
          aria-checked={prioritizeCritical}
          className={`wmirs-pill-btn${prioritizeCritical ? " is-selected" : ""}`}
          onClick={() => onTogglePriority(true)}
        >
          Critical First (Default)
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={!prioritizeCritical}
          className={`wmirs-pill-btn${!prioritizeCritical ? " is-selected" : ""}`}
          onClick={() => onTogglePriority(false)}
        >
          Strict Date (Chronological)
        </button>
      </div>
    </div>
  );
}
