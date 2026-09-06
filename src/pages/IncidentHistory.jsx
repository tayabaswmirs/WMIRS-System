import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { subscribeToReporterIncidents } from "../firebase/services/incidentService";
import { useLogFilters } from "../hooks/useLogFilters";
import DashboardLayout from "../components/layout/DashboardLayout";
import IncidentDetailsModal from "../components/common/IncidentDetailsModal";
import { CATEGORY_META, getSeverityClass, getStatusClass, getStatusLabel, formatIncidentDate } from "../utils/incidentConstants";
import { isCriticalSubmitted } from "../utils/filterUtils";
import StatPill from "../components/common/StatPill";
import SearchFilterBar from "../components/common/SearchFilterBar";
import "../styles/dashboard.css";

function IncidentHistory() {
  const { currentUser } = useAuth();
  
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);

  /* Live subscription to this reporter's incidents */
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = subscribeToReporterIncidents(currentUser.uid, setIncidents);
    return unsubscribe;
  }, [currentUser?.uid]);

  /* Headless filter engine */
  const filterHook = useLogFilters(incidents, { mode: "incident", isAdmin: false });

  /* Derived stats using a high-performance single pass reducer */
  const stats = useMemo(() => {
    return incidents.reduce((acc, r) => {
      const status = r.status?.toLowerCase();
      if (status === "submitted" || status === "under review") {
        acc.submitted += 1;
      } else if (status === "denied") {
        acc.denied += 1;
      } else if (status === "assigned" || status === "unresolved") {
        acc.active += 1;
      } else if (status === "resolved") {
        acc.resolved += 1;
      } else if (status === "verified" || status === "pending completion") {
        acc.verified += 1;
      } else if (status === "completed") {
        acc.completed += 1;
      }
      return acc;
    }, { submitted: 0, denied: 0, active: 0, resolved: 0, verified: 0, completed: 0 });
  }, [incidents]);

  return (
    <DashboardLayout>
      <div className="incidents-page">
        {/* ── Hero Header Band ─────────────────────────────────────────── */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">ENRO Staff Portal</span>
            <h1 className="inc-hero__title">Incident History</h1>
            <p className="inc-hero__subtitle">
              Review and track your previously reported environmental incidents.
            </p>
          </div>
          <div className="inc-hero__stats">
            <StatPill icon="upload_file" label="Submitted" count={stats.submitted} color="#3d8eff" />
            <StatPill icon="assignment" label="Open Assignment" count={stats.active} color="#fa6e39" />
            <StatPill icon="pending_actions" label="Pending Verification" count={stats.resolved} color="#00a35c" />
            <StatPill icon="verified" label="Pending Completion" count={stats.verified} color="#7b3ff2" />
            <StatPill icon="task_alt" label="Completed" count={stats.completed} color="#00ed64" />
          </div>
        </div>

        {/* ── Incident History Log ──────────────────────────────────────── */}
        <div className="inc-history-card card-base">
          <div className="inc-history-card__head">
            <h2 className="inc-history-card__title">Incident History Log</h2>
          </div>

          {/* Comprehensive Search & Multi-Toggle Filter Bar */}
          <SearchFilterBar
            filterHook={filterHook}
            placeholder="Search by type, category, location, description..."
            mode="incident"
            isAdmin={false}
          />

          {/* Table */}
          {filterHook.filteredItems.length === 0 ? (
            <div className="inc-empty-state">
              <span className="material-symbols-outlined inc-empty-state__icon">assignment_late</span>
              <p className="inc-empty-state__text">
                {incidents.length === 0 ? "No incidents reported yet." : "No incidents match your filters."}
              </p>
            </div>
          ) : (
            <div className="inc-table-wrap">
              <table className="inc-table">
                <thead className="inc-table__head">
                  <tr>
                    <th className="inc-table__th">Category</th>
                    <th className="inc-table__th">Incident Type</th>
                    <th className="inc-table__th">Location</th>
                    <th className="inc-table__th">Date Reported</th>
                    <th className="inc-table__th">Severity</th>
                    <th className="inc-table__th inc-table__th--status">Status</th>
                    <th className="inc-table__th inc-table__th--action">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filterHook.filteredItems.map((rep, idx) => {
                    const catMeta = CATEGORY_META[rep.category] ?? { icon: "report", color: "#00ed64" };
                    const isPriority = isCriticalSubmitted(rep);
                    return (
                      <tr
                        key={rep.id}
                        className={`inc-table__row${idx % 2 === 0 ? " inc-table__row--even" : ""}${isPriority ? " inc-table__row--priority" : ""}`}
                      >
                        {/* Category with color dot + icon */}
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
                            <span className="inc-cat-cell__label">{rep.category}</span>
                          </div>
                        </td>
                        <td className="inc-table__td inc-table__td--bold">{rep.incidentType}</td>
                        <td className="inc-table__td inc-table__td--muted">{rep.location}</td>
                        <td className="inc-table__td inc-table__td--muted">{formatIncidentDate(rep.dateTime)}</td>
                        <td className="inc-table__td">
                          <span className={`severity-badge ${getSeverityClass(rep.severity)}`}>{rep.severity}</span>
                        </td>
                        <td className="inc-table__td inc-table__td--status">
                          <span className={`status-badge ${getStatusClass(rep.status)}${isPriority ? " status-badge--priority" : ""}`}>
                            {isPriority && (
                              <span className="material-symbols-outlined" style={{ fontSize: "14px", marginRight: "2px" }} aria-hidden="true">
                                priority_high
                              </span>
                            )}
                            {getStatusLabel(rep.status)}
                          </span>
                        </td>
                        <td className="inc-table__td inc-table__td--action">
                          <div className="inc-table__actions">
                            <button
                              onClick={() => setSelectedIncident(rep)}
                              className="inc-table__view-btn"
                              type="button"
                              aria-label={`View details for ${rep.incidentType}`}
                              title="View details"
                            >
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right-side detail drawer */}
        <IncidentDetailsModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      </div>
    </DashboardLayout>
  );
}

export default IncidentHistory;
