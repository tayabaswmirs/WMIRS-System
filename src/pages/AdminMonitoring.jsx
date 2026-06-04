import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { subscribeToAllMonitoring, updateMonitoringStatus } from "../firebase/services/monitoringService";
import DashboardLayout from "../components/layout/DashboardLayout";
import MonitoringTable from "../components/common/monitoring/MonitoringTable";
import MonitoringDetailsModal from "../components/common/monitoring/MonitoringDetailsModal";

const STATUS_FILTERS = ["All", "Submitted", "Under Review", "Approved", "Rejected/Flagged"];

function AdminMonitoring() {
  const { currentUser } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllMonitoring((data) => {
      setLogs(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleStatusChange = async (logId, newStatus, remarks) => {
    if (!currentUser?.uid) return;
    await updateMonitoringStatus(logId, newStatus, currentUser.uid, remarks);
    if (selectedLog?.id === logId) {
      setSelectedLog((prev) => ({ ...prev, status: newStatus, adminRemarks: remarks }));
    }
  };

  const filteredLogs = useMemo(() => {
    const byStatus = activeFilter === "All" 
      ? logs 
      : logs.filter((log) => log.status === activeFilter);

    if (!searchQuery.trim()) return byStatus;
    const q = searchQuery.toLowerCase();
    
    return byStatus.filter((log) => 
      log.subcategory?.toLowerCase().includes(q) ||
      log.category?.toLowerCase().includes(q) ||
      (log.reporter?.name && log.reporter.name.toLowerCase().includes(q)) ||
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
            <span className="inc-hero__eyebrow">Administration</span>
            <h1 className="inc-hero__title">Ecological Audits</h1>
            <p className="inc-hero__subtitle">
              Verify, audit, and approve all submitted staff monitoring logs.
            </p>
          </div>
        </div>

        {/* List & Filters */}
        <div className="inc-history-card card-base">
          <div className="inc-history-card__head">
            <h2 className="inc-history-card__title">All Monitoring Logs</h2>
            
            <div className="inc-search-wrap">
              <span className="material-symbols-outlined inc-search-icon">search</span>
              <input
                id="mon-admin-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subcategory, reporter, species, location..."
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
              isAdmin
              onStatusChange={handleStatusChange}
              onViewDetails={setSelectedLog}
            />
          )}
        </div>

        {/* Drawer Details Modal */}
        <MonitoringDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          isAdmin
          onStatusChange={handleStatusChange}
        />
      </div>
    </DashboardLayout>
  );
}

export default AdminMonitoring;
