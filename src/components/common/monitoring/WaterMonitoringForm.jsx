import LocationAddressPicker from "../LocationAddressPicker";
import WaterFieldKitFields from "./WaterFieldKitFields";

function WaterMonitoringForm({ formData, onChange, setFormData }) {
  const handleLocationChange = (locPayload) => {
    if (setFormData) {
      setFormData((prev) => ({
        ...prev,
        barangay: locPayload.barangay,
        sitioStreet: locPayload.sitioStreet,
        locationMarker: locPayload.location,
        coordinates: locPayload.coordinates,
        location: locPayload.location,
      }));
    } else {
      onChange("barangay", locPayload.barangay);
      onChange("sitioStreet", locPayload.sitioStreet);
      onChange("locationMarker", locPayload.location);
    }
  };

  return (
    <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="inc-form__row inc-form__row--two">
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

      <div className="inc-form__row inc-form__row--two">
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
            <option value="">— Select Source Type —</option>
            <option value="River / Stream">River / Stream</option>
            <option value="Spring">Spring</option>
            <option value="Lake / Pond">Lake / Pond</option>
            <option value="Groundwater / Well">Groundwater / Well</option>
            <option value="Watershed Reserve">Watershed Reserve</option>
          </select>
        </div>

        <div className="inc-form__group">
          <label className="inc-form__label" htmlFor="mon-water-clarity">
            <span className="material-symbols-outlined inc-form__label-icon">opacity</span>
            Water Clarity <span className="inc-form__required">*</span>
          </label>
          <select
            id="mon-water-clarity"
            value={formData.waterClarity || ""}
            onChange={(e) => onChange("waterClarity", e.target.value)}
            className="inc-form__input"
            required
          >
            <option value="">— Select Clarity —</option>
            <option value="Crystal Clear">Crystal Clear</option>
            <option value="Slightly Turbid">Slightly Turbid</option>
            <option value="Heavily Silted">Heavily Silted</option>
            <option value="Discolored / Oily">Discolored / Oily</option>
          </select>
        </div>
      </div>

      <div className="inc-form__row inc-form__row--two">
        <div className="inc-form__group">
          <label className="inc-form__label" htmlFor="mon-water-flow">
            <span className="material-symbols-outlined inc-form__label-icon">speed</span>
            Estimated Flow Rate <span className="inc-form__required">*</span>
          </label>
          <select
            id="mon-water-flow"
            value={formData.flowRate || ""}
            onChange={(e) => onChange("flowRate", e.target.value)}
            className="inc-form__input"
            required
          >
            <option value="">— Select Flow Rate —</option>
            <option value="Stagnant / Dry">Stagnant / Dry</option>
            <option value="Slow">Slow</option>
            <option value="Moderate">Moderate</option>
            <option value="Rapid">Rapid</option>
            <option value="Torrential / Flooding">Torrential / Flooding</option>
          </select>
        </div>

        <div className="inc-form__group">
          <label className="inc-form__label" htmlFor="mon-water-use">
            <span className="material-symbols-outlined inc-form__label-icon">people</span>
            Primary Community Usage <span className="inc-form__required">*</span>
          </label>
          <select
            id="mon-water-use"
            value={formData.primaryUsage || ""}
            onChange={(e) => onChange("primaryUsage", e.target.value)}
            className="inc-form__input"
            required
          >
            <option value="">— Select Primary Usage —</option>
            <option value="Potable / Domestic">Potable / Domestic</option>
            <option value="Irrigation">Irrigation</option>
            <option value="Fishing">Fishing</option>
            <option value="Recreation">Recreation</option>
            <option value="Industrial">Industrial</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
      </div>

      {/* Field-Kit Testing Sub-Component */}
      <WaterFieldKitFields formData={formData} onChange={onChange} />

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
          rows={3}
          maxLength={1000}
          required
        />
        <span className="inc-form__char-count">{(formData.physicalCondition || "").length} / 1000</span>
      </div>
    </div>
  );
}

export default WaterMonitoringForm;
