import PasswordInput from "../PasswordInput";

export default function ProfileReauthModal({
  isOpen,
  purpose,
  password,
  setPassword,
  error,
  isSaving,
  onSubmit,
  onClose,
}) {
  if (!isOpen) return null;

  const isDelete = purpose === "delete";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(0,30,43,0.65)] backdrop-blur-[3px] transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reauth-modal-title"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !isSaving) onClose();
      }}
    >
      <div className="um-edit-panel">
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-4 right-4 text-[var(--c-stone)] hover:text-[var(--c-ink)] transition-colors p-1 flex items-center justify-center"
          aria-label="Close dialog"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div
          className="um-edit-icon-wrap"
          aria-hidden="true"
          style={{
            background: isDelete ? "rgba(220, 38, 38, 0.08)" : "rgba(0, 104, 74, 0.08)",
            borderColor: isDelete ? "rgba(220, 38, 38, 0.15)" : "rgba(0, 104, 74, 0.15)",
          }}
        >
          <span
            className="material-symbols-outlined text-[28px]"
            style={{ color: isDelete ? "#dc2626" : "var(--c-green-dark)" }}
          >
            {isDelete ? "lock_reset" : "shield_lock"}
          </span>
        </div>

        <h2 id="reauth-modal-title" className="um-edit-title">
          {isDelete ? "Verify Identity to Delete Account" : "Confirm Profile Updates"}
        </h2>

        <p className="um-edit-desc">
          {isDelete
            ? "For security purposes, please re-enter your current password to authorize this permanent deletion."
            : "Updating security credentials (email or password) requires verifying your current login password."}
        </p>

        <form onSubmit={onSubmit} className="um-edit-form">
          {error && (
            <div className="um-form-error" role="alert">
              <span className="material-symbols-outlined text-sm leading-none shrink-0" aria-hidden="true">
                warning
              </span>
              <span>{error}</span>
            </div>
          )}

          <div className="um-form-group">
            <label htmlFor="reauth-pass" className="um-form-label">Current Password</label>
            <PasswordInput
              id="reauth-pass"
              required
              disabled={isSaving}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="um-form-input"
              placeholder="••••••••"
            />
          </div>

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
              className={`um-btn-confirm ${isDelete ? "um-btn-confirm--danger" : "um-btn-confirm--primary"}`}
            >
              {isSaving ? (
                <>
                  <span className="um-spinner" aria-hidden="true" />
                  Verifying...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                    {isDelete ? "delete" : "verified"}
                  </span>
                  {isDelete ? "Confirm Account Purge" : "Verify & Save"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
