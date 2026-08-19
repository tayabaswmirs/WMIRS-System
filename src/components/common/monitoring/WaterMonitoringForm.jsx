
function WaterMonitoringForm({ formData, onChange }) {
  return (
    <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="inc-form__row inc-form__row--two">
        {/* Date and Time */}
        <div className="inc-form__group">
          <label className="inc-form__label" htmlFor="mon-water-datetime">
            <span className="material-symbols-outlined inc-form__label-icon">calendar_today</span>
            Date and Time <span className="inc-form__required">*</span>
          </label>
          <input
            id="mon-water-datetime"
            type="datetime-local"
            value={formData.dateTime || ""}
            onChange={(e) => onChange("dateTime", e.target.value)}
            className="inc-form__input"
            required
          />
        </div>

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
            placeholder="e.g., Tayabas River"
            className="inc-form__input"
            required
          />
        </div>
      </div>

      <div className="inc-form__row inc-form__row--two">
        {/* Specific Location Marker */}
        <div className="inc-form__group">
          <label className="inc-form__label" htmlFor="mon-water-location">
            <span className="material-symbols-outlined inc-form__label-icon">location_on</span>
            Location / Barangay <span className="inc-form__required">*</span>
          </label>
          <input
            id="mon-water-location"
            type="text"
            value={formData.locationMarker || ""}
            onChange={(e) => onChange("locationMarker", e.target.value)}
            placeholder="e.g., Near San Roque Bridge"
            className="inc-form__input"
            required
          />
        </div>

        {/* Source Type */}
        <div className="inc-form__group">
          <label className="inc-form__label" htmlFor="mon-water-source">
            <span className="material-symbols-outlined inc-form__label-icon">nature</span>
            Source Type <span className="inc-form__required">*</span>
          </label>
          <select
            id="mon-water-source"
            value={formData.sourceType || ""}
            onChange={(e) => onChange("sourceType", e.target.value)}
            className="inc-form__input"
            required
          >
            <option value="" disabled>Select source type</option>
            <option value="River">River</option>
            <option value="Stream">Stream</option>
            <option value="Spring">Spring</option>
            <option value="Reservoir">Reservoir</option>
            <option value="Coastal">Coastal</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="inc-form__row inc-form__row--three">
        {/* Water Clarity */}
        <div className="inc-form__group">
          <label className="inc-form__label" htmlFor="mon-water-clarity">
            <span className="material-symbols-outlined inc-form__label-icon">visibility</span>
            Water Clarity <span className="inc-form__required">*</span>
          </label>
          <select
            id="mon-water-clarity"
            value={formData.waterClarity || ""}
            onChange={(e) => onChange("waterClarity", e.target.value)}
            className="inc-form__input"
            required
          >
            <option value="" disabled>Select clarity</option>
            <option value="Clear">Clear</option>
            <option value="Slightly Turbid">Slightly Turbid</option>
            <option value="Very Turbid">Very Turbid</option>
            <option value="Opaque">Opaque</option>
          </select>
        </div>

        {/* Flow Level */}
        <div className="inc-form__group">
          <label className="inc-form__label" htmlFor="mon-water-flow">
            <span className="material-symbols-outlined inc-form__label-icon">tsunami</span>
            Flow Level <span className="inc-form__required">*</span>
          </label>
          <select
            id="mon-water-flow"
            value={formData.flowLevel || ""}
            onChange={(e) => onChange("flowLevel", e.target.value)}
            className="inc-form__input"
            required
          >
            <option value="" disabled>Select flow level</option>
            <option value="Stagnant">Stagnant</option>
            <option value="Slow/Sluggish">Slow/Sluggish</option>
            <option value="Moderate">Moderate</option>
            <option value="Fast/Rushing">Fast/Rushing</option>
          </select>
        </div>

        {/* Primary Usage */}
        <div className="inc-form__group">
          <label className="inc-form__label" htmlFor="mon-water-usage">
            <span className="material-symbols-outlined inc-form__label-icon">settings_accessibility</span>
            Primary Usage <span className="inc-form__required">*</span>
          </label>
          <select
            id="mon-water-usage"
            value={formData.primaryUsage || ""}
            onChange={(e) => onChange("primaryUsage", e.target.value)}
            className="inc-form__input"
            required
          >
            <option value="" disabled>Select usage</option>
            <option value="Drinking Water">Drinking Water</option>
            <option value="Irrigation">Irrigation</option>
            <option value="Fishing">Fishing</option>
            <option value="Recreation">Recreation</option>
            <option value="Industrial">Industrial</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
      </div>

      <div className="inc-form__section" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--c-hairline)' }}>
        <div className="inc-form__section-header">
          <span className="material-symbols-outlined inc-form__section-icon">science</span>
          <span className="inc-form__section-label">Field-Kit Testing <span className="inc-form__optional">(optional)</span></span>
        </div>
        <div className="inc-form__row inc-form__row--three">
          <div className="inc-form__group">
            <label className="inc-form__label" htmlFor="mon-water-ph">
              pH Level
            </label>
            <input
              id="mon-water-ph"
              type="number"
              step="0.1"
              min="0"
              max="14"
              value={formData.phLevel || ""}
              onChange={(e) => onChange("phLevel", e.target.value)}
              placeholder="e.g., 7.2"
              className="inc-form__input"
            />
          </div>
          <div className="inc-form__group">
            <label className="inc-form__label" htmlFor="mon-water-temp">
              Temperature (°C)
            </label>
            <input
              id="mon-water-temp"
              type="number"
              step="0.1"
              value={formData.temperature || ""}
              onChange={(e) => onChange("temperature", e.target.value)}
              placeholder="e.g., 25.5"
              className="inc-form__input"
            />
          </div>
          <div className="inc-form__group">
            <label className="inc-form__label" htmlFor="mon-water-do">
              Dissolved Oxygen (mg/L)
            </label>
            <input
              id="mon-water-do"
              type="number"
              step="0.1"
              value={formData.dissolvedOxygen || ""}
              onChange={(e) => onChange("dissolvedOxygen", e.target.value)}
              placeholder="e.g., 6.5"
              className="inc-form__input"
            />
          </div>
        </div>
      </div>

      {/* Physical Condition Log */}
      <div className="inc-form__group inc-form__group--full" style={{ marginTop: '24px' }}>
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
    </div>
  );
}

export default WaterMonitoringForm;
