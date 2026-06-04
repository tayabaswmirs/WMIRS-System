
function WaterMonitoringForm({ formData, onChange }) {
  return (
    <>
      {/* Water Body Identifier */}
      <div className="inc-form__group">
        <label className="inc-form__label" htmlFor="mon-water-body">
          <span className="material-symbols-outlined inc-form__label-icon">water</span>
          Water Body Identifier <span className="inc-form__required">*</span>
        </label>
        <input
          id="mon-water-body"
          type="text"
          value={formData.waterBody || ""}
          onChange={(e) => onChange("waterBody", e.target.value)}
          placeholder="e.g., Tayabas River, Iyam River"
          className="inc-form__input"
          required
        />
      </div>

      {/* Specific Location Marker */}
      <div className="inc-form__group">
        <label className="inc-form__label" htmlFor="mon-water-location">
          <span className="material-symbols-outlined inc-form__label-icon">location_on</span>
          Specific Location Marker <span className="inc-form__required">*</span>
        </label>
        <input
          id="mon-water-location"
          type="text"
          value={formData.locationMarker || ""}
          onChange={(e) => onChange("locationMarker", e.target.value)}
          placeholder="e.g., Near San Roque Bridge, Barangay Alitao"
          className="inc-form__input"
          required
        />
      </div>

      {/* Physical Condition Log */}
      <div className="inc-form__group inc-form__group--full">
        <label className="inc-form__label" htmlFor="mon-water-condition">
          <span className="material-symbols-outlined inc-form__label-icon">description</span>
          Physical Condition Log <span className="inc-form__required">*</span>
        </label>
        <textarea
          id="mon-water-condition"
          value={formData.physicalCondition || ""}
          onChange={(e) => onChange("physicalCondition", e.target.value)}
          placeholder="Visual description (e.g., clear water, turbid, sluggish flow, excessive floating plant growth)..."
          className="inc-form__textarea"
          rows={4}
          maxLength={1000}
          required
        />
        <span className="inc-form__char-count">{(formData.physicalCondition || "").length} / 1000</span>
      </div>
    </>
  );
}

export default WaterMonitoringForm;
