import PasswordInput from "./PasswordInput";

/**
 * Sign In Form component handling user credential inputs.
 *
 * @param {object} props
 * @param {string} props.email - Controlled email state
 * @param {function} props.setEmail - Email updater
 * @param {string} props.password - Controlled password state
 * @param {function} props.setPassword - Password updater
 * @param {function} props.onSubmit - Submission handler
 * @param {boolean} props.loading - Form processing status
 * @param {React.RefObject} props.formRef - DOM ref for loading lock
 */
export default function SignInForm({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  loading,
  formRef,
}) {
  return (
    <form id="login-auth-form" ref={formRef} onSubmit={onSubmit} noValidate className="login-form">
      {/* Email Field */}
      <div className="login-field">
        <label htmlFor="auth-email" className="login-label">
          <span className="material-symbols-outlined login-label__icon" aria-hidden="true">
            mail
          </span>
          <span>Email Address</span>
        </label>
        <div className="login-input-container">
          <input
            id="auth-email"
            className="login-input"
            placeholder="officer@enro.tayabas.gov"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            disabled={loading}
            required
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="login-field">
        <div className="login-label-row">
          <label htmlFor="auth-password" className="login-label">
            <span className="material-symbols-outlined login-label__icon" aria-hidden="true">
              lock
            </span>
            <span>Password</span>
          </label>
        </div>
        <div className="login-input-container">
          <PasswordInput
            id="auth-password"
            className="login-input"
            placeholder="Enter account security key"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
            required
          />
        </div>
      </div>

      {/* Submit Button (MongoDB signature green pill) */}
      <button
        id="login-submit-btn"
        type="submit"
        className="login-btn-primary"
        disabled={loading}
      >
        <span>{loading ? "Authenticating Session..." : "Sign In to Portal"}</span>
        <span className="material-symbols-outlined login-btn-arrow" aria-hidden="true">
          arrow_forward
        </span>
      </button>

      {/* Trust & Security Badge */}
      <div className="login-trust-badge" aria-label="Security standard">
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          shield_lock
        </span>
        <span>256-Bit SSL Encrypted Official Session</span>
      </div>
    </form>
  );
}
