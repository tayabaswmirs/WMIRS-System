import { useState, useEffect } from "react";
import Avatar from "./Avatar";
import ProfileDossierDetails from "./profile/ProfileDossierDetails";
import { getUserPublicProfile } from "../../firebase/services/userService";

export default function UserProfileModal({ isOpen, user, userId, onClose, viewerRole = "ranger" }) {
  const [profile, setProfile] = useState(user || null);
  const [fetchedUid, setFetchedUid] = useState(null);

  const isAdmin = viewerRole === "admin";
  const targetUid = userId || user?.uid;
  const loading = isOpen && Boolean(targetUid) && fetchedUid !== targetUid;

  useEffect(() => {
    if (!isOpen || !targetUid) return;
    let isMounted = true;

    getUserPublicProfile(targetUid, isAdmin)
      .then((data) => {
        if (isMounted) {
          setProfile(data || user || null);
          setFetchedUid(targetUid);
        }
      })
      .catch((err) => {
        console.warn("Failed to load user profile:", err);
        if (isMounted) {
          setProfile(user || null);
          setFetchedUid(targetUid);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetUid, isAdmin, user]);

  if (!isOpen) return null;

  const role = profile?.role || "ranger";
  const displayName = profile?.name || profile?.displayName || "System User";
  const roleName = role === "admin" ? "System Administrator" : role === "staff" ? `ENRO Staff (${profile?.staffScope || "General"})` : "Forest Ranger";

  return (
    <div
      className="dossier-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div className="dossier-modal animate-in fade-in zoom-in-95 duration-150">
        {/* Banner with Ambient Glow */}
        <div className="dossier-banner">
          <div className="dossier-badge-verified">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ed64] animate-pulse" />
            Verified Record
          </div>

          <button
            onClick={onClose}
            className="dossier-close-btn"
            aria-label="Close modal"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Profile Identity Bar: Avatar Overlap + Name & Role */}
        <div className="dossier-identity">
          <div className="dossier-avatar-ring">
            <Avatar src={profile?.photoURL} name={displayName} role={role} size="2xl" />
          </div>

          <h2 id="profile-modal-title" className="dossier-name">
            {displayName}
          </h2>

          <div className="dossier-role-pill">
            <span className="material-symbols-outlined text-[15px]">
              {role === "admin" ? "admin_panel_settings" : role === "staff" ? "badge" : "nature_people"}
            </span>
            <span>{roleName}</span>
          </div>
        </div>

        {/* Dossier Content Body */}
        <div className="dossier-body modal-slim-scroll">
          {loading ? (
            <div className="py-10 text-center text-[#5c6c7a] text-xs flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-xl text-[#00a35c]">progress_activity</span>
              <span>Loading institutional record...</span>
            </div>
          ) : (
            <ProfileDossierDetails profile={profile} isAdmin={isAdmin} />
          )}
        </div>

        {/* Fixed Footer Action */}
        <div className="dossier-footer">
          <button
            type="button"
            onClick={onClose}
            className="dossier-footer-btn"
          >
            <span className="material-symbols-outlined text-[16px]">check</span>
            Close Record
          </button>
        </div>
      </div>
    </div>
  );
}
