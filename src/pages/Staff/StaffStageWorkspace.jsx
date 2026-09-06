import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { subscribeToAllIncidents, reviewIncidentAtomic } from "../../firebase/services/incidentService";
import { subscribeToCategoryMonitoring, reviewMonitoringAtomic } from "../../firebase/services/monitoringService";
import { useLogFilters } from "../../hooks/useLogFilters";
import { STAGE_CONFIGS } from "../../utils/staffWorkspaceConstants";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StaffWorkspaceHeader from "../../components/common/staff/StaffWorkspaceHeader";
import StaffWorkspaceContent from "../../components/common/staff/StaffWorkspaceContent";
import StaffWorkspaceModals from "../../components/common/staff/StaffWorkspaceModals";
import "../../styles/dashboard.css";

function StaffStageWorkspace() {
  const { stageId } = useParams();
  const { currentUser, staffScope } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const isIncidents = staffScope === "incidents";
  const config = STAGE_CONFIGS[stageId] || STAGE_CONFIGS["awaiting-review"];

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

  const stats = useMemo(() => {
    return items.reduce((acc, r) => {
      const status = r.status?.toLowerCase();
      acc.total += 1;
      if (status === "submitted" || status === "under review") acc.submitted += 1;
      else if (status === "assigned" || status === "unresolved") acc.active += 1;
      else if (status === "resolved") acc.resolved += 1;
      else if (status === "verified" || status === "pending completion" || status === "completed") acc.approved += 1;
      return acc;
    }, { total: 0, submitted: 0, active: 0, resolved: 0, approved: 0 });
  }, [items]);

  const stageItems = useMemo(() => {
    return items.filter((r) => config.statuses.includes(r.status?.toLowerCase()));
  }, [items, config.statuses]);

  const filterHook = useLogFilters(stageItems, {
    mode: isIncidents ? "incident" : "monitoring",
    isAdmin: false,
    fixedCategory: isIncidents ? null : staffScope,
    stageId,
    allowedStatusOptions: config.allowedStatusOptions
  });

  const handleStatusChangeRequest = (itemId, newStatus, remarks) => {
    return new Promise((resolve, reject) => {
      setConfirmDialog({ itemId, newStatus, remarks, resolve, reject });
    });
  };

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
      if (selectedItem?.id === itemId) setSelectedItem((prev) => ({ ...prev, status: newStatus }));
      resolve(true);
    } catch (err) {
      console.error(err);
      if (confirmDialog.reject) confirmDialog.reject(err);
    } finally {
      setConfirmDialog(null);
    }
  };

  const cancelStatusChange = () => {
    if (confirmDialog?.resolve) confirmDialog.resolve(false);
    setConfirmDialog(null);
  };

  return (
    <DashboardLayout>
      <div className="incidents-page">
        <StaffWorkspaceHeader
          config={config}
          isIncidents={isIncidents}
          staffScope={staffScope}
          stageId={stageId}
          stats={stats}
        />

        <StaffWorkspaceContent
          config={config}
          stageId={stageId}
          isIncidents={isIncidents}
          loading={loading}
          filterHook={filterHook}
          onStatusChange={handleStatusChangeRequest}
          onViewDetails={setSelectedItem}
        />

        <StaffWorkspaceModals
          isIncidents={isIncidents}
          selectedItem={selectedItem}
          onCloseDetails={() => setSelectedItem(null)}
          editable={config.editable}
          onStatusChange={handleStatusChangeRequest}
          confirmDialog={confirmDialog}
          onConfirmStatus={executeStatusChange}
          onCancelStatus={cancelStatusChange}
        />
      </div>
    </DashboardLayout>
  );
}

export default StaffStageWorkspace;
