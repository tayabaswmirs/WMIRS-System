
function WildlifeObservationForm({ formData, onChange, setFormData }) {
  const handleTally = (amount) => {
    const current = Number(formData.quantity || 0);
    const newVal = Math.max(0, current + amount);
    setFormData((prev) => ({ ...prev, quantity: newVal }));
  };

  const classifications = ["Mammal", "Reptile", "Amphibian", "Insect", "Other"];

  return (
    <>
      {/* Animal Classification */}
      <div className="inc-form__group inc-form__group--full">
        <label className="inc-form__label">
          <span className="material-symbols-outlined inc-form__label-icon">pets</span>
          Animal Type / Classification <span className="inc-form__required">*</span>
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "8px" }}>
          {classifications.map((cls) => {
            const isChecked = formData.classification === cls;
            return (
              <label key={cls} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="radio"
                  name="animal-classification"
                  value={cls}
                  checked={isChecked}
                  onChange={() => onChange("classification", cls)}
                  style={{ cursor: "pointer" }}
                />
                {cls}
              </label>
            );
          })}
        </div>
      </div>

      {/* Species Name */}
      <div className="inc-form__group">
        <label className="inc-form__label" htmlFor="mon-species-name">
          <span className="material-symbols-outlined inc-form__label-icon">label</span>
          Species Name <span className="inc-form__required">*</span>
        </label>
        <input
          id="mon-species-name"
          type="text"
          value={formData.speciesName || ""}
          onChange={(e) => onChange("speciesName", e.target.value)}
          placeholder="e.g., Macaque, Monitor Lizard"
          className="inc-form__input"
          required
        />
      </div>

      {/* Quantity Sighted */}
      <div className="inc-form__group">
        <label className="inc-form__label">
          <span className="material-symbols-outlined inc-form__label-icon">tag</span>
          Quantity Sighted <span className="inc-form__required">*</span>
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
          <button
            type="button"
            onClick={() => handleTally(-1)}
            className="topbar-logout-btn"
            style={{ width: "36px", height: "36px", borderRadius: "50%", padding: 0 }}
          >
            -
          </button>
          <span style={{ fontSize: "16px", fontWeight: "600", minWidth: "30px", textAlign: "center" }}>
            {formData.quantity || 0}
          </span>
          <button
            type="button"
            onClick={() => handleTally(1)}
            className="topbar-logout-btn"
            style={{ width: "36px", height: "36px", borderRadius: "50%", padding: 0 }}
          >
            +
          </button>
        </div>
      </div>

      {/* Habitat Condition Notes */}
      <div className="inc-form__group inc-form__group--full">
        <label className="inc-form__label" htmlFor="mon-habitat-notes">
          <span className="material-symbols-outlined inc-form__label-icon">park</span>
          Habitat Condition Notes <span className="inc-form__required">*</span>
        </label>
        <textarea
          id="mon-habitat-notes"
          value={formData.habitatNotes || ""}
          onChange={(e) => onChange("habitatNotes", e.target.value)}
          placeholder="Field notes on surrounding flora, food availability, or signs of human disturbance..."
          className="inc-form__textarea"
          rows={4}
          maxLength={1000}
          required
        />
        <span className="inc-form__char-count">{(formData.habitatNotes || "").length} / 1000</span>
      </div>
    </>
  );
}

export default WildlifeObservationForm;
