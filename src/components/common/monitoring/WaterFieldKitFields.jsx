export default function WaterFieldKitFields({ formData, onChange }) {
  return (
    <div className="inc-form__section" style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--c-hairline)" }}>
      <div className="inc-form__section-header">
        <span className="material-symbols-outlined inc-form__section-icon">science</span>
        <span className="inc-form__section-label">
          Field-Kit Testing <span className="inc-form__optional">(optional)</span>
        </span>
      </div>
      <div className="inc-form__row inc-form__row--three">
        <div className="inc-form__group">
          <label className="inc-form__label" htmlFor="mon-water-ph">pH Level</label>
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
          <label className="inc-form__label" htmlFor="mon-water-temp">Temperature (°C)</label>
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
          <label className="inc-form__label" htmlFor="mon-water-do">Dissolved Oxygen (mg/L)</label>
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
  );
}
