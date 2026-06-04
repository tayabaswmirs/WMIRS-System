import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { subscribeToAllIncidents, updateIncidentStatus } from "../firebase/services/incidentService";
import DashboardLayout from "../components/layout/DashboardLayout";
import AdminIncidentTable from "../components/common/AdminIncidentTable";
import IncidentDetailsModal from "../components/common/IncidentDetailsModal";
import ConfirmationModal from "../components/common/ConfirmationModal";
import "../styles/dashboard.css";

// Filter tab options displayed above the table
const STATUS_FILTERS = ["All", "Submitted", "Under Review", "Resolved", "Dismissed"];

function AdminIncidents() {
  const { currentUser } = useAuth();

  const [incidents, setIncidents]               = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeFilter, setActiveFilter]         = useState("All");
  const [searchQuery, setSearchQuery]           = useState("");
  const [confirmDialog, setConfirmDialog]       = useState(null);

  /* Real-time subscription to ALL incidents in the system */
  useEffect(() => {
    const unsubscribe = subscribeToAllIncidents(setIncidents);
    return unsubscribe;
  }, []);

  /* Derived stat counters for the hero header */
  const stats = useMemo(() => ({
    total:       incidents.length,
    submitted:   incidents.filter((r) => r.status === "Submitted").length,
    underReview: incidents.filter((r) => r.status === "Under Review").length,
    resolved:    incidents.filter((r) => r.status === "Resolved").length,
  }), [incidents]);

  /* Filtered + searched list shown in the table */
  const filteredIncidents = useMemo(() => {
    const byStatus = activeFilter === "All"
      ? incidents
      : incidents.filter((r) => r.status === activeFilter);
    if (!searchQuery.trim()) return byStatus;
    const q = searchQuery.toLowerCase();
    return byStatus.filter((r) =>
      r.incidentType?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.reporter?.name?.toLowerCase().includes(q)
    );
  }, [incidents, activeFilter, searchQuery]);

  const handleStatusChangeRequest = (incidentId, newStatus) => {
    return new Promise((resolve, reject) => {
      setConfirmDialog({ incidentId, newStatus, resolve, reject });
    });
  };

  const isLocking = confirmDialog?.newStatus === "Resolved" || confirmDialog?.newStatus === "Dismissed";

  const executeStatusChange = async () => {
    if (!confirmDialog) return;
    const { incidentId, newStatus, resolve } = confirmDialog;
    try {
      await updateIncidentStatus(incidentId, newStatus, currentUser.uid);
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
            <StatPill icon="inventory_2"     label="Total"        count={stats.total}       color="var(--brand-green, #00ed64)" />
            <StatPill icon="mark_email_unread" label="Submitted"  count={stats.submitted}   color="#3d8eff" />
            <StatPill icon="pending_actions"  label="Under Review" count={stats.underReview} color="#f5a524" />
            <StatPill icon="task_alt"         label="Resolved"    count={stats.resolved}    color="#00ed64" />
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
            incidents={filteredIncidents}
            onStatusChange={handleStatusChangeRequest}
            onViewDetails={setSelectedIncident}
          />
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

export default AdminIncidents;
