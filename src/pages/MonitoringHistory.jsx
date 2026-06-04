import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { subscribeToReporterMonitoring } from "../firebase/services/monitoringService";
import DashboardLayout from "../components/layout/DashboardLayout";
import MonitoringTable from "../components/common/monitoring/MonitoringTable";
import MonitoringDetailsModal from "../components/common/monitoring/MonitoringDetailsModal";

const STATUS_FILTERS = ["All", "Submitted", "Under Review", "Approved", "Rejected/Flagged"];

function MonitoringHistory() {
  const { currentUser } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = subscribeToReporterMonitoring(currentUser.uid, (data) => {
      setLogs(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUser?.uid]);

  const stats = useMemo(() => ({
    submitted:   logs.filter((r) => r.status === "Submitted").length,
    underReview: logs.filter((r) => r.status === "Under Review").length,
    approved:    logs.filter((r) => r.status === "Approved").length,
    rejected:    logs.filter((r) => r.status === "Rejected/Flagged").length,
  }), [logs]);

  const filteredLogs = useMemo(() => {
    const byStatus = activeFilter === "All" 
      ? logs 
      : logs.filter((log) => log.status === activeFilter);

    if (!searchQuery.trim()) return byStatus;
    const q = searchQuery.toLowerCase();
    
    return byStatus.filter((log) => 
      log.subcategory?.toLowerCase().includes(q) ||
      log.category?.toLowerCase().includes(q) ||
      (log.speciesName && log.speciesName.toLowerCase().includes(q)) ||
      (log.avianSpecies && log.avianSpecies.toLowerCase().includes(q)) ||
      (log.barangay && log.barangay.toLowerCase().includes(q)) ||
      (log.waterBody && log.waterBody.toLowerCase().includes(q))
    );
  }, [logs, activeFilter, searchQuery]);

  return (
    <DashboardLayout>
      <div className="incidents-page">
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">ENRO Staff Portal</span>
            <h1 className="inc-hero__title">Monitoring History</h1>
            <p className="inc-hero__subtitle">
              Review and inspect your submitted ecological and compliance logs.
            </p>
          </div>
          <div className="inc-hero__stats">
            <StatPill icon="upload_file" label="Submitted" count={stats.submitted} color="#f5a524" />
            <StatPill icon="manage_search" label="Under Review" count={stats.underReview} color="#0080ff" />
            <StatPill icon="task_alt" label="Approved" count={stats.approved} color="#00ed64" />
            <StatPill icon="block" label="Rejected" count={stats.rejected} color="var(--c-warn-text)" />
          </div>
        </div>

        {/* List & Filters */}
        <div className="inc-history-card card-base">
          <div className="inc-history-card__head">
            <h2 className="inc-history-card__title">Your Submissions</h2>
            
            <div className="inc-search-wrap">
              <span className="material-symbols-outlined inc-search-icon">search</span>
              <input
                id="mon-history-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subcategory, location, species..."
                className="inc-search-input"
              />
            </div>
          </div>

          <div className="inc-filter-tabs" role="tablist" aria-label="Filter monitoring by status">
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

          {loading ? (
            <p className="loading-text" style={{ padding: "32px", textAlign: "center", color: "var(--c-steel)" }}>
              Loading logs...
            </p>
          ) : (
            <MonitoringTable
              logs={filteredLogs}
              onViewDetails={setSelectedLog}
            />
          )}
        </div>

        {/* Drawer Details Modal */}
        <MonitoringDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
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

export default MonitoringHistory;
