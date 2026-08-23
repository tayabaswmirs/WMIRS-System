import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  subscribeToCategoryMonitoring,
  adminOverrideMonitoring,
  deleteMonitoringLog
} from "../firebase/services/monitoringService";
import DashboardLayout from "../components/layout/DashboardLayout";
import MonitoringTable from "../components/common/monitoring/MonitoringTable";
import MonitoringDetailsModal from "../components/common/monitoring/MonitoringDetailsModal";
import StatPill from "../components/common/StatPill";
import StatusFilterBar from "../components/common/StatusFilterBar";
import ConfirmModal from "../components/common/ConfirmModal";
import ExportModal from "../components/common/ExportModal";
import { exportToCSV, exportToPDF } from "../utils/exportService";
import { getStatusesByLabel } from "../utils/incidentConstants";
import "../styles/dashboard.css";

const STATUS_FILTERS = ["All", "Submitted", "Denied", "Open Assignment", "Pending Verification", "Pending Completion", "Completed"];

const CATEGORY_INFO = {
  BMS: {
    title: "Biodiversity Monitoring (BMS)",
    eyebrow: "Administration",
    subtitle: "Verify, audit, and approve all submitted flora & fauna monitoring logs.",
    tableTitle: "All BMS Monitoring Logs",
    searchPlaceholder: "Search subcategory, reporter, species, location...",
    icon: "forest",
    color: "#00b545"
  },
  Water: {
    title: "Water Resources Monitoring",
    eyebrow: "Administration",
    subtitle: "Verify, audit, and approve all submitted watershed & water quality logs.",
    tableTitle: "All Water Monitoring Logs",
    searchPlaceholder: "Search water body, flow, parameters, reporter, location...",
    icon: "water",
    color: "#3d8eff"
  },
  Compliance: {
    title: "Environmental Compliance Monitoring",
    eyebrow: "Administration",
    subtitle: "Verify, audit, and approve solid waste and commercial inspection logs.",
    tableTitle: "All Compliance Monitoring Logs",
    searchPlaceholder: "Search business name, barangay, violations, reporter...",
    icon: "verified_user",
    color: "#fa6e39"
  }
};

export default function AdminMonitoringCategoryLogs({ category = "BMS" }) {
  const { currentUser } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const info = CATEGORY_INFO[category] || CATEGORY_INFO.BMS;

  useEffect(() => {
    const unsubscribe = subscribeToCategoryMonitoring(category, (data) => {
      setLogs(data);
      setLoading(false);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [category]);

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

  const filteredLogs = useMemo(() => {
    const byStatus = activeFilter === "All"
      ? logs
      : logs.filter((r) => getStatusesByLabel(activeFilter).includes(r.status?.toLowerCase()));

    if (!searchQuery.trim()) return byStatus;
    const q = searchQuery.toLowerCase();
    return byStatus.filter((r) =>
      r.subcategory?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.reporter?.name?.toLowerCase().includes(q) ||
      r.waterBody?.toLowerCase().includes(q) ||
      r.businessName?.toLowerCase().includes(q)
    );
  }, [logs, activeFilter, searchQuery]);

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

  const handleExport = ({ format, dateRange }) => {
    let dataToExport = logs;
    if (dateRange !== "all") {
      const now = new Date();
      let days = dateRange === "30days" ? 30 : dateRange === "7days" ? 7 : 1;
      const cutoff = new Date(now.setDate(now.getDate() - days));
      dataToExport = dataToExport.filter(i => {
        const d = i.createdAt?.seconds ? new Date(i.createdAt.seconds * 1000) : null;
        return d && d >= cutoff;
      });
    }
    if (format === "csv") {
      exportToCSV(dataToExport, `WMIRS_${category}_Monitoring_Logs_${new Date().toISOString().split("T")[0]}`);
    } else {
      exportToPDF(
        dataToExport,
        [
          { header: "ID", dataKey: "id" },
          { header: "Category", dataKey: "category" },
          { header: "Subcategory", dataKey: "subcategory" },
          { header: "Reporter", dataKey: "reporter" },
          { header: "Location", dataKey: "location" },
          { header: "Status", dataKey: "status" },
          { header: "Date", dataKey: "date" }
        ],
        `WMIRS_${category}_Monitoring_Logs_${new Date().toISOString().split("T")[0]}`,
        `WMIRS ${category} Monitoring Logs Report`
      );
    }
  };

  const logsWithDelete = filteredLogs.map(log => ({
    ...log,
    onDelete: handleDeleteRequest
  }));

  return (
    <DashboardLayout>
      <div className="incidents-page">
        {/* ── Hero Header Band ─────────────────────────────────────────── */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">{info.eyebrow}</span>
            <h1 className="inc-hero__title">{info.title}</h1>
            <p className="inc-hero__subtitle">{info.subtitle}</p>
          </div>
          <div className="inc-hero__stats">
            <StatPill icon="inventory_2" label="Total" count={stats.total} color="#a8b3bc" />
            <StatPill icon="mark_email_unread" label="Awaiting Review" count={stats.submitted} color="#3d8eff" />
            <StatPill icon="assignment" label="Active Tasks" count={stats.active} color="#fa6e39" />
            <StatPill icon="pending_actions" label="Pending Verification" count={stats.resolved} color="#00a35c" />
            <StatPill icon="task_alt" label="Approved/Completed" count={stats.approved} color="#00ed64" />
          </div>
        </div>

        {/* ── History Table Card (card-base container) ────────────────── */}
        <div className="inc-history-card card-base">
          <div className="inc-history-card__head">
            <h2 className="inc-history-card__title">{info.tableTitle}</h2>
            
            {/* Search Input */}
            <div className="inc-search-wrap">
              <span className="material-symbols-outlined inc-search-icon">search</span>
              <input
                id={`mon-${category.toLowerCase()}-search`}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={info.searchPlaceholder}
                className="inc-search-input"
              />
            </div>
          </div>

          {/* Status filter tabs & mobile dropdown */}
          <StatusFilterBar
            filters={STATUS_FILTERS}
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
            ariaLabel={`Filter ${category} monitoring by status`}
            selectId={`mon-${category.toLowerCase()}-filter-select`}
          />

          {/* Monitoring Table */}
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

        {/* Export Reports Button */}
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
          onExport={handleExport}
          type={`${category} Monitoring Logs`}
        />
      </div>
    </DashboardLayout>
  );
}
