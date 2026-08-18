import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { subscribeToAllIncidents, reviewIncidentAtomic } from "../../firebase/services/incidentService";
import { subscribeToCategoryMonitoring, reviewMonitoringAtomic } from "../../firebase/services/monitoringService";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AdminIncidentTable from "../../components/common/AdminIncidentTable";
import MonitoringTable from "../../components/common/monitoring/MonitoringTable";
import IncidentDetailsModal from "../../components/common/IncidentDetailsModal";
import MonitoringDetailsModal from "../../components/common/monitoring/MonitoringDetailsModal";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import StatPill from "../../components/common/StatPill";
import "../../styles/dashboard.css";

const STAGE_CONFIGS = {
  "awaiting-review": {
    title: "Awaiting Review",
    icon: "mark_email_unread",
    statuses: ["submitted", "under review"],
    emptyText: "No reports awaiting review.",
    editable: true
  },
  "active-assignments": {
    title: "Active Assignments",
    icon: "assignment",
    statuses: ["assigned", "unresolved"],
    emptyText: "No active assignments.",
    editable: false
  },
  "pending-verification": {
    title: "Pending Verification",
    icon: "pending_actions",
    statuses: ["resolved"],
    emptyText: "No reports pending verification.",
    editable: true
  },
  "completed-archive": {
    title: "Completed Archive",
    icon: "task_alt",
    statuses: ["verified", "pending completion", "completed", "denied"],
    emptyText: "No archived records.",
    editable: false
  }
};

function StaffStageWorkspace() {
  const { stageId } = useParams();
  const { currentUser, staffScope } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const isIncidents = staffScope === "incidents";
  const config = STAGE_CONFIGS[stageId] || STAGE_CONFIGS["awaiting-review"];

  // Real-time subscription based on staffScope
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
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [staffScope, isIncidents]);

  // Overall pipeline stats for the scoped domain
  const stats = useMemo(() => {
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

  // Filter items that belong strictly to the active workspace stage statuses
  const stageItems = useMemo(() => {
    return items.filter((r) => config.statuses.includes(r.status?.toLowerCase()));
  }, [items, config.statuses]);

  // Filter stage items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return stageItems;
    const q = searchQuery.toLowerCase();
    
    return stageItems.filter((item) => {
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
  }, [stageItems, searchQuery, isIncidents]);

  // Request review status change
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
      const reviewerName = currentUser?.displayName || "Staff Member";
      const reviewerNotes = remarks || "Staff status update";

      if (isIncidents) {
        await reviewIncidentAtomic(itemId, newStatus, currentUser.uid, reviewerName, reviewerNotes);
      } else {
        await reviewMonitoringAtomic(itemId, newStatus, currentUser.uid, reviewerName, reviewerNotes);
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
        {/* Hero stats header */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">Staff Portal</span>
            <h1 className="inc-hero__title" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "var(--c-brand, #00ed64)" }}>
                {config.icon}
              </span>
              {config.title}
            </h1>
            <p className="inc-hero__subtitle">
              Review and manage {isIncidents ? "incident reports" : `${staffScope} monitoring logs`} in the {config.title.toLowerCase()} phase.
            </p>
          </div>
          <div className="inc-hero__stats">
            {stageId === "awaiting-review" && (
              <StatPill icon="mark_email_unread" label="Awaiting Review" count={stats.submitted} color="#3d8eff" />
            )}
            {stageId === "active-assignments" && (
              <StatPill icon="assignment" label="Active Tasks" count={stats.active} color="#fa6e39" />
            )}
            {stageId === "pending-verification" && (
              <StatPill icon="pending_actions" label="Pending Verification" count={stats.resolved} color="#00a35c" />
            )}
            {stageId === "completed-archive" && (
              <StatPill icon="task_alt" label="Approved/Completed" count={stats.approved} color="#00ed64" />
            )}
          </div>
        </div>

        {/* Workspace cards & Table list */}
        <div className="inc-history-card card-base">
          <div className="inc-history-card__head">
            <h2 className="inc-history-card__title">
              {config.title} Queue
            </h2>
            <div className="inc-search-wrap">
              <span className="material-symbols-outlined inc-search-icon">search</span>
              <input
                id="staff-workspace-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by category, type, location or reporter..."
                className="inc-search-input"
              />
            </div>
          </div>

          {loading ? (
            <p className="loading-text" style={{ padding: "32px", textAlign: "center", color: "var(--c-steel)" }}>
              Loading queue items...
            </p>
          ) : filteredItems.length === 0 ? (
            <div className="inc-empty-state" style={{ padding: "48px 32px" }}>
              <span className="material-symbols-outlined inc-empty-state__icon" style={{ fontSize: "40px", color: "var(--c-muted)" }}>
                check_circle
              </span>
              <p className="inc-empty-state__text">{config.emptyText}</p>
            </div>
          ) : isIncidents ? (
            <AdminIncidentTable
              incidents={filteredItems}
              onStatusChange={handleStatusChangeRequest}
              onViewDetails={setSelectedItem}
              readOnly={!config.editable}
            />
          ) : (
            <MonitoringTable
              logs={filteredItems}
              isAdmin={config.editable}
              onStatusChange={handleStatusChangeRequest}
              onViewDetails={setSelectedItem}
            />
          )}
        </div>

        {/* Incident drawer modal */}
        <IncidentDetailsModal
          incident={isIncidents ? selectedItem : null}
          onClose={() => setSelectedItem(null)}
          isAdmin={config.editable}
          onStatusChange={handleStatusChangeRequest}
        />

        {/* Monitoring drawer modal */}
        <MonitoringDetailsModal
          log={!isIncidents ? selectedItem : null}
          onClose={() => setSelectedItem(null)}
          isAdmin={config.editable}
          onStatusChange={handleStatusChangeRequest}
        />

        {/* Confirmation dialog overlay */}
        <ConfirmationModal
          isOpen={!!confirmDialog}
          title={isLocking ? "Lock Submission Status?" : "Confirm Workflow Change"}
          message={
            isLocking
              ? `Are you sure you want to change the status to "${confirmDialog?.newStatus}"? This is a terminal state and will lock the record.`
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

export default StaffStageWorkspace;
