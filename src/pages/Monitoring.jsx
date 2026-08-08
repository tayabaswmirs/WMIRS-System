import { useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { createMonitoringLog } from "../firebase/services/monitoringService";
import DashboardLayout from "../components/layout/DashboardLayout";
import AvianTrackingForm from "../components/common/monitoring/AvianTrackingForm";
import WildlifeObservationForm from "../components/common/monitoring/WildlifeObservationForm";
import WaterMonitoringForm from "../components/common/monitoring/WaterMonitoringForm";
import WaterConservationForm from "../components/common/monitoring/WaterConservationForm";
import WasteTrackingForm from "../components/common/monitoring/WasteTrackingForm";
import PlasticBanForm from "../components/common/monitoring/PlasticBanForm";

const CATEGORIES = [
  {
    id: "BMS",
    icon: "forest",
    label: "Biodiversity Monitoring",
    desc: "Avian surveys and general protected fauna tracking."
  },
  {
    id: "Water",
    icon: "water",
    label: "Water Resource",
    desc: "Routine aquatic condition logs and water pollution risk markers."
  },
  {
    id: "Compliance",
    icon: "verified_user",
    label: "Compliance Audits",
    desc: "Waste collection tracking and plastic bag ban audits."
  }
];

const SUBCATEGORY_META = {
  "Avian Tracking Form": {
    icon: "flutter",
    desc: "Systematic bird census data along transect lines."
  },
  "Wildlife Observations Form": {
    icon: "cruelty_free",
    desc: "Non-avian fauna sightings and habitat condition notes."
  },
  "Local Water Source Monitoring Form": {
    icon: "water_drop",
    desc: "Aquatic condition logs for local water bodies."
  },
  "Ecosystem Conservation Log": {
    icon: "eco",
    desc: "Pollution risk indicators and aquatic wildlife activity."
  },
  "Waste Collection Tracking Form": {
    icon: "delete_sweep",
    desc: "Waste volume and collection route tracking by barangay."
  },
  "Plastic Bag Ban Inspection Form": {
    icon: "block",
    desc: "Establishment compliance checks for the plastic bag ban."
  }
};

const SUBCATEGORIES = {
  BMS: ["Avian Tracking Form", "Wildlife Observations Form"],
  Water: ["Local Water Source Monitoring Form", "Ecosystem Conservation Log"],
  Compliance: ["Waste Collection Tracking Form", "Plastic Bag Ban Inspection Form"]
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function Monitoring() {
  const { currentUser, profileData } = useAuth();
  const fileInputRef = useRef(null);

  // Wizard step state: 1 = category, 2 = subcategory, 3 = form
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [formFields, setFormFields] = useState({});
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // ── Navigation handlers ──────────────────────────────────────

  const handleCategoryClick = (catId) => {
    setCategory(catId);
    setSubcategory("");
    setFormFields({});
    setFeedback({ type: "", message: "" });
    setStep(2);
  };

  const handleSubcategoryClick = (subName) => {
    setSubcategory(subName);
    setFormFields({});
    setFeedback({ type: "", message: "" });
    setStep(3);
  };

  const handleBackToCategories = () => {
    setCategory("");
    setSubcategory("");
    setFormFields({});
    setEvidenceFiles([]);
    setFeedback({ type: "", message: "" });
    setStep(1);
  };

  const handleBackToSubcategories = () => {
    setSubcategory("");
    setFormFields({});
    setEvidenceFiles([]);
    setFeedback({ type: "", message: "" });
    setStep(2);
  };

  // ── File & form handlers ─────────────────────────────────────

  const handleFieldChange = (key, value) => {
    setFormFields((prev) => ({ ...prev, [key]: value }));
  };

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
    if (!category || !subcategory) {
      setFeedback({ type: "error", message: "Please select a category and form type." });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: "info", message: "Submitting monitoring log..." });

    const logPayload = {
      category,
      subcategory,
      ...formFields,
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
      // Reset wizard after successful submission
      setSubcategory("");
      setFormFields({});
      setEvidenceFiles([]);
      setUploadProgress({});
      setStep(2);
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "Failed to submit log. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived helpers ──────────────────────────────────────────

  const activeCategoryMeta = CATEGORIES.find((c) => c.id === category);

  // ── Render ───────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="um-page">
        {/* ── Hero Header Band ─────────────────────────────────────────── */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">ENRO Staff Portal</span>
            <h1 className="inc-hero__title">Submit Monitoring Log</h1>
            <p className="inc-hero__subtitle">
              Log routine ecological surveying, wildlife observations, water resource checks, and compliance audits.
            </p>
          </div>
        </div>

        {/* Alert feedback banner */}
        {feedback.message && (
          <div className={`inc-form-alert inc-form-alert--${feedback.type}`} role="alert">
            <span className="material-symbols-outlined inc-form-alert__icon">
              {feedback.type === "success"
                ? "check_circle"
                : feedback.type === "error"
                ? "error"
                : "info"}
            </span>
            {feedback.message}
          </div>
        )}

        <div className="mon-wizard">

          {/* ── STEP 1: Category Selection ── */}
          {step === 1 && (
            <div className="mon-step" key="step-1">
              <div className="mon-step-label">
                <span className="mon-step-label__num">1</span>
                <span className="mon-step-label__text">Choose a Monitoring Category</span>
              </div>
              <div className="mon-step-grid">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.id)}
                    className="mon-step-card"
                    id={`mon-cat-${cat.id}`}
                    aria-label={`Select ${cat.label}`}
                  >
                    <div className="mon-step-card__icon-wrap">
                      <span className="material-symbols-outlined">{cat.icon}</span>
                    </div>
                    <p className="mon-step-card__title">{cat.label}</p>
                    <p className="mon-step-card__desc">{cat.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Subcategory Selection ── */}
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
                  <span className="material-symbols-outlined">{activeCategoryMeta?.icon}</span>
                  {activeCategoryMeta?.label}
                </span>
              </div>

              <div className="mon-step-label">
                <span className="mon-step-label__num">2</span>
                <span className="mon-step-label__text">Choose a Form Type</span>
              </div>

              <div className="mon-step-grid mon-step-grid--two">
                {SUBCATEGORIES[category].map((sub) => {
                  const meta = SUBCATEGORY_META[sub];
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => handleSubcategoryClick(sub)}
                      className="mon-step-card"
                      id={`mon-sub-${sub.replace(/\s+/g, "-")}`}
                      aria-label={`Select ${sub}`}
                    >
                      <div className="mon-step-card__icon-wrap">
                        <span className="material-symbols-outlined">{meta?.icon ?? "description"}</span>
                      </div>
                      <p className="mon-step-card__title">{sub}</p>
                      <p className="mon-step-card__desc">{meta?.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 3: Form ── */}
          {step === 3 && category && subcategory && (
            <div className="mon-step" key="step-3">
              {/* Breadcrumb trail */}
              <div className="mon-breadcrumb">
                <button
                  type="button"
                  className="mon-breadcrumb__back"
                  onClick={handleBackToSubcategories}
                  aria-label="Go back to form type selection"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Back
                </button>
                <span className="mon-breadcrumb__sep">
                  <span className="material-symbols-outlined">chevron_right</span>
                </span>
                <span className="mon-breadcrumb__chip mon-breadcrumb__chip--muted">
                  <span className="material-symbols-outlined">{activeCategoryMeta?.icon}</span>
                  {activeCategoryMeta?.label}
                </span>
                <span className="mon-breadcrumb__sep">
                  <span className="material-symbols-outlined">chevron_right</span>
                </span>
                <span className="mon-breadcrumb__chip">
                  <span className="material-symbols-outlined">
                    {SUBCATEGORY_META[subcategory]?.icon ?? "description"}
                  </span>
                  {subcategory}
                </span>
              </div>

              <div className="mon-step-label">
                <span className="mon-step-label__num">3</span>
                <span className="mon-step-label__text">Fill Out the Form &amp; Submit</span>
              </div>

              {/* Form card */}
              <form
                onSubmit={handleSubmit}
                className="inc-form-card card-base inc-form"
                noValidate
              >
                <div className="inc-form__section">
                  <div className="inc-form__section-header">
                    <span className="material-symbols-outlined inc-form__section-icon">edit_note</span>
                    <span className="inc-form__section-label">Log Fields: {subcategory}</span>
                  </div>

                  <div className="inc-form__row inc-form__row--two">
                    {subcategory === "Avian Tracking Form" && (
                      <AvianTrackingForm
                        formData={formFields}
                        onChange={handleFieldChange}
                        setFormData={setFormFields}
                      />
                    )}
                    {subcategory === "Wildlife Observations Form" && (
                      <WildlifeObservationForm
                        formData={formFields}
                        onChange={handleFieldChange}
                        setFormData={setFormFields}
                      />
                    )}
                    {subcategory === "Local Water Source Monitoring Form" && (
                      <WaterMonitoringForm formData={formFields} onChange={handleFieldChange} />
                    )}
                    {subcategory === "Ecosystem Conservation Log" && (
                      <WaterConservationForm
                        formData={formFields}
                        onChange={handleFieldChange}
                        setFormData={setFormFields}
                      />
                    )}
                    {subcategory === "Waste Collection Tracking Form" && (
                      <WasteTrackingForm
                        formData={formFields}
                        onChange={handleFieldChange}
                        setFormData={setFormFields}
                      />
                    )}
                    {subcategory === "Plastic Bag Ban Inspection Form" && (
                      <PlasticBanForm
                        formData={formFields}
                        onChange={handleFieldChange}
                        setFormData={setFormFields}
                      />
                    )}
                  </div>
                </div>

                {/* Evidence Attachments Upload Area */}
                <div
                  className="inc-form__section"
                  style={{ borderTop: "1px solid var(--c-hairline)", paddingTop: "24px" }}
                >
                  <div className="inc-form__section-header">
                    <span className="material-symbols-outlined inc-form__section-icon">attach_file</span>
                    <span className="inc-form__section-label">
                      Media Evidence / Photos{" "}
                      <span className="inc-form__optional">(optional)</span>
                    </span>
                  </div>

                  <div
                    className="inc-form__dropzone"
                    onClick={() => fileInputRef.current.click()}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload evidence files"
                  >
                    <span className="material-symbols-outlined inc-form__dropzone-icon">
                      cloud_upload
                    </span>
                    <span className="inc-form__dropzone-text">
                      Drag &amp; drop files here or <strong>browse</strong>
                    </span>
                    <span className="inc-form__dropzone-hint">Images only — max 10 MB per file</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      accept="image/*"
                      className="inc-form__file-input"
                    />
                  </div>

                  {evidenceFiles.length > 0 && (
                    <div className="inc-form__file-queue">
                      {evidenceFiles.map((file, idx) => (
                        <div key={idx} className="inc-form__file-item">
                          <span className="material-symbols-outlined inc-form__file-icon">image</span>
                          <span className="inc-form__file-name" title={file.name}>
                            {file.name}
                          </span>
                          {isSubmitting ? (
                            <div className="inc-form__progress-bar-wrap">
                              <div
                                className="inc-form__progress-bar-fill"
                                style={{ width: `${uploadProgress[idx] || 0}%` }}
                              />
                              <span className="inc-form__progress-pct">
                                {uploadProgress[idx] || 0}%
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setEvidenceFiles((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="inc-form__remove-btn"
                            >
                              <span className="material-symbols-outlined">close</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sticky Submission Footer */}
                <div
                  className="inc-form__footer"
                  style={{ position: "static", border: "none", padding: "16px 0 0 0" }}
                >
                  <span className="inc-form__footer-hint">
                    <span className="inc-form__required">*</span> Required fields
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="button-primary inc-form__submit-btn"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {isSubmitting ? "hourglass_top" : "send"}
                    </span>
                    {isSubmitting ? "Submitting Log..." : "Submit Monitoring Log"}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}

export default Monitoring;
