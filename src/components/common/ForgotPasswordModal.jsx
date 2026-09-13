import { useState, useEffect } from "react";
import { resetPasswordWithEmail } from "../../firebase/services/authService";
import { formatAuthError } from "../../utils/formatAuthError";

/**
 * Modal dialog for requesting a password reset email.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {function} props.onClose - Callback to close the modal
 * @param {string} [props.initialEmail] - Default pre-filled email from login form
 */
export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = "" }) {
  const [email, setEmail] = useState(initialEmail || "");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithEmail(trimmed);
      setSubmitted(true);
    } catch (err) {
      // Anti-enumeration: treat user-not-found as successful dispatch
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-email") {
        setSubmitted(true);
      } else {
        console.error("Password reset error:", err);
        setErrorMsg(formatAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="forgot-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-modal-title"
      aria-describedby="forgot-modal-desc"
    >
      <div className="forgot-modal-card">
        {/* Close Button */}
        <button
          type="button"
          className="forgot-modal-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Close password recovery dialog"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            close
          </span>
        </button>

        {submitted ? (
          /* Success / Confirmation State */
          <div className="forgot-modal-success">
            <div className="forgot-modal-icon-wrap forgot-modal-icon-wrap--success">
              <span className="material-symbols-outlined" aria-hidden="true">
                mark_email_read
              </span>
            </div>
            <h2 id="forgot-modal-title" className="forgot-modal-title">
              Reset Link Sent
            </h2>
            <p id="forgot-modal-desc" className="forgot-modal-desc">
              If an account matches <strong>{email.trim()}</strong>, password reset instructions have been dispatched. Please check your inbox and spam folder.
            </p>
            <button
              type="button"
              className="login-btn-primary forgot-modal-btn"
              onClick={onClose}
            >
              <span>Back to Sign In</span>
              <span className="material-symbols-outlined login-btn-arrow" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          </div>
        ) : (
          /* Request Reset Form */
          <form onSubmit={handleSubmit} noValidate className="forgot-modal-form">
            <div className="forgot-modal-icon-wrap">
              <span className="material-symbols-outlined" aria-hidden="true">
                lock_reset
              </span>
            </div>
            <h2 id="forgot-modal-title" className="forgot-modal-title">
              Reset Password
            </h2>
            <p id="forgot-modal-desc" className="forgot-modal-desc">
              Enter your account email and we will send a secure link to reset your credentials.
            </p>

            {errorMsg && (
              <div className="login-alert login-alert--error" role="alert" aria-live="assertive">
                <span className="material-symbols-outlined login-alert__icon" aria-hidden="true">
                  error
                </span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="login-field">
              <label htmlFor="forgot-email" className="login-label">
                <span className="material-symbols-outlined login-label__icon" aria-hidden="true">
                  mail
                </span>
                <span>Email Address</span>
              </label>
              <div className="login-input-container">
                <input
                  id="forgot-email"
                  className="login-input"
                  placeholder="officer@enro.tayabas.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  disabled={loading}
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="login-btn-primary forgot-modal-btn"
              disabled={loading}
            >
              <span>{loading ? "Sending Recovery Link..." : "Send Reset Link"}</span>
              <span className="material-symbols-outlined login-btn-arrow" aria-hidden="true">
                send
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
