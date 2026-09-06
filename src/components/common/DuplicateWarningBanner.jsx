/**
 * DuplicateWarningBanner
 * Surfaces a high-contrast warning when an incident is flagged as a possible duplicate.
 * Provides Staff with 1-click actions: Smart Merge into Master, Clear Flag, or Reject.
 *
 * @param {object} props
 * @param {{ matchedReportId: string, matchedTitle: string, matchedLocation: string, flaggedAt: string }} [props.duplicateInfo]
 * @param {() => void} props.onMerge
 * @param {() => void} props.onClearFlag
 * @param {() => void} props.onReject
 * @param {boolean} [props.isProcessing=false]
 */
export default function DuplicateWarningBanner({
  duplicateInfo,
  onMerge,
  onClearFlag,
  onReject,
  isProcessing = false
}) {
  if (!duplicateInfo) return null;

  return (
    <div className="duplicate-banner" role="alert">
      <div className="duplicate-banner__header">
        <span className="material-symbols-outlined duplicate-banner__icon">
          warning
        </span>
        <div className="duplicate-banner__title-wrap">
          <h4 className="duplicate-banner__title">
            Possible Duplicate Detected
          </h4>
          <p className="duplicate-banner__desc">
            Matches active report{" "}
            <strong>#{duplicateInfo.matchedReportId}</strong> (
            <em>{duplicateInfo.matchedTitle}</em>) in{" "}
            {duplicateInfo.matchedLocation} filed within 48 hours.
          </p>
        </div>
      </div>

      <div className="duplicate-banner__actions">
        <button
          type="button"
          className="btn-merge"
          onClick={onMerge}
          disabled={isProcessing}
          title="Consolidate evidence and notes into the active master incident"
        >
          <span className="material-symbols-outlined btn-icon">merge</span>
          {isProcessing ? "Merging..." : "Smart Merge into Master"}
        </button>

        <button
          type="button"
          className="btn-clear-flag"
          onClick={onClearFlag}
          disabled={isProcessing}
          title="Confirm this report is an independent incident and proceed"
        >
          <span className="material-symbols-outlined btn-icon">check</span>
          Clear Flag (Separate Incident)
        </button>

        <button
          type="button"
          className="btn-reject-spam"
          onClick={onReject}
          disabled={isProcessing}
          title="Dismiss this report as invalid or spam"
        >
          <span className="material-symbols-outlined btn-icon">block</span>
          Reject
        </button>
      </div>
    </div>
  );
}

