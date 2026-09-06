import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProfileAvatarCard from "../components/common/profile/ProfileAvatarCard";
import ProfileAccountForm from "../components/common/profile/ProfileAccountForm";
import ProfileIdentityCard from "../components/common/profile/ProfileIdentityCard";
import ProfileDangerZone from "../components/common/profile/ProfileDangerZone";
import ProfileReauthModal from "../components/common/profile/ProfileReauthModal";
import { updateUserProfile, deleteSelfAccount } from "../firebase/services/userService";
import { updateUserAuthProfile, loginWithEmail } from "../firebase/services/authService";

export default function Profile() {
  const { currentUser, profileData, userRole, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(() => profileData?.name || currentUser?.displayName || "");
  const [email, setEmail] = useState(() => currentUser?.email || "");
  const [phone, setPhone] = useState(() => profileData?.phone || "");
  const [address, setAddress] = useState(() => profileData?.address || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [reauthOpen, setReauthOpen] = useState(false);
  const [reauthPass, setReauthPass] = useState("");
  const [reauthPurpose, setReauthPurpose] = useState("");
  const [reauthError, setReauthError] = useState("");

  const handleProfileUpdated = async (msg) => {
    setErrorMsg("");
    setSuccessMsg(msg);
    if (refreshProfile) await refreshProfile();
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) return setErrorMsg("Full name is required.");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setErrorMsg("Please enter a valid email address.");
    }

    const emailChanged = email.trim() !== currentUser?.email;
    if (newPassword || emailChanged) {
      if (newPassword) {
        if (newPassword.length < 6) return setErrorMsg("New password must be at least 6 characters.");
        if (newPassword !== confirmPassword) return setErrorMsg("Passwords do not match.");
      }
      setReauthPurpose("save");
      setReauthPass("");
      setReauthError("");
      setReauthOpen(true);
      return;
    }

    performProfileUpdates();
  };

  const performProfileUpdates = async () => {
    try {
      setIsSaving(true);
      setErrorMsg("");
      await updateUserProfile(currentUser.uid, { name: name.trim(), phone: phone.trim(), address: address.trim() });
      await updateUserAuthProfile(currentUser, { name: name.trim() });
      setSuccessMsg("Profile details updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
      if (refreshProfile) await refreshProfile();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to update profile details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReauthSubmit = async (e) => {
    e.preventDefault();
    setReauthError("");
    if (!reauthPass) return setReauthError("Password is required.");

    try {
      setIsSaving(true);
      await loginWithEmail(currentUser.email, reauthPass);

      if (reauthPurpose === "save") {
        const authUpdates = { name: name.trim() };
        if (newPassword) authUpdates.password = newPassword;
        if (email.trim() !== currentUser.email) authUpdates.email = email.trim();
        await updateUserAuthProfile(currentUser, authUpdates);

        const dbUpdates = { name: name.trim(), phone: phone.trim(), address: address.trim() };
        if (email.trim() !== currentUser.email) dbUpdates.email = email.trim();
        await updateUserProfile(currentUser.uid, dbUpdates);

        setSuccessMsg("Profile details and credentials updated.");
        setNewPassword("");
        setConfirmPassword("");
        setReauthOpen(false);
        if (refreshProfile) await refreshProfile();
      } else if (reauthPurpose === "delete") {
        setReauthOpen(false);
        setIsDeleting(true);
        await deleteSelfAccount();
        try { await logout(); } catch (e) { console.error(e); }
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      setReauthError("Incorrect password. Please try again.");
    } finally {
      setIsSaving(false);
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="um-page">
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">Personal Settings</span>
            <h1 className="inc-hero__title">Profile Customization</h1>
            <p className="inc-hero__subtitle">Manage your personal account details, avatar photo, and security preferences.</p>
          </div>
        </div>

        {errorMsg && <div className="um-alert um-alert--error" role="alert"><span className="material-symbols-outlined um-alert__icon">error</span><span>{errorMsg}</span></div>}
        {successMsg && <div className="um-alert um-alert--success" role="status"><span className="material-symbols-outlined um-alert__icon">check_circle</span><span>{successMsg}</span></div>}

        <div className="prof-page">
          <ProfileAvatarCard
            currentUser={currentUser}
            profileData={profileData}
            userRole={userRole}
            onProfileUpdated={handleProfileUpdated}
            onError={(err) => setErrorMsg(err)}
            disabled={isSaving || isDeleting}
          />
          <ProfileAccountForm
            name={name} setName={setName}
            email={email} setEmail={setEmail}
            phone={phone} setPhone={setPhone}
            address={address} setAddress={setAddress}
            newPassword={newPassword} setNewPassword={setNewPassword}
            confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
            onSubmit={handleSaveClick}
            isSaving={isSaving} disabled={isSaving || isDeleting}
          />
          <ProfileIdentityCard profileData={profileData} />
          <ProfileDangerZone
            onDeleteClick={() => { setReauthPurpose("delete"); setReauthPass(""); setReauthError(""); setReauthOpen(true); }}
            isDeleting={isDeleting} disabled={isSaving || isDeleting}
          />
        </div>

        <ProfileReauthModal
          isOpen={reauthOpen} purpose={reauthPurpose}
          password={reauthPass} setPassword={setReauthPass}
          error={reauthError} isSaving={isSaving}
          onSubmit={handleReauthSubmit} onClose={() => setReauthOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}
