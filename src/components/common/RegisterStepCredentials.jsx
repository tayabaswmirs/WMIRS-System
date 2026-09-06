import PasswordInput from "./PasswordInput";

/**
 * Step 1 component for account registration credentials.
 *
 * @param {object} props
 * @param {string} props.firstName - First name value
 * @param {function} props.setFirstName - First name updater
 * @param {string} props.lastName - Last name value
 * @param {function} props.setLastName - Last name updater
 * @param {string} props.email - Email address value
 * @param {function} props.setEmail - Email address updater
 * @param {string} props.password - Password value
 * @param {function} props.setPassword - Password updater
 * @param {string} props.confirmPassword - Password confirmation value
 * @param {function} props.setConfirmPassword - Password confirmation updater
 * @param {function} props.onNext - Handler to advance to step 2
 * @param {boolean} props.loading - Form loading status
 */
export default function RegisterStepCredentials({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onNext,
  loading,
}) {
  return (
    <div className="reg-wizard__step">
      <div className="reg-grid-2">
        <div className="reg-field-group">
          <label className="reg-label" htmlFor="reg-first-name">
            First Name <span className="reg-label__req">*</span>
          </label>
          <input
            id="reg-first-name"
            type="text"
            className="reg-input"
            placeholder="e.g. Juan"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="reg-field-group">
          <label className="reg-label" htmlFor="reg-last-name">
            Last Name <span className="reg-label__req">*</span>
          </label>
          <input
            id="reg-last-name"
            type="text"
            className="reg-input"
            placeholder="e.g. Dela Cruz"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>

      <div className="reg-field-group" style={{ marginTop: 12 }}>
        <label className="reg-label" htmlFor="reg-email">
          Email Address <span className="reg-label__req">*</span>
        </label>
        <input
          id="reg-email"
          type="email"
          className="reg-input"
          placeholder="your.name@domain.gov"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="reg-field-group" style={{ marginTop: 12 }}>
        <label className="reg-label" htmlFor="reg-password">
          Password (8+ chars) <span className="reg-label__req">*</span>
        </label>
        <PasswordInput
          id="reg-password"
          className="reg-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a secure password"
          disabled={loading}
          required
        />
      </div>

      <div className="reg-field-group" style={{ marginTop: 12 }}>
        <label className="reg-label" htmlFor="reg-confirm-password">
          Confirm Password <span className="reg-label__req">*</span>
        </label>
        <PasswordInput
          id="reg-confirm-password"
          className="reg-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          disabled={loading}
          required
        />
      </div>

      <div className="reg-actions">
        <button
          type="button"
          className="reg-btn-continue"
          onClick={onNext}
          disabled={loading}
        >
          <span>Continue to Verification</span>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
}
