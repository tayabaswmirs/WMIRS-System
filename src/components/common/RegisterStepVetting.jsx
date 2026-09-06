/**
 * Step 2 component for government officer vetting details and ID photo upload.
 */
export default function RegisterStepVetting({
  phone,
  setPhone,
  address,
  setAddress,
  idNumber,
  setIdNumber,
  idCardFile,
  idCardPreview,
  fileInputRef,
  isDragOver,
  setIsDragOver,
  handleFileChange,
  onRemoveFile,
  onBack,
  onSubmit,
  loading,
}) {
  return (
    <div className="reg-wizard__step">
      <div className="reg-field-group">
        <label className="reg-label" htmlFor="reg-phone">
          Phone Number <span className="reg-label__req">*</span>
        </label>
        <input
          id="reg-phone"
          type="tel"
          className="reg-input"
          placeholder="09123456789"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ""))}
          disabled={loading}
          required
        />
      </div>

      <div className="reg-field-group" style={{ marginTop: 12 }}>
        <label className="reg-label" htmlFor="reg-address">
          Complete Residential Address <span className="reg-label__req">*</span>
        </label>
        <input
          id="reg-address"
          type="text"
          className="reg-input"
          placeholder="Barangay, Municipality / City"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="reg-field-group" style={{ marginTop: 12 }}>
        <label className="reg-label" htmlFor="reg-id-num">
          Official ID Number <span className="reg-label__req">*</span>
        </label>
        <input
          id="reg-id-num"
          type="text"
          className="reg-input"
          placeholder="e.g. EMP-2026-0814 or PRC/Gov't ID"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="reg-field-group" style={{ marginTop: 12 }}>
        <label className="reg-label">
          Upload Valid ID Photo <span className="reg-label__req">*</span>
        </label>
        {idCardPreview ? (
          <div className="reg-preview-card">
            <img src={idCardPreview} alt="ID preview" className="reg-preview-thumb" />
            <div className="reg-preview-meta">
              <span className="reg-preview-name">{idCardFile?.name}</span>
              <span className="reg-preview-size">
                {((idCardFile?.size || 0) / 1024).toFixed(1)} KB
              </span>
            </div>
            <button
              type="button"
              className="reg-preview-remove"
              onClick={onRemoveFile}
              title="Remove photo"
              disabled={loading}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                delete
              </span>
            </button>
          </div>
        ) : (
          <div
            className={`reg-dropzone ${isDragOver ? "reg-dropzone--dragover" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFileChange(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="material-symbols-outlined reg-dropzone__icon">
              badge
            </span>
            <span className="reg-dropzone__text">
              Drag &amp; drop your ID photo here, or <strong>browse</strong>
            </span>
            <span className="reg-dropzone__subtext">Supports JPG, PNG, WebP up to 5MB</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="reg-dropzone__file-input"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              disabled={loading}
            />
          </div>
        )}
      </div>

      <div className="reg-actions">
        <button
          type="button"
          className="reg-btn-back"
          disabled={loading}
          onClick={onBack}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            arrow_back
          </span>
          <span>Back</span>
        </button>
        <button
          type="button"
          className="reg-btn-submit"
          disabled={loading}
          onClick={onSubmit}
        >
          <span>{loading ? "Submitting Application…" : "Submit Registration"}</span>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            check_circle
          </span>
        </button>
      </div>
    </div>
  );
}
