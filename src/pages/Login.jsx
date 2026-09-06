import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import useLoadingLock from "../hooks/useLoadingLock";
import AuthHeroPanel from "../components/common/AuthHeroPanel";
import AuthCardHeader from "../components/common/AuthCardHeader";
import SignInForm from "../components/common/SignInForm";
import RegisterWizard from "../components/common/RegisterWizard";
import { formatAuthError } from "../utils/formatAuthError";
import "../styles/login.css";

export default function Login() {
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

  useEffect(() => {
    if (currentUser && !authLoading) {
      navigate(userRole === "admin" ? "/admin/dashboard" : "/dashboard");
    }
  }, [currentUser, userRole, authLoading, navigate]);

  const handleToggleMode = (registerMode) => {
    setIsRegistering(registerMode);
    setErrorMsg("");
    setSuccessMsg("");
    setEmail("");
    setPassword("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!email.trim() || !password) {
      setErrorMsg("Please enter both your email and password.");
      return;
    }
    setFormLoading(true);
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

  if (authLoading) {
    return (
      <div className="login-loading-screen" role="status" aria-live="polite">
        <div className="login-loading-inner">
          <div className="login-loading-spinner" aria-hidden="true" />
          <p className="login-loading-text">Connecting to WMIRS secure gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <AuthHeroPanel />

      <main className="login-form-panel">
        <div className="login-card">
          <AuthCardHeader
            isRegistering={isRegistering}
            onToggleMode={handleToggleMode}
          />

          {errorMsg && (
            <div className="login-alert login-alert--error" role="alert" aria-live="assertive">
              <span className="material-symbols-outlined login-alert__icon" aria-hidden="true">
                error
              </span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="login-alert login-alert--success" role="status" aria-live="polite">
              <span className="material-symbols-outlined login-alert__icon" aria-hidden="true">
                check_circle
              </span>
              <span>{successMsg}</span>
            </div>
          )}

          {isRegistering ? (
            <RegisterWizard
              onRegister={handleRegisterSubmit}
              loading={formLoading}
              setErrorMsg={setErrorMsg}
            />
          ) : (
            <SignInForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onSubmit={handleLoginSubmit}
              loading={formLoading}
              formRef={formRef}
            />
          )}

          <p className="login-footer">
            © WMIRS · City Environment and Natural Resources Office
          </p>
        </div>
      </main>
    </div>
  );
}
