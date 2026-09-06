import { useState, useRef } from "react";
import AvatarPreviewCanvas from "./AvatarPreviewCanvas";
import AvatarDropzone from "./AvatarDropzone";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const VALID_MIMES = ["image/jpeg", "image/png", "image/webp"];

export default function AvatarUploadModal({
  isOpen,
  onClose,
  currentUser,
  userRole = "ranger",
  onUpload,
  uploading,
  progress,
  onError,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const hiddenInputRef = useRef(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (uploading) return;
    setSelectedFile(null);
    setPreviewUrl(null);
    setZoom(1);
    setIsDragOver(false);
    onClose();
  };

  const validateAndLoadFile = (file) => {
    if (!file) return;
    if (!VALID_MIMES.includes(file.type)) return onError("Please upload a valid JPG, PNG, or WebP image.");
    if (file.size > MAX_IMAGE_SIZE) return onError("Profile image exceeds the 5MB size limit.");

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleConfirmSave = async () => {
    if (selectedFile && onUpload) {
      await onUpload(selectedFile);
      handleClose();
    }
  };

  return (
    <div
      className="avatar-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-modal-title"
      onKeyDown={(e) => { if (e.key === "Escape") handleClose(); }}
    >
      <div className="avatar-modal-card animate-in fade-in zoom-in-95 duration-150">
        <div className="avatar-modal-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00ed64]/15 text-[#00ed64] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </div>
            <div>
              <h3 id="avatar-modal-title" className="avatar-modal-title">Customize Profile Picture</h3>
              <p className="avatar-modal-sub">Position and frame your official avatar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="dossier-close-btn"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <div className="avatar-modal-body">
          <input
            type="file"
            ref={hiddenInputRef}
            onChange={(e) => validateAndLoadFile(e.target.files?.[0])}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          {!previewUrl ? (
            <AvatarDropzone
              onFileSelected={validateAndLoadFile}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              disabled={uploading}
            />
          ) : (
            <AvatarPreviewCanvas
              previewUrl={previewUrl}
              zoom={zoom}
              setZoom={setZoom}
              userRole={userRole}
              userName={currentUser?.displayName || "User"}
              onResetZoom={() => setZoom(1)}
            />
          )}

          {uploading && (
            <div className="mt-1">
              <div className="flex justify-between text-xs font-semibold text-[#00684a] mb-1">
                <span>Uploading to secure storage...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#00ed64] h-1.5 transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="avatar-modal-footer">
          {previewUrl ? (
            <button
              type="button"
              onClick={() => hiddenInputRef.current?.click()}
              disabled={uploading}
              className="text-xs font-semibold text-[#00684a] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              Choose Other
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="avatar-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              disabled={!selectedFile || uploading}
              className="avatar-btn-primary"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              Save Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
