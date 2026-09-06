import RangerResolutionModal from "./RangerResolutionModal";
import IncidentDetailsModal from "./IncidentDetailsModal";
import MonitoringDetailsModal from "./monitoring/MonitoringDetailsModal";

/**
 * AssignmentModals — Host for resolution and inspection modals on assignments page.
 *
 * @param {Object} props
 * @param {Object|null} props.selectedAssignment
 * @param {function(Object|null): void} props.setSelectedAssignment
 * @param {boolean} props.resolutionModalOpen
 * @param {function(boolean): void} props.setResolutionModalOpen
 * @param {function(Object): Promise<void>} props.onResolveSubmit
 * @param {Object} props.currentUser
 * @param {boolean} props.isResolving
 */
export default function AssignmentModals({
  selectedAssignment,
  setSelectedAssignment,
  resolutionModalOpen,
  setResolutionModalOpen,
  onResolveSubmit,
  currentUser,
  isResolving
}) {
  return (
    <>
      <RangerResolutionModal
        isOpen={resolutionModalOpen}
        onClose={() => {
          setResolutionModalOpen(false);
          setSelectedAssignment(null);
        }}
        onSubmit={onResolveSubmit}
        assignment={selectedAssignment}
        currentUser={currentUser}
        isSubmitting={isResolving}
      />

      {selectedAssignment && !resolutionModalOpen && selectedAssignment.logType === "Incident" && (
        <IncidentDetailsModal
          incident={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}

      {selectedAssignment && !resolutionModalOpen && selectedAssignment.logType === "Monitoring" && (
        <MonitoringDetailsModal
          log={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}
    </>
  );
}
