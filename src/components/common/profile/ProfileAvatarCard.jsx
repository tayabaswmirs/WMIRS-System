import { useState } from "react";
import Avatar from "../Avatar";
import AvatarUploadModal from "./AvatarUploadModal";
import { uploadUserProfilePicture, deleteUserProfilePicture, updateUserProfile } from "../../../firebase/services/userService";
import { updateUserAuthProfile } from "../../../firebase/services/authService";

export default function ProfileAvatarCard({ currentUser, profileData, userRole, onProfileUpdated, onError, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayName = profileData?.name || currentUser?.displayName || "User";
  const photoURL = profileData?.photoURL || currentUser?.photoURL || "";

  const handleUploadNewAvatar = async (file) => {
    try {
      setUploading(true);
      setProgress(0);
      if (profileData?.profilePicturePath) {
        await deleteUserProfilePicture(profileData.profilePicturePath).catch((err) => console.warn(err));
      }
      const { url, path } = await uploadUserProfilePicture(currentUser.uid, file, setProgress);
      await updateUserProfile(currentUser.uid, { photoURL: url, profilePicturePath: path });
      await updateUserAuthProfile(currentUser, { photoURL: url });
      setIsModalOpen(false);
      if (onProfileUpdated) await onProfileUpdated("Profile picture updated successfully.");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      onError("Failed to upload profile picture. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoURL || !window.confirm("Are you sure you want to remove your profile picture?")) return;
    try {
      setUploading(true);
      if (profileData?.profilePicturePath) await deleteUserProfilePicture(profileData.profilePicturePath);
      await updateUserProfile(currentUser.uid, { photoURL: "", profilePicturePath: "" });
      await updateUserAuthProfile(currentUser, { photoURL: "" });
      if (onProfileUpdated) await onProfileUpdated("Profile picture removed.");
    } catch (err) {
      console.error(err);
      onError("Failed to remove profile picture.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="prof-card">
      <h2 className="prof-card__title" style={{ margin: 0 }}>Official Identification & Photo</h2>
      <div className="prof-avatar-card">
        <div className="prof-avatar-preview">
          <Avatar src={photoURL} name={displayName} role={userRole} size="2xl" />
          <button
            type="button"
            className="prof-avatar-badge"
            onClick={() => setIsModalOpen(true)}
            disabled={disabled || uploading}
            title="Upload new photo"
            aria-label="Upload profile picture"
          >
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
          </button>
        </div>

        <div className="prof-avatar-info">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-[#001e2b]">{displayName}</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#c3f0d2] text-[#00684a]">
              Active
            </span>
          </div>
          <span className="prof-avatar-hint">
            JPG, PNG, or WebP up to 5MB. Visible to colleagues and reviewers across the system.
          </span>

          <div className="prof-avatar-actions mt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={disabled || uploading}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-[#00ed64] text-[#001e2b] hover:bg-[#00b545] transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
              {photoURL ? "Change Photo" : "Upload Photo"}
            </button>
            {photoURL && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={disabled || uploading}
                className="px-3.5 py-2 rounded-full text-xs font-medium text-[#dc2626] hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <AvatarUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={currentUser}
        userRole={userRole}
        onUpload={handleUploadNewAvatar}
        uploading={uploading}
        progress={progress}
        onError={onError}
      />
    </div>
  );
}
