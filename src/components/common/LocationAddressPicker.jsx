import { useState } from "react";
import { TAYABAS_BARANGAYS, formatFullAddress } from "../../utils/tayabasBarangays";
import LeafletMapPicker from "./LeafletMapPicker";

/**
 * 3-Tier Addressing and Geolocation Picker Component.
 * Standardizes locality data across Tayabas City ENRO forms.
 */
export default function LocationAddressPicker({
  value = {},
  onChange,
  required = true,
  disabled = false,
  showMap = true,
}) {
  const [isMapOpen, setIsMapOpen] = useState(false);

  const barangay = value.barangay || "";
  const sitioStreet = value.sitioStreet || "";
  const coordinates = value.coordinates || null;

  const handleBarangayChange = (newBarangay) => {
    const fullLocation = formatFullAddress(newBarangay, sitioStreet);
    onChange({
      barangay: newBarangay,
      sitioStreet,
      coordinates,
      location: fullLocation,
    });
  };

  const handleSitioChange = (newSitio) => {
    const fullLocation = formatFullAddress(barangay, newSitio);
    onChange({
      barangay,
      sitioStreet: newSitio,
      coordinates,
      location: fullLocation,
    });
  };

  const handleCoordinatesChange = (newCoords) => {
    const fullLocation = formatFullAddress(barangay, sitioStreet);
    onChange({
      barangay,
      sitioStreet,
      coordinates: newCoords,
      location: fullLocation,
    });
  };

  return (
    <div className="lap-wrap">
      <div className="lap-row">
        {/* Tier 1: 66 Canonical Barangays */}
        <div className="lap-group">
          <label className="lap-label" htmlFor="lap-barangay-select">
            <span className="material-symbols-outlined lap-label-icon">domain</span>
            Barangay {required && <span className="lap-required">*</span>}
          </label>
          <div className="lap-select-wrap">
            <select
              id="lap-barangay-select"
              value={barangay}
              onChange={(e) => handleBarangayChange(e.target.value)}
              disabled={disabled}
              className="lap-select"
              required={required}
            >
              <option value="">— Select Barangay (66 Total) —</option>
              {TAYABAS_BARANGAYS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tier 2: Specific Street / Sitio / Landmark */}
        <div className="lap-group">
          <label className="lap-label" htmlFor="lap-sitio-input">
            <span className="material-symbols-outlined lap-label-icon">signpost</span>
            Sitio / Purok / Street / Landmark {required && <span className="lap-required">*</span>}
          </label>
          <div className="lap-input-wrap">
            <input
              id="lap-sitio-input"
              type="text"
              value={sitioStreet}
              onChange={(e) => handleSitioChange(e.target.value)}
              placeholder="e.g. Purok 3, near Barangay Hall"
              disabled={disabled}
              className="lap-input"
              required={required}
            />
          </div>
        </div>
      </div>

      {/* Tier 3: Optional Collapsible Leaflet Map & GPS */}
      {showMap && (
        <div className="lap-group">
          <button
            type="button"
            className={`lap-geo-toggle ${isMapOpen ? "lap-geo-toggle--active" : ""}`}
            onClick={() => setIsMapOpen((prev) => !prev)}
          >
            <div className="lap-geo-toggle__left">
              <span className="material-symbols-outlined lap-geo-toggle__icon">pin_drop</span>
              <span>Map Pin &amp; Coordinates (Optional)</span>
            </div>
            <div className={`lap-geo-toggle__status ${coordinates ? "lap-geo-toggle__status--pinned" : ""}`}>
              <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>
                {coordinates ? "check_circle" : "tune"}
              </span>
              {coordinates ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : "Not Pinned"}
            </div>
          </button>

          {isMapOpen && (
            <LeafletMapPicker
              coordinates={coordinates}
              onChange={handleCoordinatesChange}
              barangay={barangay}
            />
          )}
        </div>
      )}
    </div>
  );
}
