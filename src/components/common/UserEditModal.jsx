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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,30,43,0.6)] backdrop-blur-[2px] transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-md mx-4 bg-[var(--c-canvas)] rounded-[var(--r-lg)] p-8 shadow-[var(--shadow-4)] border border-[var(--c-hairline)] relative transition-all transform scale-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-4 right-4 text-[var(--c-stone)] hover:text-[var(--c-ink)] transition-colors p-1"
          aria-label="Close dialog"
          type="button"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Modal Header */}
        <h2 id="modal-title" className="text-xl font-semibold text-[var(--c-ink)] mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--c-green-dark)]">manage_accounts</span>
          Edit User Credentials
        </h2>
        <p className="text-xs text-[var(--c-steel)] mb-6">
          Updating credentials will modify the authentication login values and active profiles.
        </p>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-4 p-3 bg-[var(--c-warn-bg)] border border-amber-200 text-[var(--c-warn-text)] rounded-[var(--r-sm)] text-xs font-medium flex items-start gap-2">
            <span className="material-symbols-outlined text-sm leading-none shrink-0">warning</span>
            <span>{error}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Full Name input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="user-name" className="text-xs font-bold uppercase tracking-wider text-[var(--c-steel)]">
              Full Name
            </label>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
              required
              className="w-full bg-[var(--c-canvas)] text-[var(--c-ink)] border border-[var(--c-hairline-strong)] rounded-[var(--r-md)] px-4 py-2.5 h-[44px] text-sm focus:border-2 focus:border-[var(--c-green-dark)] focus:outline-none transition-all placeholder-[var(--c-muted)]"
              placeholder="e.g. Juan dela Cruz"
            />
          </div>

          {/* Email Address input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="user-email" className="text-xs font-bold uppercase tracking-wider text-[var(--c-steel)]">
              Email Address
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSaving}
              required
              className="w-full bg-[var(--c-canvas)] text-[var(--c-ink)] border border-[var(--c-hairline-strong)] rounded-[var(--r-md)] px-4 py-2.5 h-[44px] text-sm focus:border-2 focus:border-[var(--c-green-dark)] focus:outline-none transition-all placeholder-[var(--c-muted)]"
              placeholder="e.g. juan@email.com"
            />
          </div>

          {/* New Password input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="user-pass" className="text-xs font-bold uppercase tracking-wider text-[var(--c-steel)]">
              New Password <span className="text-[10px] font-normal text-[var(--c-stone)] font-sans lowercase">(leave blank to keep unchanged)</span>
            </label>
            <input
              id="user-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSaving}
              className="w-full bg-[var(--c-canvas)] text-[var(--c-ink)] border border-[var(--c-hairline-strong)] rounded-[var(--r-md)] px-4 py-2.5 h-[44px] text-sm focus:border-2 focus:border-[var(--c-green-dark)] focus:outline-none transition-all placeholder-[var(--c-muted)]"
              placeholder="•••••••• (6+ characters)"
            />
          </div>

          {/* Actions button strip */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 text-xs font-bold rounded-full border border-[var(--c-hairline-strong)] text-[var(--c-slate)] hover:bg-[var(--c-surface-soft)] transition-all select-none disabled:opacity-50"
              type="button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-xs font-bold rounded-full bg-[var(--c-primary)] text-[var(--c-on-primary)] hover:bg-[var(--c-primary-deep)] active:bg-[var(--c-primary-pressed)] transition-all flex items-center gap-1.5 select-none disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-[var(--c-on-primary)] border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]">save</span>
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

