
import "../../styles/dashboard.css";

/**
 * ConfirmationModal — a reusable, styled confirmation dialog.
 * 
 * Props:
 *   isOpen       {boolean}  — Controls visibility
 *   title        {string}   — Modal title
 *   message      {string}   — Main confirmation text
 *   onConfirm    {function} — Callback when user clicks confirm
 *   onCancel     {function} — Callback when user clicks cancel
 *   confirmText  {string}   — Text for confirm button
 *   cancelText   {string}   — Text for cancel button
 */
function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  isDestructive = false
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* High z-index backdrop to sit over everything, including the drawer */}
      <div 
        className="inc-drawer-backdrop inc-drawer-backdrop--visible" 
        style={{ zIndex: 9998 }} 
        onClick={onCancel}
        aria-hidden="true"
      />
      
      {/* Centered modal box */}
      <div 
        className="confirm-modal card-base" 
        role="dialog" 
        aria-modal="true" 
        style={{ zIndex: 9999 }}
      >
        <div className="confirm-modal__header">
          <span 
            className="material-symbols-outlined confirm-modal__icon"
            style={{ color: isDestructive ? "var(--c-warn-text)" : "var(--brand-green-dark, #00b34d)" }}
          >
            {isDestructive ? "warning" : "help"}
          </span>
          <h3 className="confirm-modal__title">{title}</h3>
        </div>
        <p className="confirm-modal__message">{message}</p>
        <div className="confirm-modal__actions">
          <button 
            type="button" 
            className="button-secondary confirm-modal__btn" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className={`button-primary confirm-modal__btn ${isDestructive ? "confirm-modal__btn--danger" : ""}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmationModal;
