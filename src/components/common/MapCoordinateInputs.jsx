/**
 * Manual Latitude and Longitude coordinate inputs with precision formatting.
 * Strictly adheres to MongoDB visual tokens and SRP.
 */
export default function MapCoordinateInputs({ coordinates, onUpdate }) {
  if (!coordinates) return null;

  return (
    <div className="lap-coords-grid">
      <div className="lap-coord-input-wrap">
        <span className="lap-coord-tag">Lat</span>
        <input
          type="number"
          step="0.00001"
          value={coordinates.lat}
          onChange={(e) => onUpdate(parseFloat(e.target.value) || 0, coordinates.lng)}
          className="lap-coord-input"
          aria-label="Latitude coordinate"
        />
      </div>
      <div className="lap-coord-input-wrap">
        <span className="lap-coord-tag">Lng</span>
        <input
          type="number"
          step="0.00001"
          value={coordinates.lng}
          onChange={(e) => onUpdate(coordinates.lat, parseFloat(e.target.value) || 0)}
          className="lap-coord-input"
          aria-label="Longitude coordinate"
        />
      </div>
    </div>
  );
}
