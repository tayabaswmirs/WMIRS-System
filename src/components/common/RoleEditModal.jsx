import { useState, useRef } from "react";
import useLoadingLock from "../../hooks/useLoadingLock";

export default function RoleEditModal({ isOpen, user, onClose, onSave, isSaving }) {
  const modalRef = useRef(null);
  
  // Normalize legacy "user" role to "ranger" for initial state
  const initialRole = user?.role === "user" ? "ranger" : (user?.role || "ranger");
  const [role, setRole] = useState(initialRole);
  const [staffScope, setStaffScope] = useState(user?.staffScope || "incidents");
  const [error, setError] = useState("");

  useLoadingLock(modalRef, isSaving);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (role === "staff" && !staffScope) {
      setError("Please select a domain scope for the staff member.");
      return;
    }

    onSave({ 
      role, 
      staffScope: role === "staff" ? staffScope : null 
    });
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(0,30,43,0.65)] backdrop-blur-[3px] transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
      onKeyDown={(e) => { if (e.key === "Escape" && !isSaving) onClose(); }}
    >
      <div ref={modalRef} className="um-edit-panel">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-4 right-4 text-[var(--c-stone)] hover:text-[var(--c-ink)] transition-colors p-1 flex items-center justify-center"
          aria-label="Close dialog"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Circular Centered Header Badge */}
        <div className="um-edit-icon-wrap" aria-hidden="true">
          <span className="material-symbols-outlined text-[var(--c-green-dark)] text-[28px]">
            shield_person
          </span>
        </div>

        {/* Modal Header Title */}
        <h2 id="role-modal-title" className="um-edit-title">
          Modify System Role
        </h2>

        {/* Description */}
        <p className="um-edit-desc">
          Update the authorization role for <strong>{user?.name || "this user"}</strong>.
        </p>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="um-edit-form">
          
          {/* Error Alert Box */}
          {error && (
            <div className="um-form-error" role="alert">
              <span className="material-symbols-outlined text-sm leading-none shrink-0" aria-hidden="true">
                warning
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* Role selection */}
          <div className="um-form-group">
            <label htmlFor="user-role" className="um-form-label">
              System Role
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isSaving}
              required
              className="um-form-input"
            >
              <option value="ranger">Forest Ranger</option>
              <option value="staff">ENRO Staff</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* Scope selection (conditionally shown) */}
          {role === "staff" && (
            <div className="um-form-group">
              <label htmlFor="user-scope" className="um-form-label">
                Staff Domain Scope
              </label>
              <select
                id="user-scope"
                value={staffScope}
                onChange={(e) => setStaffScope(e.target.value)}
                disabled={isSaving}
                required
                className="um-form-input"
              >
                <option value="incidents">Incident Reports</option>
                <option value="BMS">Biodiversity Monitoring</option>
                <option value="Water">Water Monitoring</option>
                <option value="Compliance">Compliance & Violations</option>
              </select>
            </div>
          )}

          {/* Actions button strip */}
          <div className="um-confirm-actions">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="um-btn-secondary"
              type="button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="um-btn-confirm um-btn-confirm--primary"
            >
              {isSaving ? (
                <>
                  <span className="um-spinner" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">save</span>
                  Update Role
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
