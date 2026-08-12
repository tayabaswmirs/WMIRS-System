import { useState } from 'react';
import '../../styles/workflow.css';

export default function WorkflowActionModal({ 
  isOpen, 
  onClose, 
  title, 
  confirmLabel, 
  variant = 'primary', 
  onSubmit 
}) {
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!remarks.trim()) return;
    onSubmit(remarks);
    setRemarks('');
  };

  const isDanger = variant === 'danger';
  const buttonClass = `button-primary confirm-modal__btn ${isDanger ? 'confirm-modal__btn--danger' : ''}`;

  return (
    <>
      <div 
        className="inc-drawer-backdrop inc-drawer-backdrop--visible" 
        style={{ zIndex: 9998 }} 
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className="confirm-modal card-base"
        role="dialog" 
        aria-modal="true" 
        style={{ zIndex: 9999, width: '100%', maxWidth: '480px' }}
      >
        <div className="confirm-modal__header">
          <span 
            className="material-symbols-outlined confirm-modal__icon"
            style={{ color: isDanger ? "var(--c-warn-text)" : "var(--brand-green-dark, #00b34d)" }}
          >
            {isDanger ? "warning" : "edit_document"}
          </span>
          <h3 className="confirm-modal__title">{title}</h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
            <label htmlFor="workflow-remarks" className="confirm-modal__message" style={{ fontWeight: '600', color: 'var(--c-text-primary)' }}>
              Task Instructions / Remarks (Required)<span style={{ color: 'var(--c-warn-text)' }}>*</span>
            </label>
            <textarea
              id="workflow-remarks"
              className="form-textarea"
              placeholder="Enter instructions for the Forest Ranger, justification, or field action items..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--c-hairline-strong)',
                backgroundColor: 'var(--c-canvas)',
                color: 'var(--c-text-primary)',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '80px'
              }}
            />
            <small className="confirm-modal__message" style={{ fontSize: '12px' }}>
              These instructions will be recorded in the audit timeline and displayed on the Ranger's assignment card.
            </small>
          </div>

          <div className="confirm-modal__actions">
            <button type="button" className="button-secondary confirm-modal__btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className={buttonClass}
              disabled={!remarks.trim()}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
