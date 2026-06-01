import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { createIncidentReport, subscribeToReporterIncidents } from "../firebase/services/incidentService";
import DashboardLayout from "../components/layout/DashboardLayout";
import IncidentForm from "../components/common/IncidentForm";
import IncidentDetailsModal from "../components/common/IncidentDetailsModal";
import { CATEGORY_META, getSeverityClass, getStatusClass, formatIncidentDate } from "../utils/incidentConstants";
import "../styles/dashboard.css";

// Filter options rendered as tabs above the history table
const STATUS_FILTERS = ["All", "Submitted", "Under Review", "Resolved", "Dismissed"];

function Incidents() {
  const { currentUser, profileData } = useAuth();

  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [formFeedback, setFormFeedback]     = useState({ type: "", message: "" });

  const [incidents, setIncidents]           = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeFilter, setActiveFilter]     = useState("All");
  const [searchQuery, setSearchQuery]       = useState("");

  /* Live subscription to this reporter's incidents */
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = subscribeToReporterIncidents(currentUser.uid, setIncidents);
    return unsubscribe;
  }, [currentUser?.uid]);

  /* Derived stats */
  const stats = useMemo(() => ({
    total:    incidents.length,
    pending:  incidents.filter((r) => r.status === "Submitted" || r.status === "Under Review").length,
    resolved: incidents.filter((r) => r.status === "Resolved").length,
  }), [incidents]);

  /* Filtered + searched slice of the incident list */
  const filteredIncidents = useMemo(() => {
    const byStatus = activeFilter === "All"
      ? incidents
      : incidents.filter((r) => r.status === activeFilter);
    if (!searchQuery.trim()) return byStatus;
    const q = searchQuery.toLowerCase();
    return byStatus.filter((r) =>
      r.incidentType?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q)
    );
  }, [incidents, activeFilter, searchQuery]);

  const handleFormSubmit = async (formData, onSuccess) => {
    setIsSubmitting(true);
    setFormFeedback({ type: "info", message: "Uploading evidence and submitting your report…" });
    setUploadProgress({});

    const incidentData = {
      category:     formData.category,
      incidentType: formData.incidentType,
      location:     formData.location,
      dateTime:     formData.dateTime,
      description:  formData.description,
      severity:     formData.severity,
      reporter: {
        uid:   currentUser.uid,
        name:  profileData?.name || currentUser.displayName || "Unknown User",
        email: currentUser.email,
        role:  profileData?.role || "user",
      },
    };

    try {
      await createIncidentReport(incidentData, formData.files, (fileIdx, progress) => {
        setUploadProgress((prev) => ({ ...prev, [fileIdx]: progress }));
      });
      setFormFeedback({ type: "success", message: "Incident successfully reported!" });
      onSuccess();
    } catch (err) {
      console.error("Incident submission failed:", err);
      setFormFeedback({ type: "error", message: "Failed to submit the incident. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="incidents-page">

        {/* ── Hero Header Band ─────────────────────────────────────────── */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">ENRO Staff Portal</span>
            <h1 className="inc-hero__title">Incident Reports</h1>
            <p className="inc-hero__subtitle">
              Document and track environmental violations across Tayabas City.
            </p>
          </div>
          <div className="inc-hero__stats">
            <StatPill icon="inventory_2" label="Total Filed" count={stats.total} color="var(--brand-green)" />
            <StatPill icon="pending_actions" label="Pending" count={stats.pending} color="#f5a524" />
            <StatPill icon="task_alt" label="Resolved" count={stats.resolved} color="#00ed64" />
          </div>
        </div>

        {/* ── Report New Incident Form ──────────────────────────────────── */}
        <IncidentForm
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          uploadProgress={uploadProgress}
          formFeedback={formFeedback}
          setFormFeedback={setFormFeedback}
        />

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
                          <span className={`status-badge ${getStatusClass(rep.status)}`}>{rep.status}</span>
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

/* ─── Stat Pill ──────────────────────────────────────────────────────────── */
function StatPill({ icon, label, count, color }) {
  return (
    <div className="inc-stat-pill">
      <span className="material-symbols-outlined inc-stat-pill__icon" style={{ color }} aria-hidden="true">
        {icon}
      </span>
      <div className="inc-stat-pill__body">
        <span className="inc-stat-pill__count" style={{ color }}>{count}</span>
        <span className="inc-stat-pill__label">{label}</span>
      </div>
    </div>
  );
}

export default Incidents;
