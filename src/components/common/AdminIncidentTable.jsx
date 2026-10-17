import { useState } from "react";
import { CATEGORY_META, STATUS_METADATA, getSeverityClass, getStatusClass, formatIncidentDate, normalizeIncidentType } from "../../utils/incidentConstants";
import { isCriticalActive } from "../../utils/filterUtils";
import Pagination from "./Pagination";

const PAGE_SIZE = 10;

/**
 * AdminIncidentTable — renders the full incident list with priority highlighting and pagination.
 *
 * Props:
 *   incidents      {Array}    — filtered list of incident objects
 *   onViewDetails  {Function} — (incident) called when the details icon is clicked
 *   stageId        {string}   — optional stage identifier for contextual priority evaluation
 */
function AdminIncidentTable({ incidents, onViewDetails, stageId = null }) {
  const [prevIncidents, setPrevIncidents] = useState(incidents);
  const [currentPage, setCurrentPage] = useState(1);

  if (incidents !== prevIncidents) {
    setPrevIncidents(incidents);
    setCurrentPage(1);
  }

  if (incidents.length === 0) {
    return (
      <div className="inc-empty-state">
        <span className="material-symbols-outlined inc-empty-state__icon">content_paste_search</span>
        <p className="inc-empty-state__text">No incidents match the selected filter.</p>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedIncidents = incidents.slice(startIndex, startIndex + PAGE_SIZE);

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
            <th className="inc-table__th inc-table__th--status">Status</th>
            <th className="inc-table__th inc-table__th--action">Details</th>
          </tr>
        </thead>
        <tbody>
          {paginatedIncidents.map((inc, idx) => {
            const catMeta = CATEGORY_META[inc.category] ?? { icon: "report", color: "#00ed64" };
            const isPriority = isCriticalActive(inc, stageId);

            return (
              <tr
                key={inc.id}
                className={`inc-table__row${idx % 2 === 0 ? " inc-table__row--even" : ""}${isPriority ? " inc-table__row--priority" : ""}`}
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
                <td className="inc-table__td inc-table__td--bold">{normalizeIncidentType(inc.incidentType)}</td>

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
                <td className="inc-table__td inc-table__td--status">
                  <span className={`status-badge ${getStatusClass(inc.status)}${isPriority ? " status-badge--priority" : ""}`}>
                    {isPriority && (
                      <span className="material-symbols-outlined" style={{ fontSize: "14px", marginRight: "2px" }} aria-hidden="true">
                        priority_high
                      </span>
                    )}
                    {STATUS_METADATA[inc.status?.toLowerCase()]?.label || inc.status}
                  </span>
                </td>

                {/* Icon-only view button */}
                <td className="inc-table__td inc-table__td--action">
                  <div className="inc-table__actions">
                    <button
                      type="button"
                      onClick={() => onViewDetails(inc)}
                      className="inc-table__view-btn"
                      aria-label={`View details for ${normalizeIncidentType(inc.incidentType)}`}
                      title="View full details"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                    {inc.onDelete && (
                      <button
                        type="button"
                        onClick={() => inc.onDelete(inc)}
                        className="inc-table__view-btn inc-table__view-btn--delete"
                        aria-label={`Delete ${normalizeIncidentType(inc.incidentType)}`}
                        title="Permanently Delete"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── Table Footer Pagination ────────────────────── */}
      <Pagination
        currentPage={currentPage}
        totalItems={incidents.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        itemLabel="incidents"
      />
    </div>
  );
}

export default AdminIncidentTable;
