import { getSeverityClass } from "../../utils/incidentConstants";

/**
 * AssignmentCard — Clean card representation for field patrol assignments.
 *
 * @param {Object} props
 * @param {Object} props.assignment
 * @param {Object} props.currentUser
 * @param {string} props.userRole
 * @param {function(Object): void} props.onSelect
 * @param {function(Object): void} props.onResolve
 */
export default function AssignmentCard({
  assignment,
  currentUser,
  userRole,
  onSelect,
  onResolve
}) {
  const isLeader = assignment.assignedTeam?.leader?.uid === currentUser?.uid;
  const isMember = assignment.assignedTeam?.members?.some((m) => m.uid === currentUser?.uid);
  const canResolve = userRole === "ranger" && (!assignment.assignedTeam?.leader?.uid || isLeader);

  const formattedDate = (() => {
    const raw = assignment.createdAt;
    if (!raw) return "Recent";
    if (raw.toDate) return raw.toDate().toLocaleDateString();
    if (raw.seconds) return new Date(raw.seconds * 1000).toLocaleDateString();
    return new Date(raw).toLocaleDateString();
  })();

  const getInstructions = () => {
    const history = assignment.history || assignment.workflowHistory;
    if (!Array.isArray(history)) return "No specific instructions provided by Staff.";
    const remarks = history.filter(
      (h) => (h.notes || h.remarks) && ["assigned", "unresolved"].includes((h.toStatus || h.action)?.toLowerCase())
    );
    if (remarks.length === 0) return "No specific instructions provided by Staff.";
    return remarks[remarks.length - 1].notes || remarks[remarks.length - 1].remarks;
  };

  return (
    <div className={`assignment-card ${isLeader ? "assignment-card--leader" : ""}`}>
      {/* Top Meta Bar */}
      <div className="assignment-card__top-bar">
        <div className="assignment-card__meta">
          <span className={`status-badge ${getSeverityClass(assignment.severity)}`}>
            {assignment.severity || "Standard"}
          </span>
          {isLeader ? (
            <span className="assignment-role-badge assignment-role-badge--leader">
              <span className="material-symbols-outlined" aria-hidden="true">stars</span>
              Team Leader (You)
            </span>
          ) : isMember ? (
            <span className="assignment-role-badge assignment-role-badge--assisting">
              <span className="material-symbols-outlined" aria-hidden="true">shield_person</span>
              Assisting Member
            </span>
          ) : assignment.assignedTeam?.leader ? (
            <span className="assignment-role-badge assignment-role-badge--neutral">
              <span className="material-symbols-outlined" aria-hidden="true">person</span>
              Leader: {assignment.assignedTeam.leader.name}
            </span>
          ) : (
            <span className="assignment-role-badge assignment-role-badge--neutral">
              <span className="material-symbols-outlined" aria-hidden="true">group</span>
              Open Dispatch
            </span>
          )}
        </div>

        <span className="assignment-card__date" title="Assigned / Created Date">
          <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
          {formattedDate}
        </span>
      </div>

      {/* Main Content */}
      <h3 className="assignment-card__title">
        {assignment.subcategory || assignment.incidentType || assignment.category}
      </h3>
      
      <p className="assignment-card__location">
        <span className="material-symbols-outlined loc-icon" aria-hidden="true">location_on</span>
        <span>{assignment.location || "Location not specified"}</span>
      </p>

      {/* Team Roster Members */}
      {assignment.assignedTeam?.members?.length > 0 && (
        <div className="assignment-card__roster">
          <span className="assignment-card__roster-label">Team:</span>
          {assignment.assignedTeam.members.map((m) => (
            <span key={m.uid} className="assignment-card__roster-chip">
              {m.name}
            </span>
          ))}
        </div>
      )}

      {/* Instructions Callout */}
      <div className="assignment-card__instructions">
        <div className="assignment-card__instructions-head">
          <span className="material-symbols-outlined" aria-hidden="true">assignment</span>
          <span>Task Instructions</span>
        </div>
        <p className="assignment-card__instructions-body">{getInstructions()}</p>
      </div>

      {/* Actions */}
      <div className="assignment-card__actions">
        <button
          type="button"
          className="btn-card-secondary"
          onClick={() => onSelect(assignment)}
        >
          View Details
        </button>

        {canResolve ? (
          <button
            type="button"
            className="btn-card-primary"
            onClick={() => onResolve(assignment)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }} aria-hidden="true">
              check_circle
            </span>
            Resolve
          </button>
        ) : userRole === "ranger" && isMember ? (
          <button
            type="button"
            className="btn-card-disabled"
            disabled
            title={`Only Team Leader (${assignment.assignedTeam?.leader?.name || "designated"}) can resolve.`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "15px" }} aria-hidden="true">
              lock
            </span>
            Leader Resolves
          </button>
        ) : null}
      </div>
    </div>
  );
}
