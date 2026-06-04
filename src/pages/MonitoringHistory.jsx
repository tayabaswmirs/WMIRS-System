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

export default MonitoringHistory;
