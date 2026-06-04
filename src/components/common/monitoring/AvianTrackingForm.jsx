
function AvianTrackingForm({ formData, onChange, setFormData }) {
  const handleTally = (amount) => {
    const current = Number(formData.count || 0);
    const newVal = Math.max(0, current + amount);
    setFormData((prev) => ({ ...prev, count: newVal }));
  };

  const handleCheckboxChange = (activity) => {
    const activities = formData.activities || [];
    let updated;
    if (activities.includes(activity)) {
      updated = activities.filter((act) => act !== activity);
    } else {
      updated = [...activities, activity];
    }
    setFormData((prev) => ({ ...prev, activities: updated }));
  };

  return (
    <>
      {/* Observation Date & Time */}
      <div className="inc-form__group">
        <label className="inc-form__label" htmlFor="mon-datetime">
          <span className="material-symbols-outlined inc-form__label-icon">calendar_today</span>
          Observation Date & Time <span className="inc-form__required">*</span>
        </label>
        <input
          id="mon-datetime"
          type="datetime-local"
          value={formData.dateTime || ""}
          onChange={(e) => onChange("dateTime", e.target.value)}
          className="inc-form__input"
          required
        />
      </div>

      {/* Transect Line / Station ID */}
      <div className="inc-form__group">
        <label className="inc-form__label" htmlFor="mon-station">
          <span className="material-symbols-outlined inc-form__label-icon">location_on</span>
          Location <span className="inc-form__required">*</span>
        </label>
        <input
          id="mon-station"
          type="text"
          value={formData.stationId || ""}
          onChange={(e) => onChange("stationId", e.target.value)}
          placeholder="e.g., Trail Alpha / Station 4"
          className="inc-form__input"
          required
        />
      </div>

      {/* Avian Species Identification */}
      <div className="inc-form__group">
        <label className="inc-form__label" htmlFor="mon-species">
          <span className="material-symbols-outlined inc-form__label-icon">sound_detection_dog_barking</span>
          Avian Species Identification <span className="inc-form__required">*</span>
        </label>
        <input
          id="mon-species"
          type="text"
          value={formData.avianSpecies || ""}
          onChange={(e) => onChange("avianSpecies", e.target.value)}
          placeholder="e.g., Luzon Bleeding-heart"
          className="inc-form__input"
          required
        />
      </div>

      {/* Count / Tally */}
      <div className="inc-form__group">
        <label className="inc-form__label">
          <span className="material-symbols-outlined inc-form__label-icon">tag</span>
          Count / Tally <span className="inc-form__required">*</span>
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
            {formData.count || 0}
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

      {/* Behavior / Activity */}
      <div className="inc-form__group inc-form__group--full">
        <label className="inc-form__label">
          <span className="material-symbols-outlined inc-form__label-icon">monitoring</span>
          Observed Behavior / Activity
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "8px" }}>
          {["Nesting", "Foraging", "Flying", "Perching"].map((act) => {
            const isChecked = (formData.activities || []).includes(act);
            return (
              <label key={act} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckboxChange(act)}
                  style={{ cursor: "pointer" }}
                />
                {act}
              </label>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default AvianTrackingForm;
