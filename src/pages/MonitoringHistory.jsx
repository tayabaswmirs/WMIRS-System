import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { subscribeToReporterMonitoring } from "../firebase/services/monitoringService";
import { useLogFilters } from "../hooks/useLogFilters";
import DashboardLayout from "../components/layout/DashboardLayout";
import MonitoringTable from "../components/common/monitoring/MonitoringTable";
import MonitoringDetailsModal from "../components/common/monitoring/MonitoringDetailsModal";
import StatPill from "../components/common/StatPill";
import SearchFilterBar from "../components/common/SearchFilterBar";

function MonitoringHistory() {
  const { currentUser } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  /* Headless filter engine */
  const filterHook = useLogFilters(logs, { mode: "monitoring", isAdmin: false });

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = subscribeToReporterMonitoring(currentUser.uid, (data) => {
      setLogs(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUser?.uid]);

  /* Derived stats using single-pass performance loop */
  const stats = useMemo(() => {
    return logs.reduce((acc, r) => {
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
  }, [logs]);

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
            <StatPill icon="upload_file" label="Submitted" count={stats.submitted} color="#3d8eff" />
            <StatPill icon="assignment" label="Open Assignment" count={stats.active} color="#fa6e39" />
            <StatPill icon="pending_actions" label="Pending Verification" count={stats.resolved} color="#00a35c" />
            <StatPill icon="verified" label="Pending Completion" count={stats.verified} color="#7b3ff2" />
            <StatPill icon="task_alt" label="Completed" count={stats.completed} color="#00ed64" />
          </div>
        </div>

        {/* List & Filters */}
        <div className="inc-history-card card-base">
          <div className="inc-history-card__head">
            <h2 className="inc-history-card__title">Your Submissions</h2>
          </div>

          {/* Comprehensive Search & Multi-Toggle Filter Bar */}
          <SearchFilterBar
            filterHook={filterHook}
            placeholder="Search subcategory, location, species, water body..."
            mode="monitoring"
            isAdmin={false}
          />

          {loading ? (
            <p className="loading-text" style={{ padding: "32px", textAlign: "center", color: "var(--c-steel)" }}>
              Loading logs...
            </p>
          ) : (
            <MonitoringTable
              logs={filterHook.filteredItems}
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
