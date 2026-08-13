import { getStatusClass, getStatusLabel, formatLogDate } from "../../../utils/monitoringUtils";
import { LOG_STATUS, STATUS_METADATA } from "../../../utils/incidentConstants";

const CATEGORY_MAP = {
  "BMS":        { icon: "forest",        color: "#00b545", label: "Biodiversity" },
  "Water":      { icon: "water",         color: "#3d4f9f", label: "Water Resource" },
  "Compliance": { icon: "verified_user", color: "#fa6e39", label: "Compliance" }
};

function MonitoringTable({ logs, isAdmin, onStatusChange, onViewDetails }) {
  if (logs.length === 0) {
    return (
      <div className="inc-empty-state">
        <span className="material-symbols-outlined inc-empty-state__icon">content_paste_search</span>
        <p className="inc-empty-state__text">No monitoring logs match the selected filters.</p>
      </div>
    );
  }

  // statuses are fetched from LOG_STATUS for consistency

  return (
    <div className="inc-table-wrap">
      <table className="inc-table">
        <thead className="inc-table__head">
          <tr>
            <th className="inc-table__th">Category</th>
            <th className="inc-table__th">Subcategory</th>
            {isAdmin && <th className="inc-table__th">Reporter</th>}
            <th className="inc-table__th">Date Sighted</th>
            <th className="inc-table__th">Status</th>
            <th className="inc-table__th inc-table__th--action">Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => {
            const catMeta = CATEGORY_MAP[log.category] ?? { icon: "report", color: "#00ed64", label: log.category };
            return (
              <tr
                key={log.id}
                className={`inc-table__row${idx % 2 === 0 ? " inc-table__row--even" : ""}`}
              >
                {/* Category with icon/color */}
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
                    <span className="inc-cat-cell__label">{catMeta.label}</span>
                  </div>
                </td>

                {/* Subcategory */}
                <td className="inc-table__td inc-table__td--bold">{log.subcategory}</td>

                {/* Reporter (Admin only) */}
                {isAdmin && (
                  <td className="inc-table__td inc-table__td--muted">
                    {log.reporter?.name ?? "Unknown"}
                  </td>
                )}

                {/* Date Sighted / Logged */}
                <td className="inc-table__td inc-table__td--muted">
                  {formatLogDate(log.dateTime || log.createdAt)}
                </td>

                {/* Status Dropdown (Admin) or Status Badge (User) */}
                <td className="inc-table__td">
                  {isAdmin ? (
                      <select
                        value={log.status}
                        onChange={(e) => onStatusChange(log.id, e.target.value)}
                        className={`admin-status-select admin-status-select--${log.status?.toLowerCase().replace(/\s+/g, "-")}`}
                        aria-label={`Change status for log ${log.id}`}
                        title="Override status"
                        style={{ minWidth: "130px" }}
                      >
                      {Object.values(LOG_STATUS).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_METADATA[s?.toLowerCase()]?.label || s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`status-badge ${getStatusClass(log.status)}`}>
                      {getStatusLabel(log.status)}
                    </span>
                  )}
                </td>

                {/* View Details Button */}
                <td className="inc-table__td inc-table__td--action" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => onViewDetails(log)}
                    className="inc-table__view-btn"
                    aria-label={`View details for log ${log.id}`}
                    title="View details"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                  {isAdmin && log.onDelete && (
                    <button
                      type="button"
                      onClick={() => log.onDelete(log)}
                      className="inc-table__view-btn text-red-500 hover:bg-red-500/10"
                      aria-label={`Delete ${log.id}`}
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

export default MonitoringTable;
