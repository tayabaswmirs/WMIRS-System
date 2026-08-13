import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { subscribeToReporterIncidents } from "../firebase/services/incidentService";
import DashboardLayout from "../components/layout/DashboardLayout";
import IncidentDetailsModal from "../components/common/IncidentDetailsModal";
import { CATEGORY_META, getSeverityClass, getStatusClass, getStatusLabel, getStatusesByLabel, formatIncidentDate } from "../utils/incidentConstants";
import StatPill from "../components/common/StatPill";
import "../styles/dashboard.css";

// Filter options rendered as tabs above the history table
const STATUS_FILTERS = ["All", "Submitted", "Denied", "Open Assignment", "Pending Verification", "Pending Completion", "Completed"];

function IncidentHistory() {
  const { currentUser } = useAuth();
  
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  /* Live subscription to this reporter's incidents */
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = subscribeToReporterIncidents(currentUser.uid, setIncidents);
    return unsubscribe;
  }, [currentUser?.uid]);

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

  /* Filtered + searched slice of the incident list */
  const filteredIncidents = useMemo(() => {
    const byStatus = activeFilter === "All"
      ? incidents
      : incidents.filter((r) => getStatusesByLabel(activeFilter).includes(r.status?.toLowerCase()));
    if (!searchQuery.trim()) return byStatus;
    const q = searchQuery.toLowerCase();
    return byStatus.filter((r) =>
      r.incidentType?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q)
    );
  }, [incidents, activeFilter, searchQuery]);

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

            {/* Search input */}
            <div className="inc-search-wrap">
              <span className="material-symbols-outlined inc-search-icon">search</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by type, category, or location…"
                className="inc-search-input"
                id="inc-search-input"
              />
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="inc-filter-tabs" role="tablist" aria-label="Filter incidents by status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={activeFilter === f}
                onClick={() => setActiveFilter(f)}
                className={`inc-filter-tab${activeFilter === f ? " inc-filter-tab--active" : ""}`}
                type="button"
              >
                {f}
              </button>
            ))}
          </div>

          {/* Table */}
          {filteredIncidents.length === 0 ? (
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
                    <th className="inc-table__th">Status</th>
                    <th className="inc-table__th inc-table__th--action">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.map((rep, idx) => {
                    const catMeta = CATEGORY_META[rep.category] ?? { icon: "report", color: "#00ed64" };
                    return (
                      <tr
                        key={rep.id}
                        className={`inc-table__row${idx % 2 === 0 ? " inc-table__row--even" : ""}`}
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
                        <td className="inc-table__td">
                          <span className={`status-badge ${getStatusClass(rep.status)}`}>{getStatusLabel(rep.status)}</span>
                        </td>
                        <td className="inc-table__td inc-table__td--action">
                          <button
                            onClick={() => setSelectedIncident(rep)}
                            className="inc-table__view-btn"
                            type="button"
                            aria-label={`View details for ${rep.incidentType}`}
                            title="View details"
                          >
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
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
