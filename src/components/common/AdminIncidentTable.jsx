import { CATEGORY_META, LOG_STATUS, STATUS_METADATA, getSeverityClass, formatIncidentDate } from "../../utils/incidentConstants";

/**
 * AdminIncidentTable — renders the full incident list for admin review.
 *
 * Props:
 *   incidents      {Array}    — filtered list of incident objects
 *   onStatusChange {Function} — (incidentId, newStatus) called on inline dropdown change
 *   onViewDetails  {Function} — (incident) called when the details icon is clicked
 */
function AdminIncidentTable({ incidents, onStatusChange, onViewDetails }) {
  if (incidents.length === 0) {
    return (
      <div className="inc-empty-state">
        <span className="material-symbols-outlined inc-empty-state__icon">content_paste_search</span>
        <p className="inc-empty-state__text">No incidents match the selected filter.</p>
      </div>
    );
  }

  return (
    <div className="inc-table-wrap">
      <table className="inc-table">
        <thead className="inc-table__head">
          <tr>
            <th className="inc-table__th">Category</th>
            <th className="inc-table__th">Incident Type</th>
            <th className="inc-table__th">Reporter</th>
            <th className="inc-table__th">Location</th>
            <th className="inc-table__th">Date Reported</th>
            <th className="inc-table__th">Severity</th>
            <th className="inc-table__th">Status</th>
            <th className="inc-table__th inc-table__th--action">Details</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((inc, idx) => {
            const catMeta = CATEGORY_META[inc.category] ?? { icon: "report", color: "#00ed64" };
            return (
              <tr
                key={inc.id}
                className={`inc-table__row${idx % 2 === 0 ? " inc-table__row--even" : ""}`}
              >
                {/* Category — color icon + dot + label */}
                <td className="inc-table__td">
                  <div className="inc-cat-cell">
                    <span
                      className="material-symbols-outlined inc-cat-cell__icon"
                      style={{ color: catMeta.color }}
                      aria-hidden="true"
                    >
                      {catMeta.icon}
                    </span>
                    <span className="inc-cat-cell__dot" style={{ backgroundColor: catMeta.color }} />
                    <span className="inc-cat-cell__label">{inc.category}</span>
                  </div>
                </td>

                {/* Incident Type */}
                <td className="inc-table__td inc-table__td--bold">{inc.incidentType}</td>

                {/* Reporter name */}
                <td className="inc-table__td inc-table__td--muted">
                  {inc.reporter?.name ?? "Unknown"}
                </td>

                {/* Location */}
                <td className="inc-table__td inc-table__td--muted">{inc.location}</td>

                {/* Date */}
                <td className="inc-table__td inc-table__td--muted">
                  {formatIncidentDate(inc.dateTime)}
                </td>

                {/* Severity badge */}
                <td className="inc-table__td">
                  <span className={`severity-badge ${getSeverityClass(inc.severity)}`}>
                    {inc.severity}
                  </span>
                </td>

                {/* Inline status dropdown */}
                <td className="inc-table__td">
                  <select
                    value={inc.status}
                    onChange={(e) => onStatusChange(inc.id, e.target.value)}
                    className={`admin-status-select admin-status-select--${inc.status?.toLowerCase().replace(/\s+/g, "-")}`}
                    aria-label={`Change status for ${inc.incidentType}`}
                    title={"Override status"}
                  >
                    {Object.values(LOG_STATUS).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_METADATA[s?.toLowerCase()]?.label || s}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Icon-only view button */}
                <td className="inc-table__td inc-table__td--action" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => onViewDetails(inc)}
                    className="inc-table__view-btn"
                    aria-label={`View details for ${inc.incidentType}`}
                    title="View full details"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                  {inc.onDelete && (
                    <button
                      type="button"
                      onClick={() => inc.onDelete(inc)}
                      className="inc-table__view-btn text-red-500 hover:bg-red-500/10"
                      aria-label={`Delete ${inc.incidentType}`}
                      title="Permanently Delete"
                    >
                      <span className="material-symbols-outlined text-red-500">delete</span>
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AdminIncidentTable;
