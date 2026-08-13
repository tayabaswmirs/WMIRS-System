import { useState, useRef } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { CATEGORIES, SUBCATEGORY_META } from "../../../utils/monitoringConstants";
import { createMonitoringLog } from "../../../firebase/services/monitoringService";

import AvianTrackingForm from "./AvianTrackingForm";
import WildlifeObservationForm from "./WildlifeObservationForm";
import WaterMonitoringForm from "./WaterMonitoringForm";
import WaterConservationForm from "./WaterConservationForm";
import WasteTrackingForm from "./WasteTrackingForm";
import PlasticBanForm from "./PlasticBanForm";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function MonitoringFormContainer({ category, subcategory, onBack, onSubmitSuccess }) {
  const { currentUser, profileData } = useAuth();
  const fileInputRef = useRef(null);
  const [formFields, setFormFields] = useState({});
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const activeCategoryMeta = CATEGORIES.find((c) => c.id === category);

  const handleFieldChange = (key, value) => setFormFields((prev) => ({ ...prev, [key]: value }));

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        setFeedback({ type: "error", message: `"${file.name}" exceeds 10 MB limit.` });
        return false;
      }
      return true;
    });
    setEvidenceFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback({ type: "info", message: "Submitting monitoring log..." });

    const logPayload = {
      category, subcategory, ...formFields,
      reporter: {
        uid: currentUser.uid,
        name: profileData?.name || currentUser.displayName || "Staff Member",
        email: currentUser.email,
        role: profileData?.role || "user"
      }
    };

    try {
      await createMonitoringLog(logPayload, evidenceFiles, (fileIdx, pct) => {
        setUploadProgress((prev) => ({ ...prev, [fileIdx]: pct }));
      });
      setFeedback({ type: "success", message: "Monitoring log submitted successfully!" });
      setFormFields({});
      setEvidenceFiles([]);
      setUploadProgress({});
      onSubmitSuccess();
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "Failed to submit log. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mon-step">
      <div className="mon-breadcrumb">
        <button type="button" className="mon-breadcrumb__back" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back</span>Back
        </button>
        <span className="mon-breadcrumb__sep"><span className="material-symbols-outlined">chevron_right</span></span>
        <span className="mon-breadcrumb__chip mon-breadcrumb__chip--muted">
          <span className="material-symbols-outlined">{activeCategoryMeta?.icon}</span>{activeCategoryMeta?.label}
        </span>
        <span className="mon-breadcrumb__sep"><span className="material-symbols-outlined">chevron_right</span></span>
        <span className="mon-breadcrumb__chip">
          <span className="material-symbols-outlined">{SUBCATEGORY_META[subcategory]?.icon ?? "description"}</span>{subcategory}
        </span>
      </div>

      <div className="mon-step-label">
        <span className="mon-step-label__num">4</span>
        <span className="mon-step-label__text">Fill Out the Form &amp; Submit</span>
      </div>

      {feedback.message && (
        <div className={`um-alert um-alert--${feedback.type}`} role="alert" style={{ marginBottom: "20px" }}>
          <span className="material-symbols-outlined um-alert__icon">
            {feedback.type === "success" ? "check_circle" : feedback.type === "error" ? "error" : "info"}
          </span>
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="inc-form-card card-base inc-form" noValidate>
        <div className="inc-form__section">
          <div className="inc-form__section-header">
            <span className="material-symbols-outlined inc-form__section-icon">edit_note</span>
            <span className="inc-form__section-label">Log Fields: {subcategory}</span>
          </div>

          <div className="inc-form__row inc-form__row--two">
            {subcategory === "Avian Tracking Form" && <AvianTrackingForm formData={formFields} onChange={handleFieldChange} setFormData={setFormFields} />}
            {subcategory === "Wildlife Observations Form" && <WildlifeObservationForm formData={formFields} onChange={handleFieldChange} setFormData={setFormFields} />}
            {subcategory === "Local Water Source Monitoring Form" && <WaterMonitoringForm formData={formFields} onChange={handleFieldChange} />}
            {subcategory === "Ecosystem Conservation Log" && <WaterConservationForm formData={formFields} onChange={handleFieldChange} setFormData={setFormFields} />}
            {subcategory === "Waste Collection Tracking Form" && <WasteTrackingForm formData={formFields} onChange={handleFieldChange} setFormData={setFormFields} />}
            {subcategory === "Plastic Bag Ban Inspection Form" && <PlasticBanForm formData={formFields} onChange={handleFieldChange} setFormData={setFormFields} />}
          </div>
        </div>

        <div className="inc-form__section" style={{ borderTop: "1px solid var(--c-hairline)", paddingTop: "24px" }}>
          <div className="inc-form__section-header">
            <span className="material-symbols-outlined inc-form__section-icon">attach_file</span>
            <span className="inc-form__section-label">Media Evidence / Photos <span className="inc-form__optional">(optional)</span></span>
          </div>

          <div className="inc-form__dropzone" onClick={() => fileInputRef.current.click()} role="button" tabIndex={0}>
            <span className="material-symbols-outlined inc-form__dropzone-icon">cloud_upload</span>
            <span className="inc-form__dropzone-text">Drag &amp; drop files here or <strong>browse</strong></span>
            <span className="inc-form__dropzone-hint">Images only — max 10 MB per file</span>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="inc-form__file-input" />
          </div>

          {evidenceFiles.length > 0 && (
            <div className="inc-form__file-queue">
              {evidenceFiles.map((file, idx) => (
                <div key={idx} className="inc-form__file-item">
                  <span className="material-symbols-outlined inc-form__file-icon">image</span>
                  <span className="inc-form__file-name" title={file.name}>{file.name}</span>
                  {isSubmitting ? (
                    <div className="inc-form__progress-bar-wrap">
                      <div className="inc-form__progress-bar-fill" style={{ width: `${uploadProgress[idx] || 0}%` }} />
                      <span className="inc-form__progress-pct">{uploadProgress[idx] || 0}%</span>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setEvidenceFiles((prev) => prev.filter((_, i) => i !== idx))} className="inc-form__remove-btn">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="inc-form__footer" style={{ position: "static", borderTop: "1px solid var(--c-hairline)", padding: "20px var(--sp-xxl) var(--sp-xxl) var(--sp-xxl)", background: "transparent", marginTop: "24px" }}>
          <span className="inc-form__footer-hint"><span className="inc-form__required">*</span> Required fields</span>
          <button type="submit" disabled={isSubmitting} className="button-primary inc-form__submit-btn">
            <span className="material-symbols-outlined" aria-hidden="true">{isSubmitting ? "hourglass_top" : "send"}</span>
            {isSubmitting ? "Submitting Log..." : "Submit Monitoring Log"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MonitoringFormContainer;
