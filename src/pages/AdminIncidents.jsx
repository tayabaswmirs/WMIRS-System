import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { subscribeToAllIncidents, adminOverrideIncident, deleteIncidentReport } from "../firebase/services/incidentService";
import DashboardLayout from "../components/layout/DashboardLayout";
import AdminIncidentTable from "../components/common/AdminIncidentTable";
import IncidentDetailsModal from "../components/common/IncidentDetailsModal";
import ConfirmationModal from "../components/common/ConfirmationModal";
import ConfirmModal from "../components/common/ConfirmModal";
import ExportModal from "../components/common/ExportModal";
import { exportToCSV, exportToPDF } from "../utils/exportService";
import StatPill from "../components/common/StatPill";
import { getStatusesByLabel } from "../utils/incidentConstants";
import "../styles/dashboard.css";

// Filter tab options displayed above the table
const STATUS_FILTERS = ["All", "Submitted", "Denied", "Open Assignment", "Pending Verification", "Pending Completion", "Completed"];

function AdminIncidents() {
  const { currentUser } = useAuth();

  const [incidents, setIncidents]               = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeFilter, setActiveFilter]         = useState("All");
  const [searchQuery, setSearchQuery]           = useState("");
  const [confirmDialog, setConfirmDialog]       = useState(null);
  const [deleteDialog, setDeleteDialog]         = useState(null);
  const [isExportOpen, setIsExportOpen]         = useState(false);

  /* Real-time subscription to ALL incidents in the system */
  useEffect(() => {
    const unsubscribe = subscribeToAllIncidents(setIncidents);
    return unsubscribe;
  }, []);

  /* Derived stat counters using single-pass reducer */
  const stats = useMemo(() => {
    return incidents.reduce((acc, r) => {
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
  }, [incidents]);

  /* Filtered + searched list shown in the table */
  const filteredIncidents = useMemo(() => {
    const byStatus = activeFilter === "All"
      ? incidents
      : incidents.filter((r) => getStatusesByLabel(activeFilter).includes(r.status?.toLowerCase()));
    if (!searchQuery.trim()) return byStatus;
    const q = searchQuery.toLowerCase();
    return byStatus.filter((r) =>
      r.incidentType?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.reporter?.name?.toLowerCase().includes(q)
    );
  }, [incidents, activeFilter, searchQuery]);

  const handleStatusChangeRequest = (incidentId, newStatus, remarks) => {
    return new Promise((resolve, reject) => {
      setConfirmDialog({ incidentId, newStatus, remarks, resolve, reject });
    });
  };

  const isLocking = confirmDialog?.newStatus === "completed" || confirmDialog?.newStatus === "denied";

  const executeStatusChange = async () => {
    if (!confirmDialog) return;
    const { incidentId, newStatus, remarks, resolve } = confirmDialog;
    try {
      await adminOverrideIncident(incidentId, newStatus, currentUser.uid, currentUser.displayName, remarks || "Admin override via dashboard");
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident((prev) => ({ ...prev, status: newStatus }));
      }
      resolve(true); // Return success to caller
    } catch (err) {
      console.error(err);
      if (confirmDialog.reject) confirmDialog.reject(err);
    } finally {
      setConfirmDialog(null);
    }
  };

  const cancelStatusChange = () => {
    if (confirmDialog?.resolve) {
      confirmDialog.resolve(false); // Return false instead of rejecting to avoid messy unhandled promise rejections
    }
    setConfirmDialog(null);
  };

  const handleDeleteRequest = (incident) => {
    setDeleteDialog(incident);
  };

  const executeDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteIncidentReport(deleteDialog.id);
      if (selectedIncident?.id === deleteDialog.id) {
        setSelectedIncident(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleExport = ({ format, dateRange, category }) => {
    let dataToExport = incidents;
    
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
      type: i.incidentType,
      reporter: i.reporter?.name || 'Unknown',
      location: i.location,
      status: i.status,
      severity: i.severity,
      date: i.createdAt?.seconds ? new Date(i.createdAt.seconds * 1000) : ''
    }));

    if (format === 'csv') {
      exportToCSV(exportData, `WMIRS_Incidents_Export_${new Date().toISOString().split('T')[0]}`);
    } else {
      exportToPDF(
        exportData, 
        [
          { header: 'ID', dataKey: 'id' },
          { header: 'Category', dataKey: 'category' },
          { header: 'Type', dataKey: 'type' },
          { header: 'Reporter', dataKey: 'reporter' },
          { header: 'Location', dataKey: 'location' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Date', dataKey: 'date' }
        ], 
        `WMIRS_Incidents_Export_${new Date().toISOString().split('T')[0]}`,
        'WMIRS Incident Reports'
      );
    }
  };

  const incidentsWithDelete = filteredIncidents.map(inc => ({
    ...inc,
    onDelete: handleDeleteRequest
  }));

  return (
    <DashboardLayout>
      <div className="incidents-page">

        {/* ── Hero Header Band ─────────────────────────────────────────── */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">Administration</span>
            <h1 className="inc-hero__title">Incident Management</h1>
            <p className="inc-hero__subtitle">
              Review, investigate, and resolve all submitted environmental incident reports.
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

        {/* ── Incident History Table Card ──────────────────────────────── */}
        <div className="inc-history-card card-base">
          <div className="inc-history-card__head">
            <h2 className="inc-history-card__title">All Incident Reports</h2>
            {/* Search input */}
            <div className="inc-search-wrap">
              <span className="material-symbols-outlined inc-search-icon">search</span>
              <input
                id="admin-inc-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search type, category, location, reporter…"
                className="inc-search-input"
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
          <AdminIncidentTable
            incidents={incidentsWithDelete}
            onStatusChange={handleStatusChangeRequest}
            onViewDetails={setSelectedIncident}
          />
        </div>

        {/* Export Reports Button placed as a separate element below the table card */}
        <div className="flex justify-end mt-6">
          <button 
            onClick={() => setIsExportOpen(true)}
            className="flex items-center bg-[#00ed64] text-[#001e2b] font-semibold rounded-full hover:bg-[#00c552] active:bg-[#00a344] transition-all shadow-md hover:shadow-lg focus:outline-none"
            style={{ padding: "12px 32px", gap: "8px" }}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ margin: 0, padding: 0, lineHeight: 1 }}>download</span>
            Export Reports
          </button>
        </div>

        {/* Right-side detail drawer — admin mode */}
        <IncidentDetailsModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          isAdmin
          onStatusChange={handleStatusChangeRequest}
        />

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!confirmDialog}
          title={isLocking ? "Lock Incident Status?" : "Confirm Status Change"}
          message={
            isLocking 
              ? `Are you sure you want to change the status of this incident report to "${confirmDialog?.newStatus}"? This action is irreversible and the report will be locked.`
              : `Are you sure you want to change the status of this incident report to "${confirmDialog?.newStatus}"?`
          }
          onConfirm={executeStatusChange}
          onCancel={cancelStatusChange}
          confirmText={isLocking ? "Confirm & Lock" : "Confirm"}
          isDestructive={isLocking}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteDialog}
          title="Permanently Delete Report?"
          message={`Are you sure you want to delete incident report ${deleteDialog?.id}? This will permanently remove all associated data and files. This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={executeDelete}
          onCancel={() => setDeleteDialog(null)}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          onExport={handleExport}
          type="Incidents"
        />
      </div>
    </DashboardLayout>
  );
}

export default AdminIncidents;
