import { useState, useRef } from "react";
import { INCIDENT_MAP, SEVERITY_LEVELS, CATEGORY_META } from "../../utils/incidentConstants";

// Maximum allowed file size: 10 MB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * IncidentForm — redesigned single-page form with three clearly labeled sections:
 * 1. Incident Classification  (category + type)
 * 2. Incident Details         (location, date/time, severity, description)
 * 3. Evidence Uploads         (drag-and-drop with file queue)
 *
 * A sticky submit footer bar remains anchored at the bottom of the card.
 */
function IncidentForm({ onSubmit, isSubmitting, uploadProgress, formFeedback, setFormFeedback }) {
  const fileInputRef = useRef(null);

  const [category, setCategory]         = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [location, setLocation]         = useState("");
  const [dateTime, setDateTime]         = useState("");
  const [description, setDescription]   = useState("");
  const [severity, setSeverity]         = useState("Medium");
  const [evidenceFiles, setEvidenceFiles] = useState([]);

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setCategory(cat);
    // Auto-select the first incident type for the chosen category
    setIncidentType(cat ? INCIDENT_MAP[cat][0] : "");
  };

  const handleFileSelection = (e) => {
    const selected = Array.from(e.target.files);
    const valid = selected.filter((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFormFeedback({ type: "error", message: `"${file.name}" exceeds the 10 MB limit and was skipped.` });
        return false;
      }
      return true;
    });
    setEvidenceFiles((prev) => [...prev, ...valid]);
    // Reset the input so the same file can be re-added after removal
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    const valid = dropped.filter((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFormFeedback({ type: "error", message: `"${file.name}" exceeds the 10 MB limit and was skipped.` });
        return false;
      }
      return true;
    });
    setEvidenceFiles((prev) => [...prev, ...valid]);
  };

  const removeQueuedFile = (index) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !incidentType || !location || !dateTime || !description) {
      setFormFeedback({ type: "error", message: "Please fill out all required fields before submitting." });
      return;
    }

    const formData = { category, incidentType, location, dateTime, description, severity, files: evidenceFiles };

    onSubmit(formData, () => {
      setCategory(""); setIncidentType(""); setLocation("");
      setDateTime(""); setDescription(""); setSeverity("Medium");
      setEvidenceFiles([]);
    });
  };

  const catMeta = CATEGORY_META[category];

  return (
    <div className="inc-form-card card-base">

      {/* Feedback Banner */}
      {formFeedback.message && (
        <div className={`inc-form-alert inc-form-alert--${formFeedback.type}`} role="alert">
          <span className="material-symbols-outlined inc-form-alert__icon">
            {formFeedback.type === "success" ? "check_circle" : formFeedback.type === "error" ? "error" : "info"}
          </span>
          {formFeedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="inc-form" noValidate>

        {/* ─── Section 1: Incident Classification ──────────────────────── */}
        <div className="inc-form__section">
          <div className="inc-form__section-header">
            <span className="material-symbols-outlined inc-form__section-icon">category</span>
            <span className="inc-form__section-label">Incident Classification</span>
          </div>

          <div className="inc-form__row inc-form__row--two">
            {/* Category Selector */}
            <div className="inc-form__group">
              <label className="inc-form__label" htmlFor="inc-category">
                Category or Section <span className="inc-form__required">*</span>
              </label>
              <div className="inc-form__select-wrap">
                {catMeta && (
                  <span
                    className="material-symbols-outlined inc-form__select-icon"
                    style={{ color: catMeta.color }}
                    aria-hidden="true"
                  >
                    {catMeta.icon}
                  </span>
                )}
                <select
                  id="inc-category"
                  value={category}
                  onChange={handleCategoryChange}
                  className="inc-form__select"
                  required
                >
                  <option value="">— Select Category —</option>
                  {Object.keys(INCIDENT_MAP).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Incident Type — disabled until a category is chosen */}
            <div className="inc-form__group">
              <label className="inc-form__label" htmlFor="inc-type">
                Incident Type <span className="inc-form__required">*</span>
              </label>
              <div className="inc-form__select-wrap">
                <select
                  id="inc-type"
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="inc-form__select"
                  disabled={!category}
                  required
                >
                  <option value="">— Select Type —</option>
                  {category && INCIDENT_MAP[category].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Section 2: Incident Details ─────────────────────────────── */}
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
              <label className="inc-form__label" htmlFor="inc-severity">
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

        {/* ─── Section 3: Evidence Uploads ─────────────────────────────── */}
        <div className="inc-form__section">
          <div className="inc-form__section-header">
            <span className="material-symbols-outlined inc-form__section-icon">attach_file</span>
            <span className="inc-form__section-label">Evidence Uploads <span className="inc-form__optional">(optional)</span></span>
          </div>

          <div
            className="inc-form__dropzone"
            onClick={() => fileInputRef.current.click()}
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

        {/* ─── Sticky Submit Footer ────────────────────────────────────── */}
        <div className="inc-form__footer">
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
  );
}

export default IncidentForm;
