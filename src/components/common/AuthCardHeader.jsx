/**
 * Header and mode switcher pill tabs for the authentication card.
 *
 * @param {object} props
 * @param {boolean} props.isRegistering - Active tab mode
 * @param {function} props.onToggleMode - Switcher handler
 */
export default function AuthCardHeader({ isRegistering, onToggleMode }) {
  return (
    <>
      <div className="login-card__header">
        <span className="login-card__eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            verified
          </span>
          <span>Official Access Portal</span>
        </span>
        <h2 className="login-card__title">
          {isRegistering ? "Register Account" : "Welcome back"}
        </h2>
        <p className="login-card__subtitle">
          {isRegistering
            ? "Provide your official details to request system access."
            : "Authenticate to access your active ENRO workspace."}
        </p>
      </div>

      <div className="login-pill-tabs" role="tablist" aria-label="Portal Access Mode">
        <button
          id="login-tab-signin"
          role="tab"
          type="button"
          aria-selected={!isRegistering}
          className={`login-pill-tab${!isRegistering ? " login-pill-tab--active" : ""}`}
          onClick={() => isRegistering && onToggleMode(false)}
        >
          Sign In
        </button>
        <button
          id="login-tab-register"
          role="tab"
          type="button"
          aria-selected={isRegistering}
          className={`login-pill-tab${isRegistering ? " login-pill-tab--active" : ""}`}
          onClick={() => !isRegistering && onToggleMode(true)}
        >
          Register
        </button>
      </div>
    </>
  );
}
