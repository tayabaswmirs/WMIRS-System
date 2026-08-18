
/**
 * SubmitChoice — Step 1 Choice Screen for the unified submissions flow.
 * Props:
 *   onSelect {Function} — callback receiving "incident" or "monitoring"
 */
function SubmitChoice({ onSelect }) {
  return (
    <div className="mon-step">
      <div className="mon-step-label">
        <span className="mon-step-label__num">1</span>
        <span className="mon-step-label__text">Select Submission Type</span>
      </div>
      <div className="mon-step-grid mon-step-grid--two">
        <button
          type="button"
          onClick={() => onSelect("incident")}
          className="mon-step-card"
          id="submit-choice-incident"
          aria-label="Select Incident Report"
        >
          <div className="mon-step-card__icon-wrap" style={{ color: "#fa6e39" }}>
            <span className="material-symbols-outlined">warning</span>
          </div>
          <p className="mon-step-card__title">Incident Report</p>
          <p className="mon-step-card__desc">
            Report immediate environmental incidents, illegal forest activities, or ecological violations.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelect("monitoring")}
          className="mon-step-card"
          id="submit-choice-monitoring"
          aria-label="Select Ecological Monitoring Log"
        >
          <div className="mon-step-card__icon-wrap" style={{ color: "#00ed64" }}>
            <span className="material-symbols-outlined">monitoring</span>
          </div>
          <p className="mon-step-card__title">Ecological Monitoring Log</p>
          <p className="mon-step-card__desc">
            Log routine ecological surveying, wildlife observations, water resource checks, and compliance audits.
          </p>
        </button>
      </div>
    </div>
  );
}

export default SubmitChoice;
