/**
 * ConfirmModal — reusable destructive-action confirmation dialog.
 *
 * Props:
 *   isOpen    {boolean}  — controls visibility
 *   variant   {string}   — "danger" | "warning" (controls icon + button color)
 *   title     {string}   — dialog heading
 *   message   {string}   — body copy explaining the consequence
 *   confirmLabel {string} — label for the confirm button (e.g. "Delete", "Demote")
 *   onConfirm {function} — called when the user clicks confirm
 *   onCancel  {function} — called when the user clicks cancel or presses Escape
 *   isLoading {boolean}  — disables buttons and shows spinner while async op runs
 */
export default function ConfirmModal({
  isOpen,
  variant = "danger",
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen) return null;

  const isDanger  = variant === "danger";
  const iconName  = isDanger ? "delete_forever" : "shield_person";
  const iconColor = isDanger ? "text-red-500" : "text-[var(--c-accent-orange)]";

  const confirmCls = isDanger
    ? "um-confirm-btn--danger"
    : "um-confirm-btn--warning";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,30,43,0.65)] backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onKeyDown={(e) => { if (e.key === "Escape" && !isLoading) onCancel(); }}
    >
      <div className="um-confirm-panel">

        {/* Icon */}
        <div className={`um-confirm-icon-wrap ${isDanger ? "um-confirm-icon-wrap--danger" : "um-confirm-icon-wrap--warning"}`}>
          <span className={`material-symbols-outlined ${iconColor} text-[28px]`} aria-hidden="true">
            {iconName}
          </span>
        </div>

        {/* Text */}
        <h2 id="confirm-modal-title" className="um-confirm-title">
          {title}
        </h2>
        <p className="um-confirm-message">{message}</p>

        {/* Action strip */}
        <div className="um-confirm-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="um-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`um-btn-confirm ${confirmCls}`}
          >
            {isLoading ? (
              <>
                <span className="um-spinner" aria-hidden="true" />
                Processing…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                  {iconName}
                </span>
                {confirmLabel}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
