import { useState } from "react";
import "../../styles/register-wizard.css";

export default function ApplicationReviewModal({ isOpen, user, onClose, onApprove, onReject }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!isOpen || !user) return null;

  const initials = (user.name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const formattedDate = user.createdAt ? new Date(user.createdAt.toMillis ? user.createdAt.toMillis() : user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently";

  return (
    <>
      <div className="arm-overlay" role="dialog" aria-modal="true" aria-labelledby="arm-title" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="arm-card">
          <div className="arm-header">
            <div className="arm-header__left">
              <div className="arm-avatar" aria-hidden="true">{initials}</div>
              <div>
                <h3 id="arm-title" className="arm-title">{user.name || "Applicant"}</h3>
                <p className="arm-subtitle">Submitted on {formattedDate}</p>
              </div>
            </div>
            <button className="arm-close-btn" onClick={onClose} aria-label="Close modal">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="arm-body">
            <div className="arm-info-grid">
              <div className="arm-info-item">
                <span className="arm-info-label">First Name</span>
                <span className="arm-info-value">{user.firstName || user.name?.split(" ")[0] || "—"}</span>
              </div>
              <div className="arm-info-item">
                <span className="arm-info-label">Last Name</span>
                <span className="arm-info-value">{user.lastName || user.name?.split(" ").slice(1).join(" ") || "—"}</span>
              </div>
              <div className="arm-info-item">
                <span className="arm-info-label">Email Address</span>
                <span className="arm-info-value">{user.email || "—"}</span>
              </div>
              <div className="arm-info-item">
                <span className="arm-info-label">Phone Number</span>
                <span className="arm-info-value">{user.phone || "—"}</span>
              </div>
              <div className="arm-info-item arm-info-item--full">
                <span className="arm-info-label">Address / Barangay</span>
                <span className="arm-info-value">{user.address || "—"}</span>
              </div>
              <div className="arm-info-item arm-info-item--full">
                <span className="arm-info-label">Official ID Number</span>
                <span className="arm-info-value" style={{ fontFamily: "monospace", letterSpacing: 0.5 }}>{user.idNumber || "—"}</span>
              </div>
            </div>

            <div className="arm-doc-section">
              <span className="arm-info-label">Submitted Identification Document</span>
              {user.idCardUrl ? (
                <div className="arm-doc-frame" onClick={() => setLightboxOpen(true)} title="Click to view full size">
                  <img src={user.idCardUrl} alt="Submitted ID Card" className="arm-doc-img" />
                  <div className="arm-doc-badge">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>zoom_in</span>
                    <span>Click to Enlarge</span>
                  </div>
                </div>
              ) : (
                <div className="arm-doc-frame" style={{ height: 100, cursor: "default" }}>
                  <span style={{ color: "var(--c-on-dark-muted, #a8b3bc)", fontSize: 13 }}>No ID document on file (Legacy registration)</span>
                </div>
              )}
            </div>
          </div>

          <div className="arm-footer">
            <button type="button" className="arm-btn-reject" onClick={() => onReject(user)}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cancel</span>
              <span>Reject Application</span>
            </button>
            <button type="button" className="arm-btn-approve" onClick={() => onApprove(user)}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
              <span>Approve & Assign Role</span>
            </button>
          </div>
        </div>
      </div>

      {lightboxOpen && user.idCardUrl && (
        <div className="arm-lightbox" onClick={() => setLightboxOpen(false)}>
          <button className="arm-lightbox__close" onClick={() => setLightboxOpen(false)} aria-label="Close enlarged preview">
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={user.idCardUrl} alt="Enlarged ID card" className="arm-lightbox__img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
