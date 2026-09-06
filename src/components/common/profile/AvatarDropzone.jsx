import { useRef } from "react";

export default function AvatarDropzone({ onFileSelected, isDragOver, setIsDragOver, disabled }) {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files?.[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={`avatar-dropzone-box ${isDragOver ? "drag-over" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => onFileSelected(e.target.files?.[0])}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
      />
      <div className="w-12 h-12 rounded-full bg-[#c3f0d2] text-[#00684a] flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-[26px]">cloud_upload</span>
      </div>
      <p className="text-sm font-bold text-[#001e2b] m-0" style={{ color: "#001e2b" }}>
        Click to upload or drag & drop
      </p>
      <p className="text-xs text-[#5c6c7a] mt-1 mb-3">JPG, PNG, or WebP up to 5MB</p>
      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#e1e5e8] text-[#5c6c7a]">
        Official Avatar Resolution
      </span>
    </div>
  );
}
