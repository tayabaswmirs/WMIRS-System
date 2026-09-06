import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { createIncidentReport } from "../firebase/services/incidentService";
import { compressImage } from "../utils/imageCompressor";
import { saveToOutbox } from "../services/outboxDb";
import DashboardLayout from "../components/layout/DashboardLayout";
import SubmitChoice from "../components/common/SubmitChoice";
import IncidentForm from "../components/common/IncidentForm";
import MonitoringWizard from "../components/common/monitoring/MonitoringWizard";
import "../styles/dashboard.css";

/**
 * SubmitDashboard — Main routing view page that combines submit incident
 * and submit monitoring workflows into a single multi-step wizard.
 */
function SubmitDashboard() {
  const { currentUser, profileData } = useAuth();
  const [submissionType, setSubmissionType] = useState(""); // "incident" | "monitoring" | ""
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [formFeedback, setFormFeedback] = useState({ type: "", message: "" });

  const handleChoiceSelect = (type) => {
    setSubmissionType(type);
    setFormFeedback({ type: "", message: "" });
  };

  const handleBackToChoice = () => {
    setSubmissionType("");
    setFormFeedback({ type: "", message: "" });
  };

  const handleIncidentSubmit = async (formData, onSuccess) => {
    setIsSubmitting(true);
    setFormFeedback({ type: "info", message: "Uploading evidence and submitting your report…" });
    setUploadProgress({});

    const incidentData = {
      category: formData.category,
      incidentType: formData.incidentType,
      location: formData.location,
      dateTime: formData.dateTime,
      description: formData.description,
      severity: formData.severity,
      reporter: {
        uid: currentUser.uid,
        name: profileData?.name || currentUser.displayName || "Unknown User",
        email: currentUser.email,
        role: profileData?.role || "user",
      },
    };

    // Handle offline submission directly via local Outbox
    if (!navigator.onLine) {
      try {
        setFormFeedback({ type: "info", message: "Compressing photos for offline storage..." });
        const compressedFiles = await Promise.all(
          (formData.files || []).map(async (file) => {
            const res = await compressImage(file);
            return { name: res.name, type: res.type, blob: res.blob };
          })
        );

        await saveToOutbox({
          logType: "Incident",
          data: incidentData,
          files: compressedFiles,
          uid: currentUser.uid,
        });

        setFormFeedback({
          type: "success",
          message: "Report saved to local Outbox! It will automatically sync when connection returns."
        });
        onSuccess();
        return;
      } catch (offlineErr) {
        console.error("Failed to save to outbox:", offlineErr);
        setFormFeedback({ type: "error", message: "Failed to queue report offline. Please try again." });
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    try {
      await createIncidentReport(incidentData, formData.files, (fileIdx, progress) => {
        setUploadProgress((prev) => ({ ...prev, [fileIdx]: progress }));
      });
      setFormFeedback({ type: "success", message: "Incident successfully reported!" });
      onSuccess();
    } catch (err) {
      console.error("Incident submission failed:", err);
      // Fallback: If network failed mid-submission, offer or attempt outbox save
      try {
        const compressedFiles = await Promise.all(
          (formData.files || []).map(async (file) => {
            const res = await compressImage(file);
            return { name: res.name, type: res.type, blob: res.blob };
          })
        );
        await saveToOutbox({
          logType: "Incident",
          data: incidentData,
          files: compressedFiles,
          uid: currentUser.uid,
        });
        setFormFeedback({
          type: "success",
          message: "Network dropped during upload. Report was safely saved to your Outbox!"
        });
        onSuccess();
      } catch {
        setFormFeedback({ type: "error", message: "Failed to submit the incident. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="incidents-page">
        {/* Page Hero Header */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">ENRO Staff Portal</span>
            <h1 className="inc-hero__title">
              {submissionType === "incident"
                ? "Submit Incident Report"
                : submissionType === "monitoring"
                ? "Submit Monitoring Log"
                : "Submit Report"}
            </h1>
            <p className="inc-hero__subtitle">
              {submissionType === "incident"
                ? "Report environmental incidents, illegal forest activities, and ecological violations."
                : submissionType === "monitoring"
                ? "Log routine ecological surveying, wildlife observations, water resource checks, and compliance audits."
                : "File an immediate environmental incident report or log a scheduled ecological monitoring survey."}
            </p>
          </div>
        </div>

        {/* Wizard content */}
        {submissionType === "" && <SubmitChoice onSelect={handleChoiceSelect} />}

        {submissionType === "incident" && (
          <IncidentForm
            onSubmit={handleIncidentSubmit}
            isSubmitting={isSubmitting}
            uploadProgress={uploadProgress}
            formFeedback={formFeedback}
            setFormFeedback={setFormFeedback}
            onBackToChoice={handleBackToChoice}
          />
        )}

        {submissionType === "monitoring" && (
          <MonitoringWizard onBackToChoice={handleBackToChoice} />
        )}
      </div>
    </DashboardLayout>
  );
}

export default SubmitDashboard;
