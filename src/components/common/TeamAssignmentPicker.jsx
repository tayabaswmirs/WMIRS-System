import { useState, useEffect } from "react";
import { getActiveRangers } from "../../firebase/services/userService";

/**
 * TeamAssignmentPicker — Dispatch assignment to Team Leader and optional Members.
 * Strictly excludes reporter to prevent self-audit conflict of interest (Section 4.5).
 */
export default function TeamAssignmentPicker({
  reporterUid,
  onAssign,
  onCancel,
  isSubmitting = false
}) {
  const [rangers, setRangers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeaderUid, setSelectedLeaderUid] = useState("");
  const [selectedMemberUids, setSelectedMemberUids] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let isMounted = true;
    getActiveRangers()
      .then((data) => {
        if (!isMounted) return;
        setRangers((data || []).filter((r) => r.uid !== reporterUid));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load active rangers:", err);
        if (isMounted) {
          setErrorMsg("Could not load rangers list.");
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [reporterUid]);

  const handleMemberToggle = (uid) => {
    setSelectedMemberUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!selectedLeaderUid) {
      setErrorMsg("A Team Leader must be designated for this assignment.");
      return;
    }
    onAssign({
      leader: rangers.find((r) => r.uid === selectedLeaderUid),
      members: rangers.filter((r) => selectedMemberUids.includes(r.uid))
    });
  };

  if (loading) {
    return (
      <div className="team-picker__loading">
        <span className="material-symbols-outlined spin">progress_activity</span>
        <p>Loading eligible forest rangers...</p>
      </div>
    );
  }

  const eligibleMembers = rangers.filter((r) => r.uid !== selectedLeaderUid);

  return (
    <form className="team-picker" onSubmit={handleFormSubmit}>
      <div className="team-picker__header">
        <span className="material-symbols-outlined team-picker__icon">groups</span>
        <div>
          <h4 className="team-picker__title">Dispatch Patrol Team</h4>
          <p className="team-picker__subtitle">
            Assign a Team Leader with resolution authority and optional field members.
          </p>
        </div>
      </div>

      {reporterUid && (
        <div className="team-picker__notice">
          <span className="material-symbols-outlined notice-icon">shield</span>
          <span>Reporting officer is excluded to ensure objective peer inspection.</span>
        </div>
      )}

      {errorMsg && <div className="team-picker__error">{errorMsg}</div>}

      <div className="team-picker__field">
        <label htmlFor="team-leader-select" className="team-picker__label">
          Team Leader (Required) <span className="req">*</span>
        </label>
        <select
          id="team-leader-select"
          className="team-picker__select"
          value={selectedLeaderUid}
          onChange={(e) => {
            setSelectedLeaderUid(e.target.value);
            setSelectedMemberUids((prev) => prev.filter((id) => id !== e.target.value));
            setErrorMsg("");
          }}
          required
        >
          <option value="">-- Choose Team Leader --</option>
          {rangers.map((r) => (
            <option key={r.uid} value={r.uid}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="team-picker__field">
        <label className="team-picker__label">Team Members (Optional)</label>
        {eligibleMembers.length === 0 ? (
          <p className="team-picker__hint">No additional rangers available.</p>
        ) : (
          <div className="team-picker__members-list">
            {eligibleMembers.map((r) => {
              const isSelected = selectedMemberUids.includes(r.uid);
              return (
                <button
                  type="button"
                  key={r.uid}
                  className={`team-picker__member-chip ${isSelected ? "active" : ""}`}
                  onClick={() => handleMemberToggle(r.uid)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    {isSelected ? "check" : "add"}
                  </span>
                  {r.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="team-picker__actions">
        <button type="button" className="btn-card-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn-card-primary" disabled={isSubmitting || !selectedLeaderUid}>
          {isSubmitting ? "Dispatching..." : "Approve & Dispatch Team"}
        </button>
      </div>
    </form>
  );
}
