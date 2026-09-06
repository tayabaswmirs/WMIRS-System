import StatPill from "./StatPill";

/**
 * AssignmentHero — Header band displaying title, description, and task metrics.
 *
 * @param {Object} props
 * @param {{ total: number, incident: number, monitoring: number, leading: number, assisting: number }} props.stats
 * @param {string} props.userRole
 */
export default function AssignmentHero({ stats, userRole }) {
  const isRanger = userRole === "ranger";

  return (
    <div className="inc-hero">
      <div className="inc-hero__left">
        <span className="inc-hero__eyebrow">Field Operations</span>
        <h1 className="inc-hero__title">Open Assignments</h1>
        <p className="inc-hero__subtitle">
          Inspect, coordinate, and resolve field patrol tasks assigned to teams.
        </p>
      </div>
      <div className="inc-hero__stats">
        <StatPill icon="assignment" label="Total Tasks" count={stats.total} color="var(--brand-green, #00ed64)" />
        {isRanger ? (
          <>
            <StatPill icon="stars" label="Leading" count={stats.leading} color="#00ed64" />
            <StatPill icon="groups" label="Assisting" count={stats.assisting} color="#38bdf8" />
          </>
        ) : (
          <>
            <StatPill icon="warning" label="Incidents" count={stats.incident} color="#f5a524" />
            <StatPill icon="visibility" label="Monitoring" count={stats.monitoring} color="#38bdf8" />
          </>
        )}
      </div>
    </div>
  );
}
