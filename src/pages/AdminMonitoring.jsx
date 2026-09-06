import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { subscribeToAllMonitoring, adminOverrideMonitoring, deleteMonitoringLog } from "../firebase/services/monitoringService";
import { useLogFilters } from "../hooks/useLogFilters";
import DashboardLayout from "../components/layout/DashboardLayout";
import MonitoringTable from "../components/common/monitoring/MonitoringTable";
import MonitoringDetailsModal from "../components/common/monitoring/MonitoringDetailsModal";
import StatPill from "../components/common/StatPill";
import SearchFilterBar from "../components/common/SearchFilterBar";
import ConfirmModal from "../components/common/ConfirmModal";
import ExportModal from "../components/common/ExportModal";

function AdminMonitoring() {
  const { currentUser } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  /* Headless filter engine */
  const filterHook = useLogFilters(logs, { mode: "monitoring", isAdmin: true });

  const stats = useMemo(() => {
    return logs.reduce((acc, r) => {
      const status = r.status?.toLowerCase();
      acc.total += 1;
      if (status === "submitted" || status === "under review") {
        acc.submitted += 1;
      } else if (status === "assigned" || status === "unresolved") {
        acc.active += 1;
      } else if (status === "resolved") {
        acc.resolved += 1;
      } else if (status === "verified" || status === "pending completion" || status === "completed" || status === "denied") {
        acc.approved += 1;
      }
      return acc;
    }, { total: 0, submitted: 0, active: 0, resolved: 0, approved: 0 });
  }, [logs]);

  useEffect(() => {
    const unsubscribe = subscribeToAllMonitoring((data) => {
      setLogs(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleStatusChange = async (logId, newStatus, remarks) => {
    if (!currentUser?.uid) return;
    try {
      await adminOverrideMonitoring(logId, newStatus, currentUser.uid, currentUser.displayName, remarks || "Admin override via dashboard");
      if (selectedLog?.id === logId) {
        setSelectedLog((prev) => ({ ...prev, status: newStatus, adminRemarks: remarks }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRequest = (log) => {
    setDeleteDialog(log);
  };

  const executeDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteMonitoringLog(deleteDialog.id);
      if (selectedLog?.id === deleteDialog.id) {
        setSelectedLog(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteDialog(null);
    }
  };

  const logsWithDelete = filterHook.filteredItems.map((log) => ({
    ...log,
    onDelete: handleDeleteRequest
  }));

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
          <div className="inc-hero__stats">
            <StatPill icon="inventory_2" label="Total" count={stats.total} color="#a8b3bc" />
            <StatPill icon="mark_email_unread" label="Awaiting Review" count={stats.submitted} color="#3d8eff" />
            <StatPill icon="assignment" label="Active Tasks" count={stats.active} color="#fa6e39" />
            <StatPill icon="pending_actions" label="Pending Verification" count={stats.resolved} color="#00a35c" />
            <StatPill icon="task_alt" label="Approved/Completed" count={stats.approved} color="#00ed64" />
          </div>
        </div>

        {/* List & Filters */}
        <div className="inc-history-card card-base">
          <div className="inc-history-card__head">
            <h2 className="inc-history-card__title">All Monitoring Logs</h2>
          </div>

          {/* Comprehensive Search & Multi-Toggle Filter Bar */}
          <SearchFilterBar
            filterHook={filterHook}
            placeholder="Search subcategory, reporter, species, location, water body..."
            mode="monitoring"
            isAdmin={true}
          />

          {loading ? (
            <p className="loading-text" style={{ padding: "32px", textAlign: "center", color: "var(--c-steel)" }}>
              Loading logs...
            </p>
          ) : (
            <MonitoringTable
              logs={logsWithDelete}
              isAdmin
              onStatusChange={handleStatusChange}
              onViewDetails={setSelectedLog}
            />
          )}
        </div>

        <div className="inc-export-action-row">
          <button 
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="inc-export-btn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
            <span>Export Logs</span>
          </button>
        </div>

        {/* Drawer Details Modal */}
        <MonitoringDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          isAdmin
          onStatusChange={handleStatusChange}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteDialog}
          title="Permanently Delete Log?"
          message={`Are you sure you want to delete monitoring log ${deleteDialog?.id}? This will permanently remove all associated data and files. This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={executeDelete}
          onCancel={() => setDeleteDialog(null)}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          scope="All Monitoring"
          data={logs}
        />
      </div>
    </DashboardLayout>
  );
}

export default AdminMonitoring;
