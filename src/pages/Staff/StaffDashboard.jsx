import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { subscribeToAllIncidents, updateLogWorkflowStatus } from "../../firebase/services/incidentService";
import { subscribeToCategoryMonitoring, reviewMonitoringAtomic } from "../../firebase/services/monitoringService";
import IncidentDetailsModal from "../../components/common/IncidentDetailsModal";
import MonitoringDetailsModal from "../../components/common/monitoring/MonitoringDetailsModal";
import AdminIncidentTable from "../../components/common/AdminIncidentTable";
import MonitoringTable from "../../components/common/monitoring/MonitoringTable";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import StatPill from "../../components/common/StatPill";
import { getStatusesByLabel } from "../../utils/incidentConstants";
import "../../styles/dashboard.css";

function StaffDashboard() {
  const { currentUser, staffScope } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const isIncidents = staffScope === "incidents";

  useEffect(() => {
    let unsubscribe;
    if (isIncidents) {
      unsubscribe = subscribeToAllIncidents((data) => {
        setItems(data);
        setLoading(false);
      });
    } else if (staffScope) {
      unsubscribe = subscribeToCategoryMonitoring(staffScope, (data) => {
        setItems(data);
        setLoading(false);
      });
    } else {
      setTimeout(() => setLoading(false), 0);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [staffScope, isIncidents]);

  const STATUS_FILTERS = ["All", "Submitted", "Denied", "Open Assignment", "Pending Verification", "Pending Completion", "Completed"];

  const stats = useMemo(() => {
    // Single-pass reducer to calculate stats following client-side best practices
    return items.reduce((acc, r) => {
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
  }, [items]);

  const filteredItems = useMemo(() => {
    const byStatus = activeFilter === "All" 
      ? items 
      : items.filter((r) => getStatusesByLabel(activeFilter).includes(r.status?.toLowerCase()));
      
    if (!searchQuery.trim()) return byStatus;
    const q = searchQuery.toLowerCase();
    
    return byStatus.filter((item) => {
      if (isIncidents) {
        return (
          item.incidentType?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q) ||
          item.reporter?.name?.toLowerCase().includes(q)
        );
      } else {
        return (
          item.subcategory?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.reporter?.name?.toLowerCase().includes(q) ||
          item.speciesName?.toLowerCase().includes(q) ||
          item.avianSpecies?.toLowerCase().includes(q) ||
          item.barangay?.toLowerCase().includes(q) ||
          item.waterBody?.toLowerCase().includes(q)
        );
      }
    });
  }, [items, activeFilter, searchQuery, isIncidents]);

  const handleStatusChangeRequest = (itemId, newStatus, remarks) => {
    return new Promise((resolve, reject) => {
      setConfirmDialog({ itemId, newStatus, remarks, resolve, reject });
    });
  };

  const isLocking = confirmDialog?.newStatus === "completed" || confirmDialog?.newStatus === "denied";

  const executeStatusChange = async () => {
    if (!confirmDialog) return;
    const { itemId, newStatus, remarks, resolve } = confirmDialog;
    try {
      if (isIncidents) {
        await updateLogWorkflowStatus(itemId, "Incident", newStatus, currentUser.uid, currentUser.displayName, remarks);
      } else {
        await reviewMonitoringAtomic(itemId, newStatus, currentUser.uid, currentUser.displayName, remarks);
      }
      if (selectedItem?.id === itemId) {
        setSelectedItem((prev) => ({ ...prev, status: newStatus }));
      }
      resolve(true);
    } catch (err) {
      console.error(err);
      if (confirmDialog.reject) confirmDialog.reject(err);
    } finally {
      setConfirmDialog(null);
    }
  };

  const cancelStatusChange = () => {
    if (confirmDialog?.resolve) {
      confirmDialog.resolve(false);
    }
    setConfirmDialog(null);
  };

  return (
    <DashboardLayout>
      <div className="incidents-page">
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">Staff Workspace</span>
            <h1 className="inc-hero__title">
              {isIncidents ? "Incident Reports Review" : `${staffScope} Monitoring Review`}
            </h1>
            <p className="inc-hero__subtitle">
              Review and update the status of {isIncidents ? "environmental incident reports" : "monitoring logs"}.
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

        <div className="inc-history-card card-base">
          <div className="inc-history-card__head">
            <h2 className="inc-history-card__title">All {isIncidents ? "Incident Reports" : "Monitoring Logs"}</h2>
            <div className="inc-search-wrap">
              <span className="material-symbols-outlined inc-search-icon">search</span>
              <input
                id="staff-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isIncidents ? "Search incidents..." : "Search logs..."}
                className="inc-search-input"
              />
            </div>
          </div>

          <div className="inc-filter-tabs" role="tablist" aria-label="Filter items by status">
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
              Loading data...
            </p>
          ) : isIncidents ? (
            <AdminIncidentTable
              incidents={filteredItems}
              onStatusChange={handleStatusChangeRequest}
              onViewDetails={setSelectedItem}
            />
          ) : (
            <MonitoringTable
              logs={filteredItems}
              isAdmin
              onStatusChange={handleStatusChangeRequest}
              onViewDetails={setSelectedItem}
            />
          )}
        </div>

        {isIncidents ? (
          <IncidentDetailsModal
            incident={selectedItem}
            onClose={() => setSelectedItem(null)}
            isAdmin
            onStatusChange={handleStatusChangeRequest}
          />
        ) : (
          <MonitoringDetailsModal
            log={selectedItem}
            onClose={() => setSelectedItem(null)}
            isAdmin
            onStatusChange={handleStatusChangeRequest}
          />
        )}

        <ConfirmationModal
          isOpen={!!confirmDialog}
          title={isLocking ? "Lock Status?" : "Confirm Status Change"}
          message={
            isLocking 
              ? `Are you sure you want to change the status to "${confirmDialog?.newStatus}"? This action is irreversible and the item will be locked.`
              : `Are you sure you want to change the status to "${confirmDialog?.newStatus}"?`
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

export default StaffDashboard;
