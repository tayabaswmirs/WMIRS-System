import { formatIncidentDate } from "../../utils/incidentConstants";

/**
 * PendingQueueRow — Renders a single row in the Pending Completion Queue table.
 *
 * @param {Object} props
 * @param {Object} props.item - Normalized log item
 * @param {number} props.idx - Row index for alternating shading
 * @param {function(Object): void} props.onRowClick - Row click callback
 * @param {function(Object, string): void} props.onQuickAction - Quick action callback
 */
export default function PendingQueueRow({ item, idx, onRowClick, onQuickAction }) {
  const isIncident = item.domain === "incident";
  const typeChipColor = isIncident ? "#fa6e39" : "#00ed64";

  return (
    <tr
      className={`inc-table__row${idx % 2 === 0 ? " inc-table__row--even" : ""}`}
      style={{ cursor: "pointer" }}
      onClick={() => onRowClick(item)}
    >
      {/* Domain Type Indicator */}
      <td className="inc-table__td">
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "3px 8px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          backgroundColor: `${typeChipColor}18`,
          color: typeChipColor,
          border: `1px solid ${typeChipColor}33`
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
            {isIncident ? "warning" : "forest"}
          </span>
          {isIncident ? "Incident" : "Monitoring"}
        </span>
      </td>

      {/* Title & Category */}
      <td className="inc-table__td">
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span className="inc-table__td--bold">{item.title}</span>
          <span style={{ fontSize: "11px", color: "var(--c-stone)" }}>{item.category}</span>
        </div>
      </td>

      {/* Location */}
      <td className="inc-table__td inc-table__td--muted">
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--c-stone)" }}>location_on</span>
          <span>{item.location}</span>
        </div>
      </td>

      {/* Resolution Notes / Evidence snippet */}
      <td className="inc-table__td">
        <div style={{ maxWidth: "260px" }}>
          <p style={{
            fontSize: "12px",
            color: item.resolutionNotes ? "var(--c-steel)" : "var(--c-stone)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {item.resolutionNotes || "Resolution verified by staff."}
          </p>
          {item.hasEvidence && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "var(--c-green-dark, #008f3d)", marginTop: "2px", fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>attach_file</span>
              Evidence attached
            </span>
          )}
        </div>
      </td>

      {/* Reported Date */}
      <td className="inc-table__td inc-table__td--muted">
        {formatIncidentDate(item.date)}
      </td>

      {/* Quick Actions (Stop propagation to prevent opening drawer simultaneously) */}
      <td className="inc-table__td inc-table__td--action" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
          <button
            type="button"
            onClick={() => onRowClick(item)}
            className="inc-table__view-btn"
            title="Inspect full details & evidence drawer"
            aria-label="Inspect full details"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>visibility</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickAction(item, "complete")}
            className="btn-primary"
            title="Validate and mark completed"
            style={{
              padding: "4px 12px",
              fontSize: "12px",
              borderRadius: "500px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>task_alt</span>
            <span>Complete</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickAction(item, "dispute")}
            className="btn-danger"
            title="Dispute log and mark unresolved"
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              borderRadius: "500px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>gavel</span>
            <span>Dispute</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
