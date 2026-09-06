/**
 * FilterPanelFooter — Action footer displaying active filter count, reset, and apply buttons.
 */
export default function FilterPanelFooter({ activeFilterCount = 0, onReset, onClose }) {
  return (
    <div className="wmirs-filter-panel-footer">
      <div className="wmirs-panel-active-indicator">
        {activeFilterCount > 0 ? (
          <span>{activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"} applied</span>
        ) : (
          <span>No active filters</span>
        )}
      </div>
      <div className="wmirs-panel-actions-group">
        {activeFilterCount > 0 && onReset && (
          <button
            type="button"
            className="wmirs-btn-reset"
            onClick={onReset}
          >
            Reset All
          </button>
        )}
        {onClose && (
          <button
            type="button"
            className="wmirs-btn-apply"
            onClick={onClose}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>done</span>
            Done
          </button>
        )}
      </div>
    </div>
  );
}
