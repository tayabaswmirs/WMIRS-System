import { useState, useMemo } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { formatLogDate, getStatusClass } from "../../../utils/monitoringUtils";
import { LOG_STATUS } from "../../../utils/incidentConstants";
import WorkflowStepper from "../WorkflowStepper";
import WorkflowActionModal from "../WorkflowActionModal";
import UserProfileModal from "../UserProfileModal";

const CATEGORY_MAP = {
  "BMS":        { icon: "forest",        color: "#00b545", label: "Biodiversity" },
  "Water":      { icon: "water",         color: "#3d4f9f", label: "Water Resource" },
  "Compliance": { icon: "verified_user", color: "#fa6e39", label: "Compliance" }
};

function MonitoringDetailsModal({ log, onClose, onStatusChange }) {
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
            onClose={onClose}
            onStatusChange={onStatusChange}
          />
        )}
      </aside>
    </>
  );
}

function DrawerContent({ log, onClose, onStatusChange }) {
  const { userRole } = useAuth();
  const catMeta = CATEGORY_MAP[log.category] ?? { icon: "report", color: "#00ed64", label: log.category };
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [inspectedUser, setInspectedUser] = useState(null);

  const handleActionClick = (type, nextStatus, title, confirmLabel, variant = 'primary') => {
    setActionType({ type, nextStatus, title, confirmLabel, variant });
    setActionModalOpen(true);
  };

  const handleActionSubmit = async (remarks) => {
    try {
      if (onStatusChange) {
        await onStatusChange(log.id, actionType.nextStatus, remarks);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionModalOpen(false);
      setActionType(null);
    }
  };

  const latestRemark = useMemo(() => {
    if (!log.workflowHistory || !log.workflowHistory.length) return null;
    return log.workflowHistory[log.workflowHistory.length - 1];
  }, [log.workflowHistory]);

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
        <WorkflowStepper currentStatus={log.status} />

        {latestRemark && (
          <div className={`remarks-callout ${['denied', 'unresolved'].includes(log.status) ? 'warning' : ''}`}>
            <div className="remarks-callout-header">
              <span className="remarks-author">
                {latestRemark.actorName} 
                <span className="remarks-role-badge">{latestRemark.actorRole}</span>
              </span>
              <span className="remarks-time">{formatLogDate(latestRemark.timestamp)}</span>
            </div>
            <p className="remarks-text">{latestRemark.remarks}</p>
          </div>
        )}
        {/* Reporter info */}
        <div className="inc-drawer__meta-grid">
          <div className="inc-drawer__meta-cell">
            <span className="inc-drawer__meta-label">
              <span className="material-symbols-outlined inc-drawer__meta-label-icon">person</span>
              Reported By
            </span>
            <div className="flex items-center justify-between gap-1 mt-0.5">
              <span className="inc-drawer__meta-val truncate">{log.reporter?.name ?? "Unknown"}</span>
              {log.reporter?.uid && (
                <button
                  type="button"
                  onClick={() => setInspectedUser({ uid: log.reporter.uid, name: log.reporter.name, email: log.reporter.email, role: log.reporter.role })}
                  className="text-xs text-[#00684a] font-semibold underline hover:text-[#001e2b] shrink-0"
                  title="View reporter profile"
                >
                  Profile ↗
                </button>
              )}
            </div>
          </div>
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

        {/* Field Resolution Findings Callout (for Staff & Admin Verification) */}
        {(log.resolutionNotes || log.resolutionEvidence) && (
          <div className="inc-drawer__desc-section" style={{ backgroundColor: 'rgba(0, 237, 100, 0.06)', border: '1px solid rgba(0, 237, 100, 0.25)', borderRadius: '12px', padding: '16px', marginTop: '16px' }}>
            <span className="inc-drawer__section-label" style={{ color: 'var(--brand-green-dark, #008f3d)', fontWeight: 700 }}>
              <span className="material-symbols-outlined inc-drawer__section-label-icon" style={{ color: 'var(--brand-green-dark, #008f3d)' }}>task_alt</span>
              Ranger Resolution Findings & Evidence
            </span>
            {log.resolutionNotes && (
              <p className="inc-drawer__desc-text" style={{ marginTop: '8px', color: '#001e2b', fontWeight: 500 }}>
                {log.resolutionNotes}
              </p>
            )}
            {log.resolutionEvidence && (
              <div style={{ marginTop: '12px' }}>
                <span className="inc-drawer__section-label" style={{ fontSize: '12px', marginBottom: '6px' }}>
                  Resolution File Attachment:
                </span>
                <a
                  href={typeof log.resolutionEvidence === 'string' ? log.resolutionEvidence : log.resolutionEvidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inc-drawer__evidence-tile"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--c-hairline-strong)', textDecoration: 'none' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--brand-green-dark, #008f3d)' }}>attachment</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-text-primary)' }}>
                    {typeof log.resolutionEvidence === 'object' ? log.resolutionEvidence.name : 'View Resolution Document / Photo'}
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--c-text-muted)' }}>open_in_new</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Audit Timeline */}
        {((log.history && log.history.length > 0) || (log.workflowHistory && log.workflowHistory.length > 0)) && (
          <div className="audit-timeline">
            <span className="inc-drawer__section-label">
              <span className="material-symbols-outlined inc-drawer__section-label-icon">history</span>
              Audit Timeline
            </span>
            {(log.history || log.workflowHistory).slice().reverse().map((hist, idx) => {
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
                      <span className="remarks-time">{formatLogDate(hist.timestamp)}</span>
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
        {((userRole === "staff" && ["submitted", "under review"].includes(log.status?.toLowerCase())) ||
          (userRole === "staff" && log.status?.toLowerCase() === "resolved") ||
          (userRole === "admin" && ["verified", "pending completion"].includes(log.status?.toLowerCase()))) && (
          <div className="inc-drawer__admin-panel">
            {userRole === "staff" && ["submitted", "under review"].includes(log.status?.toLowerCase()) && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn-primary" style={{ flex: 1 }}
                  onClick={() => handleActionClick('approve', LOG_STATUS.ASSIGNED, 'Open Assignment', 'Approve & Assign')}
                >
                  Open Assignment
                </button>
                <button 
                  className="btn-danger" style={{ flex: 1 }}
                  onClick={() => handleActionClick('deny', LOG_STATUS.DENIED, 'Deny Log', 'Deny', 'danger')}
                >
                  Deny Log
                </button>
              </div>
            )}
            {userRole === "staff" && log.status?.toLowerCase() === "resolved" && (
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
            {userRole === "admin" && ["verified", "pending completion"].includes(log.status?.toLowerCase()) && (
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
        key={`mon-prof-${inspectedUser?.uid || 'none'}`}
        isOpen={Boolean(inspectedUser)}
        user={inspectedUser}
        userId={inspectedUser?.uid}
        onClose={() => setInspectedUser(null)}
        viewerRole={userRole}
      />
    </>
  );
}

function LogSpecificDetails({ log }) {
  const formattedObsDate = formatLogDate(log.dateTime || log.createdAt);

  switch (log.subcategory) {
    case "Avian Tracking Form":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <DetailRow label="Observation Date & Time" value={formattedObsDate} />
          <DetailRow label="Location" value={log.stationId} />
          <DetailRow label="Avian Species" value={log.avianSpecies} />
          <DetailRow label="Count / Sighted" value={log.count} />
          <DetailRow
            label="Observed Activities"
            value={Array.isArray(log.activities) ? log.activities.join(", ") : (log.activities || "None")}
          />
        </div>
      );
    case "Wildlife Observations Form":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <DetailRow label="Observation Date & Time" value={formattedObsDate} />
          <DetailRow label="Classification" value={log.classification} />
          <DetailRow label="Species Name" value={log.speciesName} />
          <DetailRow label="Quantity Sighted" value={log.quantity} />
          <DetailRow label="Habitat Condition Notes" value={log.habitatNotes} isParagraph />
        </div>
      );
    case "Local Water Source Monitoring Form":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <DetailRow label="Observation Date & Time" value={formattedObsDate} />
          <DetailRow label="Water Body Identifier" value={log.waterBody} />
          <DetailRow label="Specific Location Marker" value={log.locationMarker} />
          {log.sourceType && <DetailRow label="Source Type" value={log.sourceType} />}
          {log.waterClarity && <DetailRow label="Water Clarity" value={log.waterClarity} />}
          {log.flowLevel && <DetailRow label="Flow Level" value={log.flowLevel} />}
          {log.primaryUsage && <DetailRow label="Primary Usage" value={log.primaryUsage} />}
          {(log.phLevel || log.temperature || log.dissolvedOxygen) && (
            <div style={{ display: "flex", gap: "24px", marginTop: "4px", backgroundColor: "#f8f9fa", padding: "12px", borderRadius: "8px", border: "1px solid var(--c-hairline)" }}>
              {log.phLevel && <DetailRow label="pH Level" value={log.phLevel} />}
              {log.temperature && <DetailRow label="Temperature (°C)" value={log.temperature} />}
              {log.dissolvedOxygen && <DetailRow label="Dissolved Oxygen (mg/L)" value={log.dissolvedOxygen} />}
            </div>
          )}
          <DetailRow label="Physical Condition Log" value={log.physicalCondition} isParagraph />
        </div>
      );
    case "Ecosystem Conservation Log":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <DetailRow label="Observation Date & Time" value={formattedObsDate} />
          {log.waterBody && <DetailRow label="Water Body Identifier" value={log.waterBody} />}
          {log.locationMarker && <DetailRow label="Specific Location Marker" value={log.locationMarker} />}
          {log.threatLevel && (
            <DetailRow 
              label="Ecological Threat Level" 
              value={
                <span className={`inc-severity-pill inc-severity-pill--${log.threatLevel.toLowerCase()} inc-severity-pill--active`} style={{ display: 'inline-block', marginTop: '4px' }}>
                  {log.threatLevel}
                </span>
              } 
            />
          )}
          <DetailRow
            label="Pollution Risk Indicators"
            value={Array.isArray(log.pollutionIndicators) ? log.pollutionIndicators.join(", ") : (log.pollutionIndicators || "None")}
          />
          <DetailRow label="Observed Aquatic Wildlife Activity" value={log.aquaticWildlifeNotes} isParagraph />
        </div>
      );
    case "Waste Collection Tracking Form":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <DetailRow label="Observation Date & Time" value={formattedObsDate} />
          <DetailRow label="Barangay / Route" value={log.barangay} />
          <DetailRow label="Collection Type" value={log.collectionType} />
          <DetailRow label="Volume Metric Estimate" value={`${log.volumeValue || 0} ${log.volumeUnit || ""}`} />
          <DetailRow label="Operational Issues" value={log.operationalIssues} isParagraph />
        </div>
      );
    case "Plastic Bag Ban Inspection Form":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <DetailRow label="Inspection Date & Time" value={formattedObsDate} />
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
