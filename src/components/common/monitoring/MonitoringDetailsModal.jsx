import { useState } from "react";
import { formatLogDate, getStatusClass } from "../../../utils/monitoringUtils";

const CATEGORY_MAP = {
  "BMS":        { icon: "forest",        color: "#00b545", label: "Biodiversity" },
  "Water":      { icon: "water",         color: "#3d4f9f", label: "Water Resource" },
  "Compliance": { icon: "verified_user", color: "#fa6e39", label: "Compliance" }
};

function MonitoringDetailsModal({ log, onClose, isAdmin = false, onStatusChange }) {
  const isOpen = Boolean(log);

  return (
    <>
      <div
        className={`inc-drawer-backdrop${isOpen ? " inc-drawer-backdrop--visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`inc-drawer${isOpen ? " inc-drawer--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mon-drawer-title"
        aria-hidden={!isOpen}
      >
        {isOpen && log && (
          <DrawerContent
            log={log}
            onClose={onClose}
            isAdmin={isAdmin}
            onStatusChange={onStatusChange}
          />
        )}
      </aside>
    </>
  );
}

function DrawerContent({ log, onClose, isAdmin, onStatusChange }) {
  const catMeta = CATEGORY_MAP[log.category] ?? { icon: "report", color: "#00ed64", label: log.category };
  
  const [draftStatus, setDraftStatus]   = useState(log.status);
  const [adminRemarks, setAdminRemarks] = useState(log.adminRemarks || "");
  const [saving, setSaving]             = useState(false);
  const [saveFeedback, setSaveFeedback] = useState({ type: "", message: "" });

  const isLocked = log.status === "Approved" || log.status === "Rejected/Flagged";

  const handleStatusSave = async () => {
    setSaving(true);
    setSaveFeedback({ type: "", message: "" });
    try {
      await onStatusChange(log.id, draftStatus, adminRemarks);
      setSaveFeedback({ type: "success", message: "Verification status saved." });
    } catch (err) {
      console.error(err);
      setSaveFeedback({ type: "error", message: "Failed to update status." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="inc-drawer__header" style={{ borderLeftColor: catMeta.color }}>
        <div className="inc-drawer__header-left">
          <div className="inc-drawer__cat-icon-wrap" style={{ backgroundColor: `${catMeta.color}22` }}>
            <span
              className="material-symbols-outlined inc-drawer__cat-icon"
              style={{ color: catMeta.color }}
              aria-hidden="true"
            >
              {catMeta.icon}
            </span>
          </div>
          <div>
            <span className="inc-drawer__eyebrow">{catMeta.label} Monitoring</span>
            <h2 id="mon-drawer-title" className="inc-drawer__title">{log.subcategory}</h2>
          </div>
        </div>
        <button
          className="inc-drawer__close-btn"
          onClick={onClose}
          aria-label="Close details panel"
          type="button"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Badge Row */}
      <div className="inc-drawer__badge-row">
        <span className={`status-badge ${getStatusClass(log.status)}`}>
          {log.status}
        </span>
      </div>

      {/* Body */}
      <div className="inc-drawer__body">
        {/* Reporter info */}
        <div className="inc-drawer__meta-grid">
          <MetaCell label="Reported By" icon="person" value={`${log.reporter?.name ?? "Unknown"} (${log.reporter?.email ?? ""})`} />
          <MetaCell label="Date Logged" icon="calendar_today" value={formatLogDate(log.createdAt)} />
        </div>

        {/* Specific Form Fields */}
        <div className="inc-drawer__desc-section" style={{ borderBottom: "1px solid var(--c-hairline)", paddingBottom: "16px" }}>
          <span className="inc-drawer__section-label">
            <span className="material-symbols-outlined inc-drawer__section-label-icon">assignment</span>
            Observation Details
          </span>
          <LogSpecificDetails log={log} />
        </div>

        {/* Evidence Attachments */}
        <div className="inc-drawer__evidence-section">
          <span className="inc-drawer__section-label">
            <span className="material-symbols-outlined inc-drawer__section-label-icon">attach_file</span>
            Attached Photos / Evidence ({log.evidence?.length ?? 0})
          </span>
          {(!log.evidence || log.evidence.length === 0) ? (
            <p className="inc-drawer__evidence-empty">No files attached to this log.</p>
          ) : (
            <div className="inc-drawer__evidence-gallery">
              {log.evidence.map((file, idx) => {
                const isImage = file.type?.startsWith("image/");
                return (
                  <a
                    key={idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inc-drawer__evidence-tile"
                    title={file.name}
                  >
                    {isImage ? (
                      <img src={file.url} alt={file.name} className="inc-drawer__evidence-img" />
                    ) : (
                      <div className="inc-drawer__evidence-icon-tile">
                        <span className="material-symbols-outlined inc-drawer__evidence-icon">
                          insert_drive_file
                        </span>
                      </div>
                    )}
                    <span className="inc-drawer__evidence-filename">{file.name}</span>
                    <span className="inc-drawer__evidence-open">
                      <span className="material-symbols-outlined">open_in_new</span>
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Admin remarks display for staff */}
        {!isAdmin && log.adminRemarks && (
          <div className="inc-drawer__desc-section" style={{ marginTop: "16px", background: "var(--c-surface-soft)", padding: "12px", borderRadius: "var(--r-md)" }}>
            <span className="inc-drawer__section-label" style={{ color: "var(--c-green-dark)" }}>
              <span className="material-symbols-outlined inc-drawer__section-label-icon">comment</span>
              Admin Feedback / Remarks
            </span>
            <p className="inc-drawer__desc-text" style={{ fontStyle: "italic" }}>{log.adminRemarks}</p>
          </div>
        )}

        {/* Admin Audit Control Panel */}
        {isAdmin && (
          <div className="inc-drawer__admin-panel">
            <span className="inc-drawer__section-label">
              <span className="material-symbols-outlined inc-drawer__section-label-icon">
                {isLocked ? "lock" : "admin_panel_settings"}
              </span>
              Admin Verification Audit
            </span>

            {isLocked ? (
              <div className="inc-drawer__admin-locked-banner" style={{ background: "rgba(0, 104, 74, 0.08)", borderColor: "rgba(0, 104, 74, 0.15)", color: "var(--c-green-dark)" }}>
                <span className="material-symbols-outlined" aria-hidden="true">lock</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: "600" }}>Log Audited — {log.status}</p>
                  {log.adminRemarks && (
                    <p style={{ margin: "4px 0 0", fontSize: "13px", fontStyle: "italic", opacity: 0.8 }}>
                      Remarks: "{log.adminRemarks}"
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label className="inc-form__label" htmlFor="mon-admin-status" style={{ fontSize: "12px", marginBottom: "4px" }}>
                    Select Verification Status
                  </label>
                  <select
                    id="mon-admin-status"
                    value={draftStatus}
                    onChange={(e) => {
                      setDraftStatus(e.target.value);
                      setSaveFeedback({ type: "", message: "" });
                    }}
                    className={`admin-status-select admin-status-select--${getStatusClass(draftStatus)}`}
                    style={{ width: "100%", height: "38px" }}
                    disabled={saving}
                  >
                    {["Submitted", "Under Review", "Approved", "Rejected/Flagged"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="inc-form__label" htmlFor="mon-admin-remarks" style={{ fontSize: "12px", marginBottom: "4px" }}>
                    Admin Audit Notes / Remarks
                  </label>
                  <textarea
                    id="mon-admin-remarks"
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    placeholder="Provide compliance review notes, corrections required, or verification comments..."
                    className="inc-form__textarea"
                    rows={3}
                    style={{ fontSize: "13px" }}
                    disabled={saving}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleStatusSave}
                  disabled={saving || (draftStatus === log.status && adminRemarks === (log.adminRemarks || ""))}
                  className="button-primary inc-drawer__admin-save-btn"
                  id="mon-drawer-admin-save-btn"
                  style={{ width: "100%" }}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {saving ? "hourglass_top" : "check_circle"}
                  </span>
                  {saving ? "Saving Review..." : "Submit Verification Review"}
                </button>

                {saveFeedback.message && (
                  <p className={`inc-drawer__admin-feedback inc-drawer__admin-feedback--${saveFeedback.type}`}>
                    {saveFeedback.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function LogSpecificDetails({ log }) {
  switch (log.subcategory) {
    case "Avian Tracking Form":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <DetailRow label="Observation Date & Time" value={log.dateTime} />
          <DetailRow label="Location" value={log.stationId} />
          <DetailRow label="Avian Species" value={log.avianSpecies} />
          <DetailRow label="Count / Sighted" value={log.count} />
          <DetailRow label="Observed Activities" value={log.activities?.join(", ") || "None"} />
        </div>
      );
    case "Wildlife Observations Form":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <DetailRow label="Classification" value={log.classification} />
          <DetailRow label="Species Name" value={log.speciesName} />
          <DetailRow label="Quantity Sighted" value={log.quantity} />
          <DetailRow label="Habitat Condition Notes" value={log.habitatNotes} isParagraph />
        </div>
      );
    case "Local Water Source Monitoring Form":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <DetailRow label="Water Body Identifier" value={log.waterBody} />
          <DetailRow label="Specific Location Marker" value={log.locationMarker} />
          <DetailRow label="Physical Condition Log" value={log.physicalCondition} isParagraph />
        </div>
      );
    case "Ecosystem Conservation Log":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <DetailRow label="Pollution Risk Indicators" value={log.pollutionIndicators?.join(", ") || "None"} />
          <DetailRow label="Observed Aquatic Wildlife Activity" value={log.aquaticWildlifeNotes} isParagraph />
        </div>
      );
    case "Waste Collection Tracking Form":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <DetailRow label="Barangay / Route" value={log.barangay} />
          <DetailRow label="Collection Type" value={log.collectionType} />
          <DetailRow label="Volume Metric Estimate" value={`${log.volumeValue || 0} ${log.volumeUnit || ""}`} />
          <DetailRow label="Operational Issues" value={log.operationalIssues} isParagraph />
        </div>
      );
    case "Plastic Bag Ban Inspection Form":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <DetailRow label="Establishment Name" value={log.establishmentName} />
          <DetailRow label="Business Type" value={log.businessType} />
          <DetailRow label="Compliance Status" value={log.compliant ? "Compliant" : "Non-Compliant"} />
          {!log.compliant && (
            <>
              <DetailRow label="Infraction Details" value={log.infractionDetails} isParagraph />
              <DetailRow label="Action Token Issued" value={log.actionToken} />
            </>
          )}
        </div>
      );
    default:
      return <p>Unknown subcategory form details.</p>;
  }
}

function DetailRow({ label, value, isParagraph = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--c-steel)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </span>
      {isParagraph ? (
        <p style={{ fontSize: "14px", color: "var(--c-ink)", margin: 0, whiteSpace: "pre-line", lineHeight: "1.5" }}>
          {value || "—"}
        </p>
      ) : (
        <span style={{ fontSize: "14px", color: "var(--c-ink)", fontWeight: "500" }}>
          {value || "—"}
        </span>
      )}
    </div>
  );
}

function MetaCell({ label, icon, value }) {
  return (
    <div className="inc-drawer__meta-cell">
      <span className="inc-drawer__meta-label">
        <span className="material-symbols-outlined inc-drawer__meta-label-icon">{icon}</span>
        {label}
      </span>
      <span className="inc-drawer__meta-val">{value || "—"}</span>
    </div>
  );
}

export default MonitoringDetailsModal;
