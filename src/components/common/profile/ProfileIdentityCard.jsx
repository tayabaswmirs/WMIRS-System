export default function ProfileIdentityCard({ profileData }) {
  const roleDisplay = `${(profileData?.role || "user").toUpperCase()}${
    profileData?.staffScope ? ` (${profileData.staffScope})` : ""
  }`;

  return (
    <div className="prof-card">
      <div className="flex items-center justify-between border-b border-[var(--c-hairline-soft)] pb-3 mb-4">
        <div>
          <h2 className="prof-card__title" style={{ margin: 0 }}>Identity Verification</h2>
          <p className="um-edit-desc" style={{ textAlign: "left", fontSize: "12px", margin: "4px 0 0" }}>
            Verified credentials recorded during account vetting.
          </p>
        </div>
        <span
          className="um-role-badge"
          style={{ backgroundColor: "rgba(0, 237, 100, 0.12)", color: "var(--c-green, #00ed64)" }}
        >
          <span className="material-symbols-outlined text-[14px]">lock</span>
          Verified Credential
        </span>
      </div>

      <div className="prof-grid">
        <div className="um-form-group">
          <label className="um-form-label">Official ID Number</label>
          <input
            type="text"
            disabled
            value={profileData?.idNumber || "Not recorded (Legacy Account)"}
            className="um-form-input"
            style={{ backgroundColor: "rgba(0, 30, 43, 0.05)", cursor: "not-allowed", fontFamily: "monospace" }}
          />
        </div>
        <div className="um-form-group">
          <label className="um-form-label">System Role &amp; Scope</label>
          <input
            type="text"
            disabled
            value={roleDisplay}
            className="um-form-input"
            style={{ backgroundColor: "rgba(0, 30, 43, 0.05)", cursor: "not-allowed" }}
          />
        </div>
      </div>

      {profileData?.idCardUrl && (
        <div style={{ marginTop: 16 }}>
          <label className="um-form-label" style={{ display: "block", marginBottom: 6 }}>
            Verified ID Document
          </label>
          <div
            style={{
              maxWidth: 280,
              maxHeight: 180,
              overflow: "hidden",
              borderRadius: 8,
              border: "1px solid var(--c-hairline-soft)",
              backgroundColor: "#001e2b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={profileData.idCardUrl}
              alt="Verified ID Document"
              style={{ maxWidth: "100%", maxHeight: 170, objectFit: "contain" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
