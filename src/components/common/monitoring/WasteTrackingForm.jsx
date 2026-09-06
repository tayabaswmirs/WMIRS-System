
import LocationAddressPicker from "../LocationAddressPicker";

function WasteTrackingForm({ formData, onChange, setFormData }) {
  const collectionTypes = ["Residential", "Commercial", "Institutional"];

  const handleLocationChange = (locPayload) => {
    setFormData((prev) => ({
      ...prev,
      barangay: locPayload.barangay,
      sitioStreet: locPayload.sitioStreet,
      coordinates: locPayload.coordinates,
      location: locPayload.location,
    }));
  };

  const handleVolumeValueChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      volumeValue: value
    }));
  };

  const handleVolumeUnitChange = (e) => {
    const unit = e.target.value;
    setFormData((prev) => ({
      ...prev,
      volumeUnit: unit
    }));
  };

  return (
    <>
      {/* 3-Tier Collection Route / Barangay */}
      <div className="inc-form__group inc-form__group--full" style={{ gridColumn: "1 / -1", marginBottom: "8px" }}>
        <LocationAddressPicker
          value={{
            barangay: formData.barangay || "",
            sitioStreet: formData.sitioStreet || "",
            coordinates: formData.coordinates || null,
          }}
          onChange={handleLocationChange}
          required
        />
      </div>

      {/* Collection Type */}
      <div className="inc-form__group">
        <label className="inc-form__label">
          <span className="material-symbols-outlined inc-form__label-icon">home_repair_service</span>
          Collection Type <span className="inc-form__required">*</span>
        </label>
        <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
          {collectionTypes.map((type) => {
            const isChecked = formData.collectionType === type;
            return (
              <label key={type} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="radio"
                  name="collection-type"
                  value={type}
                  checked={isChecked}
                  onChange={() => onChange("collectionType", type)}
                  style={{ cursor: "pointer" }}
                />
                {type}
              </label>
            );
          })}
        </div>
      </div>

      {/* Volume Metric Estimate */}
      <div className="inc-form__group">
        <label className="inc-form__label" htmlFor="mon-volume-val">
          <span className="material-symbols-outlined inc-form__label-icon">delete</span>
          Volume Metric Estimate <span className="inc-form__required">*</span>
        </label>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            id="mon-volume-val"
            type="number"
            min="0"
            step="any"
            value={formData.volumeValue || ""}
            onChange={handleVolumeValueChange}
            placeholder="e.g., 2.5"
            className="inc-form__input"
            style={{ flex: 1 }}
            required
          />
          <div className="inc-form__select-wrap" style={{ width: "120px" }}>
            <select
              id="mon-volume-unit"
              value={formData.volumeUnit || "kg"}
              onChange={handleVolumeUnitChange}
              className="inc-form__select"
            >
              <option value="kg">kg</option>
              <option value="tons">tons</option>
              <option value="m³">m³</option>
            </select>
          </div>
        </div>
      </div>

      {/* Operational Issues Encountered */}
      <div className="inc-form__group inc-form__group--full">
        <label className="inc-form__label" htmlFor="mon-operational-issues">
          <span className="material-symbols-outlined inc-form__label-icon">report_problem</span>
          Operational Issues Encountered <span className="inc-form__required">*</span>
        </label>
        <textarea
          id="mon-operational-issues"
          value={formData.operationalIssues || ""}
          onChange={(e) => onChange("operationalIssues", e.target.value)}
          placeholder="Blocked access, unsegregated waste bins, collection delays, etc..."
          className="inc-form__textarea"
          rows={4}
          maxLength={1000}
          required
        />
        <span className="inc-form__char-count">{(formData.operationalIssues || "").length} / 1000</span>
      </div>
    </>
  );
}

export default WasteTrackingForm;
