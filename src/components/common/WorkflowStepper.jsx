import { STATUS_METADATA } from '../../utils/incidentConstants';
import '../../styles/workflow.css';

const WORKFLOW_STAGES = [
  { id: 'submitted', label: 'Submitted', icon: 'description' },
  { id: 'assigned', label: 'Staff Screening', icon: 'assignment_ind' },
  { id: 'resolved', label: 'Field Resolution', icon: 'check_circle' },
  { id: 'verified', label: 'Staff Verification', icon: 'verified' },
  { id: 'completed', label: 'Admin Completion', icon: 'done_all' }
];

export default function WorkflowStepper({ currentStatus }) {
  const currentMeta = STATUS_METADATA[currentStatus?.toLowerCase()] || STATUS_METADATA.submitted;
  const currentIndex = currentMeta.stepIndex;

  return (
    <div className="workflow-stepper">
      {WORKFLOW_STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex || (index === currentIndex && currentStatus === 'completed');
        const isActive = index === currentIndex && currentStatus !== 'completed';
        
        let stageClass = 'stepper-stage';
        if (isCompleted) stageClass += ' completed';
        if (isActive) stageClass += ' active';

        // Special handling for denied / unresolved
        if (isActive && currentStatus === 'denied') stageClass += ' denied';
        if (isActive && currentStatus === 'unresolved') stageClass += ' unresolved';

        let iconName = stage.icon;
        if (isActive && currentStatus === 'denied') iconName = 'cancel';
        if (isActive && currentStatus === 'unresolved') iconName = 'error';

        return (
          <div key={stage.id} className={stageClass}>
            <div className="stage-icon">
              <span className="material-symbols-outlined">{iconName}</span>
            </div>
            <div className="stage-label">{stage.label}</div>
          </div>
        );
      })}
    </div>
  );
}
