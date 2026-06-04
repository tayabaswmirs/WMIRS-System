import { useEffect } from "react";

function PlasticBanForm({ formData, onChange, setFormData }) {
  const businessTypes = [
    "Public Market Vendor",
    "Supermarket",
    "Convenience Store",
    "Restaurant/Eatery",
    "Wholesale/Retail Store"
  ];

  const actionTokens = [
    "None",
    "Verbal Warning",
    "Written Non-Compliance Notice",
    "Citation Ticket"
  ];

  // Set default compliant status to true if not set
  useEffect(() => {
    if (formData.compliant === undefined) {
      setFormData((prev) => ({
        ...prev,
        compliant: true,
        actionToken: "None"
      }));
    }
  }, [formData.compliant, setFormData]);

  const handleToggleChange = (e) => {
    const isCompliant = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      compliant: isCompliant,
      // Clear infractions and reset action token if toggled to compliant
      infractionDetails: isCompliant ? "" : prev.infractionDetails,
      actionToken: isCompliant ? "None" : (prev.actionToken === "None" ? "Verbal Warning" : prev.actionToken)
    }));
  };

  const isCompliant = formData.compliant !== false; // defaults to true

  return (
    <>
      {/* Establishment Name */}
      <div className="inc-form__group">
        <label className="inc-form__label" htmlFor="mon-establishment">
          <span className="material-symbols-outlined inc-form__label-icon">store</span>
          Establishment Name <span className="inc-form__required">*</span>
        </label>
        <input
          id="mon-establishment"
          type="text"
          value={formData.establishmentName || ""}
          onChange={(e) => onChange("establishmentName", e.target.value)}
          placeholder="e.g., SM Savemore, Alitao Grocery"
          className="inc-form__input"
          required
        />
      </div>

      {/* Business Type */}
      <div className="inc-form__group">
        <label className="inc-form__label" htmlFor="mon-business-type">
          <span className="material-symbols-outlined inc-form__label-icon">storefront</span>
          Business Type <span className="inc-form__required">*</span>
        </label>
        <div className="inc-form__select-wrap">
          <select
            id="mon-business-type"
            value={formData.businessType || ""}
            onChange={(e) => onChange("businessType", e.target.value)}
            className="inc-form__select"
            required
          >
            <option value="">— Select Business Type —</option>
            {businessTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compliance Status Toggle Switch */}
      <div className="inc-form__group inc-form__group--full">
        <label className="inc-form__label" style={{ marginBottom: "8px" }}>
          <span className="material-symbols-outlined inc-form__label-icon">verified_user</span>
          Compliance Status <span className="inc-form__required">*</span>
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
          <label className="mon-switch">
            <input
              type="checkbox"
              checked={isCompliant}
              onChange={handleToggleChange}
              id="mon-compliance-toggle"
            />
            <span className="mon-slider mon-round"></span>
          </label>
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: isCompliant ? "var(--c-green-dark, #00684a)" : "#dc2626"
            }}
          >
            {isCompliant ? "Compliant" : "Non-Compliant"}
          </span>
        </div>
      </div>

      {/* Infraction Details & Action Token — dynamically hidden if compliant */}
      {!isCompliant && (
        <>
          {/* Infraction Details */}
          <div className="inc-form__group inc-form__group--full">
            <label className="inc-form__label" htmlFor="mon-infraction">
              <span className="material-symbols-outlined inc-form__label-icon">warning</span>
              Infraction Details <span className="inc-form__required">*</span>
            </label>
            <textarea
              id="mon-infraction"
              value={formData.infractionDetails || ""}
              onChange={(e) => onChange("infractionDetails", e.target.value)}
              placeholder="Detail the type of plastic violations discovered (e.g., using single-use plastic bags for dry goods)..."
              className="inc-form__textarea"
              rows={4}
              maxLength={1000}
              required={!isCompliant}
            />
            <span className="inc-form__char-count">{(formData.infractionDetails || "").length} / 1000</span>
          </div>

          {/* Action Token Issued */}
          <div className="inc-form__group">
            <label className="inc-form__label" htmlFor="mon-action-token">
              <span className="material-symbols-outlined inc-form__label-icon">assignment_turned_in</span>
              Action Token Issued <span className="inc-form__required">*</span>
            </label>
            <div className="inc-form__select-wrap">
              <select
                id="mon-action-token"
                value={formData.actionToken || "Verbal Warning"}
                onChange={(e) => onChange("actionToken", e.target.value)}
                className="inc-form__select"
                required={!isCompliant}
              >
                {actionTokens.filter(token => token !== "None").map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default PlasticBanForm;
