import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { subscribeToAllMonitoring, adminOverrideMonitoring, deleteMonitoringLog } from "../firebase/services/monitoringService";
import DashboardLayout from "../components/layout/DashboardLayout";
import MonitoringTable from "../components/common/monitoring/MonitoringTable";
import MonitoringDetailsModal from "../components/common/monitoring/MonitoringDetailsModal";
import StatPill from "../components/common/StatPill";
import ConfirmModal from "../components/common/ConfirmModal";
import ExportModal from "../components/common/ExportModal";
import { exportToCSV, exportToPDF } from "../utils/exportService";

const STATUS_FILTERS = ["All", "Submitted", "Under Review", "Approved", "Rejected/Flagged"];

function AdminMonitoring() {
  const { currentUser } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const stats = useMemo(() => ({
    total: logs.length,
    submitted: logs.filter((l) => l.status === "Submitted").length,
    underReview: logs.filter((l) => l.status === "Under Review").length,
    approved: logs.filter((l) => l.status === "Approved").length,
  }), [logs]);

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

  const handleExport = ({ format, dateRange, category }) => {
    let dataToExport = logs;
    
    if (category !== 'all') {
      dataToExport = dataToExport.filter(i => i.category === category);
    }
    
    if (dateRange !== 'all') {
      const now = new Date();
      let days = 0;
      if (dateRange === '30days') days = 30;
      if (dateRange === '7days') days = 7;
      if (dateRange === 'today') days = 1;
      
      const cutoff = new Date(now.setDate(now.getDate() - days));
      dataToExport = dataToExport.filter(i => {
        const d = i.createdAt?.seconds ? new Date(i.createdAt.seconds * 1000) : null;
        return d && d >= cutoff;
      });
    }

    const exportData = dataToExport.map(i => ({
      id: i.id,
      category: i.category,
      subcategory: i.subcategory,
      reporter: i.reporter?.name || 'Unknown',
      status: i.status,
      date: i.createdAt?.seconds ? new Date(i.createdAt.seconds * 1000) : ''
    }));

    if (format === 'csv') {
      exportToCSV(exportData, `WMIRS_Monitoring_Export_${new Date().toISOString().split('T')[0]}`);
    } else {
      exportToPDF(
        exportData, 
        [
          { header: 'ID', dataKey: 'id' },
          { header: 'Category', dataKey: 'category' },
          { header: 'Subcategory', dataKey: 'subcategory' },
          { header: 'Reporter', dataKey: 'reporter' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Date', dataKey: 'date' }
        ], 
        `WMIRS_Monitoring_Export_${new Date().toISOString().split('T')[0]}`,
        'WMIRS Monitoring Logs'
      );
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

  const logsWithDelete = filteredLogs.map(log => ({
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
            <StatPill icon="inventory_2"     label="Total"        count={stats.total}       color="var(--brand-green, #00ed64)" />
            <StatPill icon="mark_email_unread" label="Submitted"  count={stats.submitted}   color="#3d8eff" />
            <StatPill icon="pending_actions"  label="Under Review" count={stats.underReview} color="#f5a524" />
            <StatPill icon="task_alt"         label="Approved"    count={stats.approved}    color="#00ed64" />
          </div>
          <div className="mt-6 flex">
            <button 
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--c-bg-subtle)] text-[var(--c-stone)] border border-[var(--c-border)] rounded hover:border-[var(--c-brand)] hover:text-[var(--c-brand)] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Logs
            </button>
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
              logs={logsWithDelete}
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
          onExport={handleExport}
          type="Monitoring Logs"
        />
      </div>
    </DashboardLayout>
  );
}

export default AdminMonitoring;
