
function WaterConservationForm({ formData, onChange, setFormData }) {
  const indicators = [
    "Agricultural runoff signs",
    "Discoloration/Chemical sheen",
    "Solid waste accumulation along banks",
    "Unauthorized human activity nearby"
  ];

  const handleCheckboxChange = (indicator) => {
    const list = formData.pollutionIndicators || [];
    let updated;
    if (list.includes(indicator)) {
      updated = list.filter((item) => item !== indicator);
    } else {
      updated = [...list, indicator];
    }
    setFormData((prev) => ({ ...prev, pollutionIndicators: updated }));
  };

  return (
    <>
      {/* Pollution Risk Indicators */}
      <div className="inc-form__group inc-form__group--full">
        <label className="inc-form__label">
          <span className="material-symbols-outlined inc-form__label-icon">warning</span>
          Pollution Risk Indicators <span className="inc-form__required">*</span>
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          {indicators.map((ind) => {
            const isChecked = (formData.pollutionIndicators || []).includes(ind);
            return (
              <label key={ind} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14.5px" }}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckboxChange(ind)}
                  style={{ cursor: "pointer" }}
                />
                {ind}
              </label>
            );
          })}
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
          rows={4}
          maxLength={1000}
          required
        />
        <span className="inc-form__char-count">{(formData.aquaticWildlifeNotes || "").length} / 1000</span>
      </div>
    </>
  );
}

export default WaterConservationForm;
