import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";
import { updateUserProfile, deleteSelfAccount } from "../firebase/services/userService";
import { updateUserAuthProfile, loginWithEmail } from "../firebase/services/authService";

export default function Profile() {
  const { currentUser, profileData, logout } = useAuth();
  const navigate = useNavigate();

  // Local form states (initialized directly from authenticated context)
  const [name, setName] = useState(() => profileData?.name || currentUser?.displayName || "");
  const [email, setEmail] = useState(() => currentUser?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI States
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal States
  const [reauthModalOpen, setReauthModalOpen] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [reauthPurpose, setReauthPurpose] = useState(""); // 'save' or 'delete'
  const [reauthError, setReauthError] = useState("");

  // Handle standard form save click
  const handleSaveClick = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    const emailChanged = email.trim() !== currentUser?.email;

    // Password / Email change validation
    if (newPassword || emailChanged) {
      if (newPassword) {
        if (newPassword.length < 6) {
          setErrorMsg("New password must be at least 6 characters.");
          return;
        }
        if (newPassword !== confirmPassword) {
          setErrorMsg("Passwords do not match.");
          return;
        }
      }

      // Requires re-authentication before updating sensitive Auth credentials (password/email)
      setReauthPurpose("save");
      setReauthPassword("");
      setReauthError("");
      setReauthModalOpen(true);
      return;
    }

    // Direct save if only updating name
    performProfileUpdates();
  };

  // Perform standard profile name update without credential changes
  const performProfileUpdates = async () => {
    try {
      setIsSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      // 1. Update Firestore user details
      await updateUserProfile(currentUser.uid, {
        name: name.trim(),
      });

      // 2. Update Auth display name
      await updateUserAuthProfile(currentUser, { name: name.trim() });

      setSuccessMsg("Profile details updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Profile update error:", err);
      setErrorMsg("Failed to update profile details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle re-authentication and credential updates
  const handleReauthSubmit = async (e) => {
    e.preventDefault();
    setReauthError("");

    if (!reauthPassword) {
      setReauthError("Password is required.");
      return;
    }

    try {
      setIsSaving(true);
      
      // Re-authenticate user by logging in again (using current Auth email)
      await loginWithEmail(currentUser.email, reauthPassword);

      if (reauthPurpose === "save") {
        // 1. Update Firebase Authentication
        const authUpdates = { name: name.trim() };
        if (newPassword) authUpdates.password = newPassword;
        if (email.trim() !== currentUser.email) authUpdates.email = email.trim();

        await updateUserAuthProfile(currentUser, authUpdates);

        // 2. Update Firestore profile details
        const dbUpdates = { name: name.trim() };
        if (email.trim() !== currentUser.email) dbUpdates.email = email.trim();

        await updateUserProfile(currentUser.uid, dbUpdates);

        setSuccessMsg("Profile details and login credentials successfully updated.");
        setNewPassword("");
        setConfirmPassword("");
        setReauthModalOpen(false);
      } else if (reauthPurpose === "delete") {
        // Proceed with secure self-deletion
        setReauthModalOpen(false);
        setIsDeleting(true);
        await deleteSelfAccount();
        
        // Explicitly clear local auth session to trigger state cleanup and instant unmounting
        try {
          await logout();
        } catch (e) {
          console.error("Sign out error after self-deletion:", e);
        }

        // Redirect to login after successful deletion
        navigate("/login");
      }
    } catch (err) {
      console.error("Re-authentication error:", err);
      setReauthError("Incorrect password. Please try again.");
    } finally {
      setIsSaving(false);
      setIsDeleting(false);
    }
  };

  const handleDeleteAccountClick = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setReauthPurpose("delete");
    setReauthPassword("");
    setReauthError("");
    setReauthModalOpen(true);
  };

  return (
    <DashboardLayout pageTitle="Profile Settings">
      <div className="um-page">
        {/* Page Header */}
        <div className="um-page-header">
          <div className="um-page-header__text">
            <span className="um-page-header__eyebrow">Personal settings</span>
            <h1 className="um-page-header__title">Profile Customization</h1>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {errorMsg && (
          <div className="um-alert um-alert--error" role="alert">
            <span className="material-symbols-outlined um-alert__icon" aria-hidden="true">error</span>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="um-alert um-alert--success" role="status">
            <span className="material-symbols-outlined um-alert__icon" aria-hidden="true">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        <div className="prof-page">
          {/* Main Settings Card */}
          <div className="prof-card">
            <h2 className="prof-card__title">Account Information</h2>
            
            <form onSubmit={handleSaveClick} className="um-edit-form">
              <div className="prof-grid">
                {/* Full Name field */}
                <div className="um-form-group">
                  <label htmlFor="prof-name" className="um-form-label">Full Name</label>
                  <input
                    id="prof-name"
                    type="text"
                    required
                    disabled={isSaving || isDeleting}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="um-form-input"
                    placeholder="Juan dela Cruz"
                  />
                </div>

                {/* Editable Email Address */}
                <div className="um-form-group">
                  <label htmlFor="prof-email" className="um-form-label">Email Address</label>
                  <input
                    id="prof-email"
                    type="email"
                    required
                    disabled={isSaving || isDeleting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="um-form-input"
                    placeholder="juan@email.com"
                  />
                </div>
              </div>

              <div className="prof-card__title" style={{ marginTop: "var(--sp-md)", borderBottom: "1px solid var(--c-hairline-soft)" }}>
                Change Password
              </div>
              <p className="um-edit-desc" style={{ textAlign: "left", fontSize: "12px", margin: "0" }}>
                To modify your current password, fill in the fields below. Otherwise, leave them blank to keep your current password.
              </p>

              <div className="prof-grid">
                {/* New Password */}
                <div className="um-form-group">
                  <label htmlFor="prof-pass" className="um-form-label">New Password</label>
                  <input
                    id="prof-pass"
                    type="password"
                    disabled={isSaving || isDeleting}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="um-form-input"
                    placeholder="•••••••• (6+ characters)"
                  />
                </div>

                {/* Confirm New Password */}
                <div className="um-form-group">
                  <label htmlFor="prof-confirm" className="um-form-label">Confirm New Password</label>
                  <input
                    id="prof-confirm"
                    type="password"
                    disabled={isSaving || isDeleting}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="um-form-input"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={isSaving || isDeleting}
                  className="um-btn-confirm um-btn-confirm--primary"
                  style={{ borderRadius: "var(--r-full)", height: "40px" }}
                >
                  {isSaving && reauthPurpose === "save" ? (
                    <>
                      <span className="um-spinner" aria-hidden="true" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">save</span>
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone Card */}
          <div className="prof-card prof-danger-zone">
            <h2 className="prof-danger-zone__title">
              <span className="material-symbols-outlined" aria-hidden="true">warning</span>
              Danger Zone
            </h2>
            <div className="prof-danger-zone__desc">
              Permanently delete your profile document and authentication account from the WMIRS Monitoring System. 
              All your submitted items and historical actions will remain preserved within the system logs for record integrity. 
              <strong> This operation cannot be reversed.</strong>
            </div>

            <button
              onClick={handleDeleteAccountClick}
              disabled={isSaving || isDeleting}
              type="button"
              className="um-btn-confirm um-btn-confirm--danger prof-danger-zone__action"
            >
              {isDeleting ? (
                <>
                  <span className="um-spinner" aria-hidden="true" />
                  Deleting account...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">delete_forever</span>
                  Delete My Account
                </>
              )}
            </button>
          </div>
        </div>

        {/* Re-Authentication password verification Modal */}
        {reauthModalOpen && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(0,30,43,0.65)] backdrop-blur-[3px] transition-opacity duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reauth-modal-title"
            onKeyDown={(e) => { if (e.key === "Escape" && !isSaving) setReauthModalOpen(false); }}
          >
            <div className="um-edit-panel">
              <button
                onClick={() => setReauthModalOpen(false)}
                disabled={isSaving}
                className="absolute top-4 right-4 text-[var(--c-stone)] hover:text-[var(--c-ink)] transition-colors p-1 flex items-center justify-center"
                aria-label="Close dialog"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>

              <div className="um-edit-icon-wrap" aria-hidden="true" style={{ background: reauthPurpose === "delete" ? "rgba(220, 38, 38, 0.08)" : "rgba(0, 104, 74, 0.08)", borderColor: reauthPurpose === "delete" ? "rgba(220, 38, 38, 0.15)" : "rgba(0, 104, 74, 0.15)" }}>
                <span className="material-symbols-outlined text-[28px]" style={{ color: reauthPurpose === "delete" ? "#dc2626" : "var(--c-green-dark)" }}>
                  {reauthPurpose === "delete" ? "lock_reset" : "shield_lock"}
                </span>
              </div>

              <h2 id="reauth-modal-title" className="um-edit-title">
                {reauthPurpose === "delete" ? "Verify Identity to Delete Account" : "Confirm Profile Updates"}
              </h2>

              <p className="um-edit-desc">
                {reauthPurpose === "delete" 
                  ? "For security purposes, please re-enter your current password to authorize this permanent deletion."
                  : "Updating security credentials (email or password) requires verifying your current login password."}
              </p>

              <form onSubmit={handleReauthSubmit} className="um-edit-form">
                {reauthError && (
                  <div className="um-form-error" role="alert">
                    <span className="material-symbols-outlined text-sm leading-none shrink-0" aria-hidden="true">
                      warning
                    </span>
                    <span>{reauthError}</span>
                  </div>
                )}

                <div className="um-form-group">
                  <label htmlFor="reauth-pass" className="um-form-label">Current Password</label>
                  <input
                    id="reauth-pass"
                    type="password"
                    required
                    disabled={isSaving}
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    className="um-form-input"
                    placeholder="••••••••"
                  />
                </div>

                <div className="um-confirm-actions">
                  <button
                    onClick={() => setReauthModalOpen(false)}
                    disabled={isSaving}
                    className="um-btn-secondary"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`um-btn-confirm ${reauthPurpose === "delete" ? "um-btn-confirm--danger" : "um-btn-confirm--primary"}`}
                  >
                    {isSaving ? (
                      <>
                        <span className="um-spinner" aria-hidden="true" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                          {reauthPurpose === "delete" ? "delete" : "verified"}
                        </span>
                        {reauthPurpose === "delete" ? "Confirm Account Purge" : "Verify & Save"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
