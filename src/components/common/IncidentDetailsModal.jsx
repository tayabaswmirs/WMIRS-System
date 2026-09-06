import { useState, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { CATEGORY_META, LOG_STATUS, getSeverityClass, getStatusClass, formatIncidentDate } from "../../utils/incidentConstants";
import WorkflowStepper from "./WorkflowStepper";
import WorkflowActionModal from "./WorkflowActionModal";
import UserProfileModal from "./UserProfileModal";
import LocationDetailMap from "./LocationDetailMap";
import DuplicateWarningBanner from "./DuplicateWarningBanner";
import TeamAssignmentPicker from "./TeamAssignmentPicker";
import { assignTeamToReport, smartMergeDuplicate, clearDuplicateFlag } from "../../firebase/services/incidentService";

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
function IncidentDetailsModal({ incident, onClose, onStatusChange }) {
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
            onStatusChange={onStatusChange}
          />
        )}
      </aside>
    </>
  );
}

/* ─── Internal drawer content ───────────────────────────────────────────── */

function DrawerContent({ incident, onClose, onStatusChange }) {
  const { userRole, currentUser } = useAuth();
  const catMeta = CATEGORY_META[incident.category] ?? { icon: "report", color: "#00ed64" };
  const [actionType, setActionType] = useState(null); // e.g. { type: 'approve', nextStatus: 'assigned', title: '...', confirmLabel: '...' }
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [inspectedUser, setInspectedUser] = useState(null);
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
  const [isProcessingDuplicate, setIsProcessingDuplicate] = useState(false);
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);

  const handleActionClick = (type, nextStatus, title, confirmLabel, variant = 'primary') => {
    setActionType({ type, nextStatus, title, confirmLabel, variant });
    setActionModalOpen(true);
  };

  const handleActionSubmit = async (remarks) => {
    try {
      if (onStatusChange) {
        await onStatusChange(incident.id, actionType.nextStatus, remarks);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionModalOpen(false);
      setActionType(null);
    }
  };

  const handleTeamAssign = async ({ leader, members }) => {
    try {
      await assignTeamToReport(incident.id, "Incident", leader, members, currentUser);
      setTeamPickerOpen(false);
      if (onStatusChange) {
        onStatusChange(incident.id, LOG_STATUS.ASSIGNED, `Assigned to team led by ${leader.name}`);
      }
    } catch (err) {
      console.error("Team assignment failed:", err);
      alert(err.message || "Failed to assign team.");
    }
  };

  const handleMergeDuplicate = async () => {
    if (!incident.possibleDuplicate?.matchedReportId) return;
    if (!window.confirm(`Merge this report into master ticket #${incident.possibleDuplicate.matchedReportId}?`)) return;
    try {
      setIsProcessingDuplicate(true);
      await smartMergeDuplicate(incident.id, incident.possibleDuplicate.matchedReportId, "Incident", currentUser);
      onClose();
    } catch (err) {
      console.error("Merge failed:", err);
      alert("Failed to merge duplicate report.");
    } finally {
      setIsProcessingDuplicate(false);
    }
  };

  const handleClearDuplicateFlag = async () => {
    try {
      setIsProcessingDuplicate(true);
      await clearDuplicateFlag(incident.id, "Incident", currentUser);
      setDuplicateDismissed(true);
    } catch (err) {
      console.error("Clear flag failed:", err);
    } finally {
      setIsProcessingDuplicate(false);
    }
  };

  const latestRemark = useMemo(() => {
    if (!incident.workflowHistory || !incident.workflowHistory.length) return null;
    return incident.workflowHistory[incident.workflowHistory.length - 1];
  }, [incident.workflowHistory]);

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
        {/* Duplicate Warning Banner */}
        {!duplicateDismissed && incident.possibleDuplicate?.isPossibleDuplicate && (
          <DuplicateWarningBanner
            duplicateInfo={incident.possibleDuplicate}
            onMerge={handleMergeDuplicate}
            onClearFlag={handleClearDuplicateFlag}
            onReject={() => handleActionClick('deny', LOG_STATUS.DENIED, 'Reject Log', 'Reject', 'danger')}
            isProcessing={isProcessingDuplicate}
          />
        )}

        <WorkflowStepper currentStatus={incident.status} />

        {latestRemark && (
          <div className={`remarks-callout ${['denied', 'unresolved'].includes(incident.status) ? 'warning' : ''}`}>
            <div className="remarks-callout-header">
              <span className="remarks-author">
                {latestRemark.actorName} 
                <span className="remarks-role-badge">{latestRemark.actorRole}</span>
              </span>
              <span className="remarks-time">{formatIncidentDate(latestRemark.timestamp)}</span>
            </div>
            <p className="remarks-text">{latestRemark.remarks}</p>
          </div>
        )}

        {/* Assigned Patrol Team Display */}
        {incident.assignedTeam && (
          <div className="inc-drawer__desc-section" style={{ backgroundColor: '#f0fbf5', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
            <span className="inc-drawer__section-label" style={{ color: '#00684a', fontWeight: 600 }}>
              <span className="material-symbols-outlined inc-drawer__section-label-icon">groups</span>
              Assigned Patrol Team
            </span>
            <div style={{ marginTop: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, backgroundColor: '#00ed64', color: '#001e2b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>stars</span>
                  Team Leader
                </span>
                <strong>{incident.assignedTeam.leader?.name}</strong>
              </div>
              {incident.assignedTeam.members?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  <span style={{ color: '#5c6c7a', fontSize: '12px' }}>Members:</span>
                  {incident.assignedTeam.members.map((m) => (
                    <span key={m.uid} style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', backgroundColor: '#e1e5e8', color: '#001e2b' }}>
                      {m.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Merged Duplicate Reports Display */}
        {incident.mergedReports && incident.mergedReports.length > 0 && (
          <div className="inc-drawer__desc-section" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
            <span className="inc-drawer__section-label" style={{ color: '#334155' }}>
              <span className="material-symbols-outlined inc-drawer__section-label-icon">merge</span>
              Merged Evidence & Reports ({incident.mergedReports.length})
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {incident.mergedReports.map((mr, idx) => (
                <div key={idx} style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#1e293b' }}>
                    <span>From: {mr.reporterName}</span>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>{formatIncidentDate(mr.mergedAt)}</span>
                  </div>
                  {mr.description && <p style={{ margin: '4px 0', color: '#475569' }}>{mr.description}</p>}
                  {mr.evidence?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      {mr.evidence.map((ev, eIdx) => (
                        <a key={eIdx} href={ev.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00684a', textDecoration: 'underline', fontSize: '11px' }}>
                          Evidence #{eIdx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2-column metadata grid */}
        <div className="inc-drawer__meta-grid">
          <MetaCell label="Location / Site" icon="location_on" value={incident.location} />
          <MetaCell label="Date & Time" icon="calendar_today" value={formatIncidentDate(incident.dateTime)} />
          <div className="inc-drawer__meta-cell">
            <span className="inc-drawer__meta-label">
              <span className="material-symbols-outlined inc-drawer__meta-label-icon">person</span>
              Reported By
            </span>
            <div className="flex items-center justify-between gap-1 mt-0.5">
              <span className="inc-drawer__meta-val truncate">{incident.reporter?.name ?? "Unknown"}</span>
              {incident.reporter?.uid && (
                <button
                  type="button"
                  onClick={() => setInspectedUser({ uid: incident.reporter.uid, name: incident.reporter.name, email: incident.reporter.email, role: incident.reporter.role })}
                  className="text-xs text-[#00684a] font-semibold underline hover:text-[#001e2b] shrink-0"
                  title="View reporter profile"
                >
                  Profile ↗
                </button>
              )}
            </div>
          </div>
          <MetaCell label="Reporter Role" icon="badge" value={incident.reporter?.role ?? "—"} />
        </div>

        {/* Site Geolocation & Map */}
        <LocationDetailMap
          location={incident.location}
          coordinates={incident.coordinates}
          barangay={incident.barangay}
        />

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

        {/* Field Resolution Findings Callout (for Staff & Admin Verification) */}
        {(incident.resolutionNotes || incident.resolutionEvidence) && (
          <div className="inc-drawer__desc-section" style={{ backgroundColor: 'rgba(0, 237, 100, 0.06)', border: '1px solid rgba(0, 237, 100, 0.25)', borderRadius: '12px', padding: '16px', marginTop: '16px' }}>
            <span className="inc-drawer__section-label" style={{ color: 'var(--brand-green-dark, #008f3d)', fontWeight: 700 }}>
              <span className="material-symbols-outlined inc-drawer__section-label-icon" style={{ color: 'var(--brand-green-dark, #008f3d)' }}>task_alt</span>
              Ranger Resolution Findings & Evidence
            </span>
            {incident.resolutionNotes && (
              <p className="inc-drawer__desc-text" style={{ marginTop: '8px', color: '#001e2b', fontWeight: 500 }}>
                {incident.resolutionNotes}
              </p>
            )}
            {incident.resolutionEvidence && (
              <div style={{ marginTop: '12px' }}>
                <span className="inc-drawer__section-label" style={{ fontSize: '12px', marginBottom: '6px' }}>
                  Resolution File Attachment:
                </span>
                <a
                  href={typeof incident.resolutionEvidence === 'string' ? incident.resolutionEvidence : incident.resolutionEvidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inc-drawer__evidence-tile"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--c-hairline-strong)', textDecoration: 'none' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--brand-green-dark, #008f3d)' }}>attachment</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-text-primary)' }}>
                    {typeof incident.resolutionEvidence === 'object' ? incident.resolutionEvidence.name : 'View Resolution Document / Photo'}
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--c-text-muted)' }}>open_in_new</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Audit Timeline */}
        {((incident.history && incident.history.length > 0) || (incident.workflowHistory && incident.workflowHistory.length > 0)) && (
          <div className="audit-timeline">
            <span className="inc-drawer__section-label">
              <span className="material-symbols-outlined inc-drawer__section-label-icon">history</span>
              Audit Timeline
            </span>
            {(incident.history || incident.workflowHistory).slice().reverse().map((hist, idx) => {
              const statusName = hist.toStatus || hist.action || "Updated";
              const authorName = hist.actorName || hist.by || "User";
              const authorRole = hist.actorRole || "User";
              const notesText  = hist.remarks || hist.notes;
              const isError = ['denied', 'unresolved'].includes(statusName?.toLowerCase());

              return (
                <div key={idx} className="timeline-item">
                  <div className={`timeline-dot ${isError ? 'error' : ''}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                      {isError ? 'error' : 'done'}
                    </span>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-status" style={{ textTransform: 'capitalize' }}>
                        {statusName}
                      </span>
                      <span className="remarks-time">{formatIncidentDate(hist.timestamp)}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#5c6c7a', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <span>By: {authorName} {authorRole !== 'User' ? `(${authorRole})` : ''}</span>
                      {hist.uid && (
                        <button
                          type="button"
                          onClick={() => setInspectedUser({ uid: hist.uid, name: authorName, role: authorRole })}
                          className="text-[11px] text-[#00684a] font-semibold underline hover:text-[#001e2b]"
                          title={`View profile of ${authorName}`}
                        >
                          View Profile ↗
                        </button>
                      )}
                    </div>
                    {notesText && <div className="timeline-body">{notesText}</div>}
                    {hist.evidenceFile && (
                      <div style={{ marginTop: '6px' }}>
                        <a
                          href={typeof hist.evidenceFile === 'string' ? hist.evidenceFile : hist.evidenceFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '12px', color: 'var(--brand-green-dark, #008f3d)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>attach_file</span>
                          View Attachment
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Context-Sensitive Action Buttons ─────────────────────────── */}
        {((userRole === "staff" && ["submitted", "under review"].includes(incident.status?.toLowerCase())) ||
          (userRole === "staff" && incident.status?.toLowerCase() === "resolved") ||
          (userRole === "admin" && ["verified", "pending completion"].includes(incident.status?.toLowerCase()))) && (
          <div className="inc-drawer__admin-panel">
            {userRole === "staff" && ["submitted", "under review"].includes(incident.status?.toLowerCase()) && (
              teamPickerOpen ? (
                <TeamAssignmentPicker
                  reporterUid={incident.reporter?.uid}
                  onAssign={handleTeamAssign}
                  onCancel={() => setTeamPickerOpen(false)}
                />
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn-primary" style={{ flex: 1 }}
                    onClick={() => setTeamPickerOpen(true)}
                  >
                    Dispatch Patrol Team
                  </button>
                  <button 
                    className="btn-danger" style={{ flex: 1 }}
                    onClick={() => handleActionClick('deny', LOG_STATUS.DENIED, 'Deny Log', 'Deny', 'danger')}
                  >
                    Deny Log
                  </button>
                </div>
              )
            )}
            {userRole === "staff" && incident.status?.toLowerCase() === "resolved" && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn-primary" style={{ flex: 1 }}
                  onClick={() => handleActionClick('verify', LOG_STATUS.VERIFIED, 'Verify Resolution', 'Verify')}
                >
                  Verify Resolution
                </button>
                <button 
                  className="btn-danger" style={{ flex: 1 }}
                  onClick={() => handleActionClick('unresolve', LOG_STATUS.UNRESOLVED, 'Mark Unresolved', 'Mark Unresolved', 'danger')}
                >
                  Mark Unresolved
                </button>
              </div>
            )}
            {userRole === "admin" && ["verified", "pending completion"].includes(incident.status?.toLowerCase()) && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn-primary" style={{ flex: 1 }}
                  onClick={() => handleActionClick('complete', LOG_STATUS.COMPLETED, 'Mark Complete', 'Complete')}
                >
                  Mark Complete
                </button>
                <button 
                  className="btn-danger" style={{ flex: 1 }}
                  onClick={() => handleActionClick('dispute', LOG_STATUS.UNRESOLVED, 'Dispute Log', 'Dispute', 'danger')}
                >
                  Dispute Log
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <WorkflowActionModal 
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={actionType?.title || ''}
        confirmLabel={actionType?.confirmLabel || ''}
        variant={actionType?.variant || 'primary'}
        onSubmit={handleActionSubmit}
      />

      <UserProfileModal
        key={`inc-prof-${inspectedUser?.uid || 'none'}`}
        isOpen={Boolean(inspectedUser)}
        user={inspectedUser}
        userId={inspectedUser?.uid}
        onClose={() => setInspectedUser(null)}
        viewerRole={userRole}
      />
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
