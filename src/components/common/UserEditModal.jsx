import { useState } from "react";

export default function UserEditModal({ isOpen, user, onClose, onSave, isSaving }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // 1. Basic validation
    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please provide a valid email address.");
      return;
    }

    // Password must be empty (unchanged) or at least 6 characters
    if (password && password.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    const updates = { name: name.trim(), email: email.trim() };
    if (password) {
      updates.password = password;
    }

    onSave(updates);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,30,43,0.65)] backdrop-blur-[3px] transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={(e) => { if (e.key === "Escape" && !isSaving) onClose(); }}
    >
      <div className="um-edit-panel">
        
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
            manage_accounts
          </span>
        </div>

        {/* Modal Header Title */}
        <h2 id="modal-title" className="um-edit-title">
          Edit User Credentials
        </h2>

        {/* Description */}
        <p className="um-edit-desc">
          Updating credentials will modify the authentication login values and active profiles.
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

          {/* Full Name input */}
          <div className="um-form-group">
            <label htmlFor="user-name" className="um-form-label">
              Full Name
            </label>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
              required
              className="um-form-input"
              placeholder="e.g. Juan dela Cruz"
            />
          </div>

          {/* Email Address input */}
          <div className="um-form-group">
            <label htmlFor="user-email" className="um-form-label">
              Email Address
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSaving}
              required
              className="um-form-input"
              placeholder="e.g. juan@email.com"
            />
          </div>

          {/* New Password input */}
          <div className="um-form-group">
            <label htmlFor="user-pass" className="um-form-label">
              New Password <span className="text-[10px] font-normal text-[var(--c-stone)] font-sans lowercase">(leave blank to keep unchanged)</span>
            </label>
            <input
              id="user-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSaving}
              className="um-form-input"
              placeholder="•••••••• (6+ characters)"
            />
          </div>

          {/* Actions button strip - Centered like ConfirmModal */}
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
                  Save Changes
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
