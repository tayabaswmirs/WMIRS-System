import StatPill from "../StatPill";

/**
 * StaffWorkspaceHeader — Hero header band displaying staff portal eyebrow, stage title, and KPI counter.
 */
export default function StaffWorkspaceHeader({
  config,
  isIncidents,
  staffScope,
  stageId,
  stats
}) {
  return (
    <div className="inc-hero">
      <div className="inc-hero__left">
        <span className="inc-hero__eyebrow">Staff Portal</span>
        <h1 className="inc-hero__title" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "var(--c-brand, #00ed64)" }}>
            {config.icon}
          </span>
          {config.title}
        </h1>
        <p className="inc-hero__subtitle">
          Review and manage {isIncidents ? "incident reports" : `${staffScope} monitoring logs`} in the {config.title.toLowerCase()} phase.
        </p>
      </div>
      <div className="inc-hero__stats">
        {stageId === "awaiting-review" && (
          <StatPill icon="mark_email_unread" label="Awaiting Review" count={stats.submitted} color="#3d8eff" />
        )}
        {stageId === "active-assignments" && (
          <StatPill icon="assignment" label="Active Tasks" count={stats.active} color="#fa6e39" />
        )}
        {stageId === "pending-verification" && (
          <StatPill icon="pending_actions" label="Pending Verification" count={stats.resolved} color="#00a35c" />
        )}
        {stageId === "completed-archive" && (
          <StatPill icon="task_alt" label="Approved/Completed" count={stats.approved} color="#00ed64" />
        )}
      </div>
    </div>
  );
}
