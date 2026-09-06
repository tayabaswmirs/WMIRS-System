/**
 * Geolocation toolbar with GPS acquisition and pin reset actions.
 * Strictly adheres to MongoDB visual tokens and SRP.
 */
export default function MapToolbar({ isLocating, onLocate, onClear, hasCoordinates }) {
  return (
    <div className="lap-map-toolbar">
      <button
        type="button"
        className="lap-btn-gps"
        onClick={onLocate}
        disabled={isLocating}
      >
        <span
          className={`material-symbols-outlined lap-btn-gps__icon ${
            isLocating ? "lap-btn-gps__spinner" : ""
          }`}
        >
          {isLocating ? "progress_activity" : "my_location"}
        </span>
        {isLocating ? "Acquiring GPS…" : "Use Current Location"}
      </button>

      {hasCoordinates && (
        <button type="button" className="lap-btn-clear" onClick={onClear}>
          <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
            close
          </span>
          Clear Pin
        </button>
      )}
    </div>
  );
}
