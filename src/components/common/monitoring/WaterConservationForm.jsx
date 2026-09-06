import LocationAddressPicker from "../LocationAddressPicker";

function WaterConservationForm({ formData, onChange, setFormData }) {
  const indicators = [
    "Agricultural runoff signs",
    "Discoloration/Chemical sheen",
    "Solid waste accumulation along banks",
    "Unauthorized human activity nearby"
  ];

  const threatLevels = ["Low", "Moderate", "High", "Critical"];

  const handleLocationChange = (locPayload) => {
    setFormData((prev) => ({
      ...prev,
      barangay: locPayload.barangay,
      sitioStreet: locPayload.sitioStreet,
      locationMarker: locPayload.location,
      coordinates: locPayload.coordinates,
      location: locPayload.location,
    }));
  };

  const handleCheckboxChange = (indicator) => {
    const list = formData.pollutionIndicators || [];
    const updated = list.includes(indicator)
      ? list.filter((item) => item !== indicator)
      : [...list, indicator];
    setFormData((prev) => ({ ...prev, pollutionIndicators: updated }));
  };

  return (
    <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="inc-form__row inc-form__row--two">
        <div className="inc-form__group">
          <label className="inc-form__label" htmlFor="mon-cons-datetime">
            <span className="material-symbols-outlined inc-form__label-icon">calendar_today</span>
            Date and Time <span className="inc-form__required">*</span>
          </label>
          <input
            id="mon-cons-datetime"
            type="datetime-local"
            value={formData.dateTime || ""}
            onChange={(e) => onChange("dateTime", e.target.value)}
            className="inc-form__input"
            required
          />
        </div>

        <div className="inc-form__group">
          <label className="inc-form__label" htmlFor="mon-cons-body">
            <span className="material-symbols-outlined inc-form__label-icon">water</span>
            Water Body <span className="inc-form__required">*</span>
          </label>
          <input
            id="mon-cons-body"
            type="text"
            value={formData.waterBody || ""}
            onChange={(e) => onChange("waterBody", e.target.value)}
            placeholder="e.g., Tayabas River"
            className="inc-form__input"
            required
          />
        </div>
      </div>

      {/* 3-Tier Address & Geolocation */}
      <LocationAddressPicker
        value={{
          barangay: formData.barangay || "",
          sitioStreet: formData.sitioStreet || formData.locationMarker || "",
          coordinates: formData.coordinates || null,
        }}
        onChange={handleLocationChange}
        required
      />

      {/* Ecological Threat/Risk Level */}
      <div className="inc-form__group">
        <label className="inc-form__label">
          <span className="material-symbols-outlined inc-form__label-icon">warning</span>
          Ecological Threat Level <span className="inc-form__required">*</span>
        </label>
        <div className="inc-form__severity-pills" role="radiogroup" aria-label="Ecological threat level">
          {threatLevels.map((level) => {
            const isActive = (formData.threatLevel || "Low") === level;
            return (
              <label
                key={level}
                className={`inc-severity-pill inc-severity-pill--${level.toLowerCase()}${isActive ? " inc-severity-pill--active" : ""}`}
              >
                <input
                  type="radio"
                  name="mon-threat-level"
                  value={level}
                  checked={isActive}
                  onChange={() => onChange("threatLevel", level)}
                  className="inc-severity-pill__radio"
                />
                {level}
              </label>
            );
          })}
        </div>
      </div>

      {/* Pollution Risk Indicators */}
      <div className="inc-form__group inc-form__group--full">
        <label className="inc-form__label">
          <span className="material-symbols-outlined inc-form__label-icon">biotech</span>
          Pollution Risk Indicators <span className="inc-form__required">*</span>
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "4px" }}>
          {indicators.map((ind) => (
            <label key={ind} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={(formData.pollutionIndicators || []).includes(ind)}
                onChange={() => handleCheckboxChange(ind)}
              />
              {ind}
            </label>
          ))}
        </div>
      </div>

      {/* Observed Aquatic Wildlife Activity */}
      <div className="inc-form__group inc-form__group--full">
        <label className="inc-form__label" htmlFor="mon-aquatic-notes">
          <span className="material-symbols-outlined inc-form__label-icon">waves</span>
          Observed Aquatic Wildlife Activity <span className="inc-form__required">*</span>
        </label>
        <textarea
          id="mon-aquatic-notes"
          value={formData.aquaticWildlifeNotes || ""}
          onChange={(e) => onChange("aquaticWildlifeNotes", e.target.value)}
          placeholder="Notes on fish health or biodiversity status in the immediate vicinity..."
          className="inc-form__textarea"
          rows={3}
          maxLength={1000}
          required
        />
        <span className="inc-form__char-count">{(formData.aquaticWildlifeNotes || "").length} / 1000</span>
      </div>
    </div>
  );
}

export default WaterConservationForm;
