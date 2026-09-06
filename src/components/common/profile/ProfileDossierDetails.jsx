import { useState } from "react";

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "N/A";
  }
};

export default function ProfileDossierDetails({ profile, isAdmin }) {
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const email = profile?.email || "";
  const phone = profile?.phone || "";

  return (
    <>
      {/* Email Card */}
      <div className="dossier-card">
        <div className="flex items-center min-w-0 flex-1">
          <div className="dossier-card__icon-box">
            <span className="material-symbols-outlined text-[18px]">mail</span>
          </div>
          <div className="dossier-card__content">
            <div className="dossier-card__title">Official Email</div>
            <div className="dossier-card__value" title={email}>{email || "No email available"}</div>
          </div>
        </div>
        {email && (
          <button
            type="button"
            onClick={() => copyToClipboard(email, "email")}
            className="dossier-card__btn"
            title="Copy email to clipboard"
          >
            <span className="material-symbols-outlined text-[14px]">
              {copiedField === "email" ? "check" : "content_copy"}
            </span>
            <span>{copiedField === "email" ? "Copied" : "Copy"}</span>
          </button>
        )}
      </div>

      {/* Phone Card */}
      <div className="dossier-card">
        <div className="flex items-center min-w-0 flex-1">
          <div className="dossier-card__icon-box">
            <span className="material-symbols-outlined text-[18px]">call</span>
          </div>
          <div className="dossier-card__content">
            <div className="dossier-card__title">Contact Number</div>
            <div className="dossier-card__value">{phone || "Not recorded"}</div>
          </div>
        </div>
        {phone && (
          <button
            type="button"
            onClick={() => copyToClipboard(phone, "phone")}
            className="dossier-card__btn"
            title="Copy phone to clipboard"
          >
            <span className="material-symbols-outlined text-[14px]">
              {copiedField === "phone" ? "check" : "content_copy"}
            </span>
            <span>{copiedField === "phone" ? "Copied" : "Copy"}</span>
          </button>
        )}
      </div>

      {/* Jurisdiction Card */}
      <div className="dossier-card">
        <div className="flex items-center min-w-0 flex-1">
          <div className="dossier-card__icon-box">
            <span className="material-symbols-outlined text-[18px]">location_on</span>
          </div>
          <div className="dossier-card__content">
            <div className="dossier-card__title">Jurisdiction & Base</div>
            <div className="dossier-card__value" title={profile?.address}>
              {profile?.address || "Tayabas City, Quezon Province"}
            </div>
          </div>
        </div>
      </div>

      {/* Status & Member Since Card */}
      <div className="dossier-card">
        <div className="flex items-center min-w-0 flex-1">
          <div className="dossier-card__icon-box">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
          </div>
          <div className="dossier-card__content">
            <div className="dossier-card__title">Account Standing</div>
            <div className="dossier-card__value">
              <span className="text-[#00684a] font-bold">Verified Active</span> • Joined {formatDate(profile?.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Administrator-Only: Verified Government Credential */}
      {isAdmin && profile?.idCardUrl && (
        <div className="p-3.5 bg-[#e3fcef] rounded-xl border border-[rgba(0,163,92,0.35)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#00684a] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              Official Government Credential
            </span>
            <span className="font-mono text-[11px] font-semibold text-[#001e2b] bg-white px-2 py-0.5 rounded border border-[#c1ccd6]">
              {profile?.idNumber || "ID Verified"}
            </span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <a href={profile.idCardUrl} target="_blank" rel="noopener noreferrer" className="block w-20 h-13 rounded-lg overflow-hidden border border-gray-300 shrink-0 bg-black group relative shadow-sm">
              <img src={profile.idCardUrl} alt="ID Document" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <span className="material-symbols-outlined text-[16px]">fullscreen</span>
              </div>
            </a>
            <div className="text-xs text-[#5c6c7a]">
              <p className="m-0 font-medium text-[#001e2b]">Vetted identification document</p>
              <a href={profile.idCardUrl} target="_blank" rel="noopener noreferrer" className="text-[#00684a] hover:underline font-semibold mt-1 inline-flex items-center gap-0.5 text-[11px]">
                Inspect Document
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
