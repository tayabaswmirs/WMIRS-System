import { useState } from "react";
import { CATEGORY_META, ADMIN_STATUSES, getSeverityClass, getStatusClass, formatIncidentDate } from "../../utils/incidentConstants";

/**
 * IncidentDetailsModal — right-side sliding drawer showing full incident metadata,
 * description, and evidence gallery.
 *
 * Props:
 *   incident       {object|null} — incident to display; drawer is hidden when null
 *   onClose        {function}    — called when the user closes the drawer
 *   isAdmin        {boolean}     — when true, renders the admin status-update panel
 *   onStatusChange {function}    — (incidentId, newStatus) called when admin updates status
 */
function IncidentDetailsModal({ incident, onClose, isAdmin = false, onStatusChange }) {
  const isOpen = Boolean(incident);

  return (
    <>
      {/* Semi-transparent backdrop */}
      <div
        className={`inc-drawer-backdrop${isOpen ? " inc-drawer-backdrop--visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding drawer panel */}
      <aside
        className={`inc-drawer${isOpen ? " inc-drawer--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inc-drawer-title"
        aria-hidden={!isOpen}
      >
        {isOpen && incident && (
          <DrawerContent
            incident={incident}
            onClose={onClose}
            isAdmin={isAdmin}
            onStatusChange={onStatusChange}
          />
        )}
      </aside>
    </>
  );
}

/* ─── Internal drawer content ───────────────────────────────────────────── */

function DrawerContent({ incident, onClose, isAdmin, onStatusChange }) {
  const catMeta = CATEGORY_META[incident.category] ?? { icon: "report", color: "#00ed64" };
  const [draftStatus, setDraftStatus]   = useState(incident.status);
  const [saving, setSaving]             = useState(false);
  const [saveFeedback, setSaveFeedback] = useState({ type: "", message: "" });

  const handleStatusSave = async () => {
    if (draftStatus === incident.status) return;
    setSaving(true);
    setSaveFeedback({ type: "", message: "" });
    try {
      await onStatusChange(incident.id, draftStatus);
      setSaveFeedback({ type: "success", message: "Status updated successfully." });
    } catch {
      setSaveFeedback({ type: "error", message: "Failed to update status. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Drawer Header */}
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
            <span className="inc-drawer__eyebrow">{incident.category}</span>
            <h2 id="inc-drawer-title" className="inc-drawer__title">{incident.incidentType}</h2>
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

      {/* Status & Severity badges */}
      <div className="inc-drawer__badge-row">
        <span className={`severity-badge ${getSeverityClass(incident.severity)}`}>
          {incident.severity} Severity
        </span>
        <span className={`status-badge ${getStatusClass(incident.status)}`}>
          {incident.status}
        </span>
      </div>

      {/* Scrollable Body */}
      <div className="inc-drawer__body">

        {/* 2-column metadata grid */}
        <div className="inc-drawer__meta-grid">
          <MetaCell label="Location / Site" icon="location_on" value={incident.location} />
          <MetaCell label="Date & Time" icon="calendar_today" value={formatIncidentDate(incident.dateTime)} />
          <MetaCell label="Reported By" icon="person" value={`${incident.reporter?.name ?? "Unknown"} (${incident.reporter?.email ?? ""})`} />
          <MetaCell label="Reporter Role" icon="badge" value={incident.reporter?.role ?? "—"} />
        </div>

        {/* Full description */}
        <div className="inc-drawer__desc-section">
          <span className="inc-drawer__section-label">
            <span className="material-symbols-outlined inc-drawer__section-label-icon">edit_note</span>
            Detailed Description
          </span>
          <p className="inc-drawer__desc-text">{incident.description || "No description provided."}</p>
        </div>

        {/* Evidence gallery */}
        <div className="inc-drawer__evidence-section">
          <span className="inc-drawer__section-label">
            <span className="material-symbols-outlined inc-drawer__section-label-icon">attach_file</span>
            Uploaded Evidence ({incident.evidence?.length ?? 0})
          </span>
          {(!incident.evidence || incident.evidence.length === 0) ? (
            <p className="inc-drawer__evidence-empty">No files attached to this report.</p>
          ) : (
            <div className="inc-drawer__evidence-gallery">
              {incident.evidence.map((file, idx) => {
                const isImage = file.type?.startsWith("image/");
                const isPdf   = file.type?.includes("pdf");
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
                          {isPdf ? "picture_as_pdf" : "movie"}
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

        {/* ── Admin-only status update panel ─────────────────────────── */}
        {isAdmin && (
          <div className="inc-drawer__admin-panel">
            <span className="inc-drawer__section-label">
              <span className="material-symbols-outlined inc-drawer__section-label-icon">admin_panel_settings</span>
              Admin: Update Status
            </span>
            <div className="inc-drawer__admin-controls">
              <select
                value={draftStatus}
                onChange={(e) => {
                  setDraftStatus(e.target.value);
                  setSaveFeedback({ type: "", message: "" });
                }}
                className={`admin-status-select admin-status-select--${getStatusClass(draftStatus)}`}
                aria-label="Select new incident status"
                disabled={saving}
              >
                {ADMIN_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleStatusSave}
                disabled={saving || draftStatus === incident.status}
                className="button-primary inc-drawer__admin-save-btn"
                id="inc-drawer-admin-save-btn"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {saving ? "hourglass_top" : "check_circle"}
                </span>
                {saving ? "Saving…" : "Update Status"}
              </button>
            </div>
            {saveFeedback.message && (
              <p className={`inc-drawer__admin-feedback inc-drawer__admin-feedback--${saveFeedback.type}`}>
                {saveFeedback.message}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Atomic sub-component for metadata cells ───────────────────────────── */

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

export default IncidentDetailsModal;
