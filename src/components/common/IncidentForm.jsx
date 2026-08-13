import { useState, useRef } from "react";
import { INCIDENT_MAP, SEVERITY_LEVELS, CATEGORY_META, INCIDENT_TYPE_META } from "../../utils/incidentConstants";

// Maximum allowed file size: 10 MB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * IncidentForm — 3-step step-by-step wizard layout:
 * Step 1: Category Selection (visual card buttons)
 * Step 2: Incident Sub-Category / Type Selection (visual card buttons)
 * Step 3: Fill Incident Details & Evidence Attachments
 */
function IncidentForm({ onSubmit, isSubmitting, uploadProgress, formFeedback, setFormFeedback, onBackToChoice }) {
  const fileInputRef = useRef(null);

  // Wizard step state: 1 = category, 2 = incident type, 3 = details & evidence form
  const [step, setStep]                 = useState(1);
  const [category, setCategory]         = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [location, setLocation]         = useState("");
  const [dateTime, setDateTime]         = useState("");
  const [description, setDescription]   = useState("");
  const [severity, setSeverity]         = useState("Medium");
  const [evidenceFiles, setEvidenceFiles] = useState([]);

  // ── Step Navigation Handlers ─────────────────────────────────────

  const handleCategoryClick = (catName) => {
    setCategory(catName);
    setIncidentType("");
    if (setFormFeedback) setFormFeedback({ type: "", message: "" });
    setStep(2);
  };

  const handleIncidentTypeClick = (typeName) => {
    setIncidentType(typeName);
    if (setFormFeedback) setFormFeedback({ type: "", message: "" });
    setStep(3);
  };

  const handleBackToCategories = () => {
    setCategory("");
    setIncidentType("");
    if (setFormFeedback) setFormFeedback({ type: "", message: "" });
    setStep(1);
  };

  const handleBackToIncidentTypes = () => {
    setIncidentType("");
    if (setFormFeedback) setFormFeedback({ type: "", message: "" });
    setStep(2);
  };

  // ── File Queue & Selection ───────────────────────────────────────

  const handleFileSelection = (e) => {
    const selected = Array.from(e.target.files);
    const valid = selected.filter((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        if (setFormFeedback) {
          setFormFeedback({ type: "error", message: `"${file.name}" exceeds the 10 MB limit and was skipped.` });
        }
        return false;
      }
      return true;
    });
    setEvidenceFiles((prev) => [...prev, ...valid]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    const valid = dropped.filter((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        if (setFormFeedback) {
          setFormFeedback({ type: "error", message: `"${file.name}" exceeds the 10 MB limit and was skipped.` });
        }
        return false;
      }
      return true;
    });
    setEvidenceFiles((prev) => [...prev, ...valid]);
  };

  const removeQueuedFile = (index) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Form Submission ──────────────────────────────────────────────

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !incidentType || !location || !dateTime || !description) {
      if (setFormFeedback) {
        setFormFeedback({ type: "error", message: "Please fill out all required fields before submitting." });
      }
      return;
    }

    const formData = { category, incidentType, location, dateTime, description, severity, files: evidenceFiles };

    onSubmit(formData, () => {
      setCategory(""); setIncidentType(""); setLocation("");
      setDateTime(""); setDescription(""); setSeverity("Medium");
      setEvidenceFiles([]);
      setStep(1);
    });
  };

  const activeCategoryMeta = CATEGORY_META[category];

  return (
    <div className="inc-wizard-wrap">

      {/* Feedback Banner */}
      {formFeedback?.message && (
        <div className={`um-alert um-alert--${formFeedback.type}`} role="alert" style={{ marginBottom: "20px" }}>
          <span className="material-symbols-outlined um-alert__icon">
            {formFeedback.type === "success" ? "check_circle" : formFeedback.type === "error" ? "error" : "info"}
          </span>
          <span>{formFeedback.message}</span>
        </div>
      )}

      <div className="mon-wizard">

        {/* ── STEP 1: Category Selection ── */}
        {step === 1 && (
          <div className="mon-step" key="step-1">
            {onBackToChoice && (
              <div className="mon-breadcrumb" style={{ marginBottom: "20px" }}>
                <button type="button" className="mon-breadcrumb__back" onClick={onBackToChoice}>
                  <span className="material-symbols-outlined">arrow_back</span>Back
                </button>
              </div>
            )}
            <div className="mon-step-label">
              <span className="mon-step-label__num">1</span>
              <span className="mon-step-label__text">Choose an Incident Category</span>
            </div>
            <div className="mon-step-grid">
              {Object.keys(INCIDENT_MAP).map((catName) => {
                const meta = CATEGORY_META[catName] || { icon: "category", color: "#00a35c", desc: "" };
                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => handleCategoryClick(catName)}
                    className="mon-step-card"
                    id={`inc-cat-${catName.replace(/\s+/g, "-").toLowerCase()}`}
                    aria-label={`Select ${catName}`}
                  >
                    <div className="mon-step-card__icon-wrap" style={{ color: meta.color }}>
                      <span className="material-symbols-outlined">{meta.icon}</span>
                    </div>
                    <p className="mon-step-card__title">{catName}</p>
                    <p className="mon-step-card__desc">{meta.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 2: Incident Sub-Category / Type Selection ── */}
        {step === 2 && category && (
          <div className="mon-step" key="step-2">
            {/* Breadcrumb trail */}
            <div className="mon-breadcrumb">
              <button
                type="button"
                className="mon-breadcrumb__back"
                onClick={handleBackToCategories}
                aria-label="Go back to category selection"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back
              </button>
              <span className="mon-breadcrumb__sep">
                <span className="material-symbols-outlined">chevron_right</span>
              </span>
              <span className="mon-breadcrumb__chip">
                <span className="material-symbols-outlined">{activeCategoryMeta?.icon || "category"}</span>
                {category}
              </span>
            </div>

            <div className="mon-step-label">
              <span className="mon-step-label__num">2</span>
              <span className="mon-step-label__text">Select Incident Sub-Category / Type</span>
            </div>

            <div className="mon-step-grid mon-step-grid--two">
              {INCIDENT_MAP[category]?.map((typeName) => {
                const meta = INCIDENT_TYPE_META[typeName] || { icon: "warning", desc: "Report this specific incident type." };
                return (
                  <button
                    key={typeName}
                    type="button"
                    onClick={() => handleIncidentTypeClick(typeName)}
                    className="mon-step-card"
                    id={`inc-type-${typeName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`}
                    aria-label={`Select ${typeName}`}
                  >
                    <div className="mon-step-card__icon-wrap">
                      <span className="material-symbols-outlined">{meta.icon}</span>
                    </div>
                    <p className="mon-step-card__title">{typeName}</p>
                    <p className="mon-step-card__desc">{meta.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 3: Incident Details & Evidence Upload ── */}
        {step === 3 && category && incidentType && (
          <div className="mon-step" key="step-3">
            {/* Breadcrumb trail */}
            <div className="mon-breadcrumb">
              <button
                type="button"
                className="mon-breadcrumb__back"
                onClick={handleBackToIncidentTypes}
                aria-label="Go back to incident type selection"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back
              </button>
              <span className="mon-breadcrumb__sep">
                <span className="material-symbols-outlined">chevron_right</span>
              </span>
              <button
                type="button"
                className="mon-breadcrumb__chip mon-breadcrumb__chip--muted"
                onClick={handleBackToCategories}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <span className="material-symbols-outlined">{activeCategoryMeta?.icon || "category"}</span>
                {category}
              </button>
              <span className="mon-breadcrumb__sep">
                <span className="material-symbols-outlined">chevron_right</span>
              </span>
              <span className="mon-breadcrumb__chip">
                <span className="material-symbols-outlined">
                  {INCIDENT_TYPE_META[incidentType]?.icon || "warning"}
                </span>
                {incidentType}
              </span>
            </div>

            <div className="mon-step-label">
              <span className="mon-step-label__num">3</span>
              <span className="mon-step-label__text">Fill Out Incident Details &amp; Evidence</span>
            </div>

            {/* Form card */}
            <form onSubmit={handleSubmit} className="inc-form-card card-base inc-form" noValidate>

              {/* ─── Section: Incident Details ─────────────────────────────── */}
              <div className="inc-form__section">
                <div className="inc-form__section-header">
                  <span className="material-symbols-outlined inc-form__section-icon">description</span>
                  <span className="inc-form__section-label">Incident Details</span>
                </div>

                <div className="inc-form__row inc-form__row--three">
                  {/* Location */}
                  <div className="inc-form__group">
                    <label className="inc-form__label" htmlFor="inc-location">
                      <span className="material-symbols-outlined inc-form__label-icon">location_on</span>
                      Location / Barangay <span className="inc-form__required">*</span>
                    </label>
                    <input
                      id="inc-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Brgy. San Isidro, Tayabas"
                      className="inc-form__input"
                      required
                    />
                  </div>

                  {/* Date and Time */}
                  <div className="inc-form__group">
                    <label className="inc-form__label" htmlFor="inc-datetime">
                      <span className="material-symbols-outlined inc-form__label-icon">calendar_today</span>
                      Date and Time <span className="inc-form__required">*</span>
                    </label>
                    <input
                      id="inc-datetime"
                      type="datetime-local"
                      value={dateTime}
                      onChange={(e) => setDateTime(e.target.value)}
                      className="inc-form__input"
                      required
                    />
                  </div>

                  {/* Severity */}
                  <div className="inc-form__group">
                    <label className="inc-form__label">
                      <span className="material-symbols-outlined inc-form__label-icon">warning</span>
                      Severity Level <span className="inc-form__required">*</span>
                    </label>
                    <div className="inc-form__severity-pills" role="radiogroup" aria-label="Severity level">
                      {SEVERITY_LEVELS.map((level) => (
                        <label
                          key={level}
                          className={`inc-severity-pill inc-severity-pill--${level.toLowerCase()}${severity === level ? " inc-severity-pill--active" : ""}`}
                        >
                          <input
                            type="radio"
                            name="inc-severity"
                            value={level}
                            checked={severity === level}
                            onChange={() => setSeverity(level)}
                            className="inc-severity-pill__radio"
                          />
                          {level}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description — full-width */}
                <div className="inc-form__group inc-form__group--full">
                  <label className="inc-form__label" htmlFor="inc-description">
                    <span className="material-symbols-outlined inc-form__label-icon">edit_note</span>
                    Detailed Description <span className="inc-form__required">*</span>
                  </label>
                  <textarea
                    id="inc-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the incident in full detail — what happened, who was involved, and any other relevant observations..."
                    className="inc-form__textarea"
                    rows={5}
                    maxLength={2000}
                    required
                  />
                  <span className="inc-form__char-count">{description.length} / 2000</span>
                </div>
              </div>

              {/* ─── Section: Evidence Uploads ─────────────────────────────── */}
              <div className="inc-form__section">
                <div className="inc-form__section-header">
                  <span className="material-symbols-outlined inc-form__section-icon">attach_file</span>
                  <span className="inc-form__section-label">Evidence Uploads <span className="inc-form__optional">(optional)</span></span>
                </div>

                <div
                  className="inc-form__dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload evidence files"
                >
                  <span className="material-symbols-outlined inc-form__dropzone-icon">cloud_upload</span>
                  <span className="inc-form__dropzone-text">
                    Drag &amp; drop files here or <strong>browse</strong>
                  </span>
                  <span className="inc-form__dropzone-hint">Images, PDFs, Videos — max 10 MB per file</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelection}
                    multiple
                    accept="image/*,application/pdf,video/*"
                    className="inc-form__file-input"
                  />
                </div>

                {evidenceFiles.length > 0 && (
                  <div className="inc-form__file-queue">
                    {evidenceFiles.map((file, idx) => (
                      <div key={idx} className="inc-form__file-item">
                        <span className="material-symbols-outlined inc-form__file-icon">
                          {file.type.startsWith("image/") ? "image" : file.type.includes("pdf") ? "picture_as_pdf" : "movie"}
                        </span>
                        <span className="inc-form__file-name" title={file.name}>{file.name}</span>
                        {isSubmitting ? (
                          <div className="inc-form__progress-bar-wrap">
                            <div className="inc-form__progress-bar-fill" style={{ width: `${uploadProgress[idx] || 0}%` }} />
                            <span className="inc-form__progress-pct">{uploadProgress[idx] || 0}%</span>
                          </div>
                        ) : (
                          <button type="button" onClick={() => removeQueuedFile(idx)} className="inc-form__remove-btn" aria-label={`Remove ${file.name}`}>
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ─── Submit Footer ────────────────────────────────────── */}
              <div className="inc-form__footer" style={{ position: "static", borderTop: "1px solid var(--c-hairline)", padding: "20px var(--sp-xxl) var(--sp-xxl) var(--sp-xxl)", background: "transparent", marginTop: "24px" }}>
                <span className="inc-form__footer-hint">
                  <span className="inc-form__required">*</span> Required fields
                </span>
                <button type="submit" disabled={isSubmitting} className="button-primary inc-form__submit-btn" id="inc-submit-btn">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {isSubmitting ? "hourglass_top" : "send"}
                  </span>
                  {isSubmitting ? "Submitting Report…" : "Submit Incident Report"}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

export default IncidentForm;

