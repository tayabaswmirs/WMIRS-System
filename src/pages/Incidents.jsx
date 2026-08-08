import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { createIncidentReport } from "../firebase/services/incidentService";
import DashboardLayout from "../components/layout/DashboardLayout";
import IncidentForm from "../components/common/IncidentForm";
import "../styles/dashboard.css";

function Incidents() {
  const { currentUser, profileData } = useAuth();

  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [formFeedback, setFormFeedback]     = useState({ type: "", message: "" });

  const handleFormSubmit = async (formData, onSuccess) => {
    setIsSubmitting(true);
    setFormFeedback({ type: "info", message: "Uploading evidence and submitting your report…" });
    setUploadProgress({});

    const incidentData = {
      category:     formData.category,
      incidentType: formData.incidentType,
      location:     formData.location,
      dateTime:     formData.dateTime,
      description:  formData.description,
      severity:     formData.severity,
      reporter: {
        uid:   currentUser.uid,
        name:  profileData?.name || currentUser.displayName || "Unknown User",
        email: currentUser.email,
        role:  profileData?.role || "user",
      },
    };

    try {
      await createIncidentReport(incidentData, formData.files, (fileIdx, progress) => {
        setUploadProgress((prev) => ({ ...prev, [fileIdx]: progress }));
      });
      setFormFeedback({ type: "success", message: "Incident successfully reported!" });
      onSuccess();
    } catch (err) {
      console.error("Incident submission failed:", err);
      setFormFeedback({ type: "error", message: "Failed to submit the incident. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="incidents-page">

        {/* ── Hero Header Band ─────────────────────────────────────────── */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">ENRO Staff Portal</span>
            <h1 className="inc-hero__title">Submit Incident Report</h1>
            <p className="inc-hero__subtitle">
              Report environmental incidents, illegal forest activities, and ecological violations.
            </p>
          </div>
        </div>

        {/* ── Report New Incident Form ──────────────────────────────────── */}
        <IncidentForm
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          uploadProgress={uploadProgress}
          formFeedback={formFeedback}
          setFormFeedback={setFormFeedback}
        />
      </div>
    </DashboardLayout>
  );
}

export default Incidents;
