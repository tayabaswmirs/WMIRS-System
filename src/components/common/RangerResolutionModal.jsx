import { useState } from 'react';
import '../../styles/dashboard.css';
import '../../styles/workflow.css';

export default function RangerResolutionModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return;
    
    // Pass both notes and the optional file up to the parent handler
    onSubmit({
      resolutionNotes,
      evidenceFile
    });
    
    // Reset state
    setResolutionNotes('');
    setEvidenceFile(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenceFile(e.target.files[0]);
    }
  };

  return (
    <>
      {/* High z-index backdrop overlay */}
      <div 
        className="inc-drawer-backdrop inc-drawer-backdrop--visible" 
        style={{ zIndex: 9998 }} 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered modal box */}
      <div 
        className="confirm-modal card-base"
        role="dialog" 
        aria-modal="true" 
        style={{ zIndex: 9999, width: '100%', maxWidth: '520px' }}
      >
        <div className="confirm-modal__header" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              className="material-symbols-outlined confirm-modal__icon"
              style={{ color: "var(--brand-green-dark, #00b34d)" }}
            >
              check_circle
            </span>
            <h3 className="confirm-modal__title">Resolve Assignment</h3>
          </div>
          <button 
            type="button"
            className="icon-btn" 
            onClick={onClose} 
            aria-label="Close modal"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)' }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', marginTop: 'var(--sp-sm)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
            <label htmlFor="resolution-notes" className="confirm-modal__message" style={{ fontWeight: '600', color: 'var(--c-text-primary)' }}>
              Resolution Notes (Required)<span style={{ color: 'var(--c-warn-text)' }}>*</span>
            </label>
            <textarea
              id="resolution-notes"
              className="form-textarea"
              placeholder="Describe your field findings and resolution actions..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
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
                minHeight: '90px'
              }}
            />
            <small className="confirm-modal__message" style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>
              Be detailed. These notes will be reviewed by Staff before verification.
            </small>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
            <label htmlFor="evidence-file" className="confirm-modal__message" style={{ fontWeight: '600', color: 'var(--c-text-primary)' }}>
              Evidence Photo / Document (Optional)
            </label>
            <input
              type="file"
              id="evidence-file"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx"
              style={{
                fontSize: '13px',
                color: 'var(--c-text-primary)',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid var(--c-hairline-strong)',
                backgroundColor: 'var(--c-canvas)'
              }}
            />
            {evidenceFile && (
              <small style={{ color: '#00ed64', fontWeight: 600, fontSize: '12px' }}>
                Selected: {evidenceFile.name}
              </small>
            )}
          </div>

          <div className="confirm-modal__actions" style={{ marginTop: 'var(--sp-xs)' }}>
            <button type="button" className="button-secondary confirm-modal__btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="button-primary confirm-modal__btn"
              disabled={!resolutionNotes.trim()}
            >
              Submit Resolution
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
