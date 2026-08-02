import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { subscribeToAllIncidents, reviewIncidentAtomic } from "../../firebase/services/incidentService";
import { subscribeToCategoryMonitoring, reviewMonitoringAtomic } from "../../firebase/services/monitoringService";
import IncidentDetailsModal from "../../components/common/IncidentDetailsModal";
import MonitoringDetailsModal from "../../components/common/monitoring/MonitoringDetailsModal";
import AdminIncidentTable from "../../components/common/AdminIncidentTable";
import MonitoringTable from "../../components/common/monitoring/MonitoringTable";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import StatPill from "../../components/common/StatPill";
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

  const STATUS_FILTERS = isIncidents 
    ? ["All", "Submitted", "Under Review", "Resolved", "Dismissed"]
    : ["All", "Submitted", "Under Review", "Approved", "Rejected/Flagged"];

  const stats = useMemo(() => {
    if (isIncidents) {
      return {
        total: items.length,
        submitted: items.filter((r) => r.status === "Submitted").length,
        underReview: items.filter((r) => r.status === "Under Review").length,
        resolved: items.filter((r) => r.status === "Resolved").length,
      };
    } else {
      return {
        total: items.length,
        submitted: items.filter((r) => r.status === "Submitted").length,
        underReview: items.filter((r) => r.status === "Under Review").length,
        approved: items.filter((r) => r.status === "Approved").length,
      };
    }
  }, [items, isIncidents]);

  const filteredItems = useMemo(() => {
    const byStatus = activeFilter === "All" 
      ? items 
      : items.filter((r) => r.status === activeFilter);
      
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

  const isLocking = isIncidents 
    ? (confirmDialog?.newStatus === "Resolved" || confirmDialog?.newStatus === "Dismissed")
    : (confirmDialog?.newStatus === "Approved" || confirmDialog?.newStatus === "Rejected/Flagged");

  const executeStatusChange = async () => {
    if (!confirmDialog) return;
    const { itemId, newStatus, remarks, resolve } = confirmDialog;
    try {
      if (isIncidents) {
        await reviewIncidentAtomic(itemId, newStatus, currentUser.uid, remarks);
      } else {
        await reviewMonitoringAtomic(itemId, newStatus, currentUser.uid, remarks);
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
            <StatPill icon="inventory_2"     label="Total"        count={stats.total}       color="var(--brand-green, #00ed64)" />
            <StatPill icon="mark_email_unread" label="Submitted"  count={stats.submitted}   color="#3d8eff" />
            <StatPill icon="pending_actions"  label="Under Review" count={stats.underReview} color="#f5a524" />
            <StatPill 
              icon="task_alt" 
              label={isIncidents ? "Resolved" : "Approved"} 
              count={isIncidents ? stats.resolved : stats.approved} 
              color="#00ed64" 
            />
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
