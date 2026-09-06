import IncidentDetailsModal from "../IncidentDetailsModal";
import MonitoringDetailsModal from "../monitoring/MonitoringDetailsModal";
import ConfirmationModal from "../ConfirmationModal";

/**
 * StaffWorkspaceModals — Encapsulates incident/monitoring drawers and confirmation dialogs for staff workspace.
 */
export default function StaffWorkspaceModals({
  isIncidents,
  selectedItem,
  onCloseDetails,
  editable,
  onStatusChange,
  confirmDialog,
  onConfirmStatus,
  onCancelStatus
}) {
  const isLocking = confirmDialog?.newStatus === "completed" || confirmDialog?.newStatus === "denied";

  return (
    <>
      {/* Incident drawer modal */}
      <IncidentDetailsModal
        incident={isIncidents ? selectedItem : null}
        onClose={onCloseDetails}
        isAdmin={editable}
        onStatusChange={onStatusChange}
      />

      {/* Monitoring drawer modal */}
      <MonitoringDetailsModal
        log={!isIncidents ? selectedItem : null}
        onClose={onCloseDetails}
        isAdmin={editable}
        onStatusChange={onStatusChange}
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
        onConfirm={onConfirmStatus}
        onCancel={onCancelStatus}
        confirmText={isLocking ? "Confirm & Lock" : "Confirm"}
        isDestructive={isLocking}
      />
    </>
  );
}
