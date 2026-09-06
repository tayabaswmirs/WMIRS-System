import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import useLoadingLock from "../hooks/useLoadingLock";
import PasswordInput from "../components/common/PasswordInput";
import RegisterWizard from "../components/common/RegisterWizard";
import wmirsLogo from "../assets/wmirs-logo.png";
import "../styles/login.css";

const formatAuthError = (err) => {
  const errorCode = err?.code;
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "An account with this email address already exists. Please sign in instead.";
    case "auth/weak-password":
      return "The password chosen is too weak. It must be at least 8 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      return err?.message || "Authentication process failed. Please try again.";
  }
};

function Login() {
  const formRef = useRef(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { currentUser, userRole, loading: authLoading, login, register } = useAuth();
  const navigate = useNavigate();

  useLoadingLock(formRef, formLoading);

  // Redirect authenticated users to their corresponding dashboard
  useEffect(() => {
    if (currentUser && !authLoading) {
      if (userRole === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [currentUser, userRole, authLoading, navigate]);

  const handleToggleMode = () => {
    setIsRegistering((prev) => !prev);
    setErrorMsg("");
    setSuccessMsg("");
    setEmail("");
    setPassword("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both your email and password.");
      setFormLoading(false);
      return;
    }

    try {
      await login(email.trim(), password);
    } catch (err) {
      console.error("Login failure:", err);
      setErrorMsg(formatAuthError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleRegisterSubmit = async (formData) => {
    setFormLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await register(formData);
      setSuccessMsg("Account registered successfully! Redirecting to pending approval...");
    } catch (err) {
      console.error("Registration failure:", err);
      setErrorMsg(formatAuthError(err));
    } finally {
      setFormLoading(false);
    }
  };

  // If initial authentication state is being retrieved, show a clean loading screen
  if (authLoading) {
    return (
      <div className="login-loading-screen" role="status" aria-live="polite">
        <div className="login-loading-inner">
          <div className="login-loading-spinner" aria-hidden="true" />
          <p className="login-loading-text">Loading authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">

      {/* ── Left Hero Panel ───────────────────────────────── */}
      <aside className="login-hero" aria-label="System branding">
        <div className="login-hero__content">
          <img
            src={wmirsLogo}
            alt="WMIRS Logo"
            className="login-hero__logo"
          />

          <h1 className="login-hero__wordmark">
            WM<span>IRS</span>
          </h1>

          <p className="login-hero__tagline">
            Web-Based Monitoring and Incident Reporting System
          </p>

          <div className="login-hero__divider" aria-hidden="true" />

          <div className="login-hero__badge" role="status">
            <div className="login-hero__badge-dot" aria-hidden="true" />
            System Online
          </div>

          {/* Feature highlights */}
          <div className="login-hero__features" aria-label="System features">
            <div className="login-hero__feature-item">
              <div className="login-hero__feature-icon" aria-hidden="true">
                <span className="material-symbols-outlined">bar_chart</span>
              </div>
              <div className="login-hero__feature-text">
                <strong>Monitoring Records</strong>
                Track environmental data across all ENRO sections
              </div>
            </div>
            <div className="login-hero__feature-item">
              <div className="login-hero__feature-icon" aria-hidden="true">
                <span className="material-symbols-outlined">emergency</span>
              </div>
              <div className="login-hero__feature-text">
                <strong>Incident Reporting</strong>
                Submit and manage incident reports in real-time
              </div>
            </div>
            <div className="login-hero__feature-item">
              <div className="login-hero__feature-icon" aria-hidden="true">
                <span className="material-symbols-outlined">summarize</span>
              </div>
              <div className="login-hero__feature-text">
                <strong>Reports &amp; Analytics</strong>
                Generate reports for decision-making
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right Form Panel ──────────────────────────────── */}
      <main className="login-form-panel">
        <div className="login-form-wrapper">

          {/* Form header */}
          <div className="login-form-header">
            <h2 className="login-form-header__title">
              {isRegistering ? "Register Account" : "Welcome back"}
            </h2>
            <p className="login-form-header__subtitle">
              {isRegistering
                ? "Complete verification to request system access"
                : "Sign in to access your WMIRS dashboard"}
            </p>
          </div>

          {/* Tab toggle — Sign In / Register */}
          <div className="login-tab-row" role="tablist" aria-label="Authentication mode">
            <button
              id="login-tab-signin"
              role="tab"
              type="button"
              aria-selected={!isRegistering}
              className={`login-tab${!isRegistering ? " login-tab--active" : ""}`}
              onClick={() => isRegistering && handleToggleMode()}
            >
              Sign In
            </button>
            <button
              id="login-tab-register"
              role="tab"
              type="button"
              aria-selected={isRegistering}
              className={`login-tab${isRegistering ? " login-tab--active" : ""}`}
              onClick={() => !isRegistering && handleToggleMode()}
            >
              Register
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="login-alert login-alert--error" role="alert" aria-live="assertive">
              <span className="login-alert__icon" aria-hidden="true">⚠️</span>
              <span><strong>Error:</strong> {errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="login-alert login-alert--success" role="status" aria-live="polite">
              <span className="login-alert__icon" aria-hidden="true">✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {isRegistering ? (
            <RegisterWizard
              onRegister={handleRegisterSubmit}
              loading={formLoading}
              errorMsg={errorMsg}
              setErrorMsg={setErrorMsg}
            />
          ) : (
            <form id="login-auth-form" ref={formRef} onSubmit={handleLoginSubmit} noValidate>
              <div className="login-field">
                <label htmlFor="auth-email" className="login-label">Email Address</label>
                <input
                  id="auth-email"
                  className="login-input"
                  placeholder="example@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="auth-password" className="login-label">Password</label>
                <PasswordInput
                  id="auth-password"
                  className="login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                className="login-btn-primary"
                disabled={formLoading}
              >
                {formLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          <p className="login-footer">
            © WMIRS · City ENRO System
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;
