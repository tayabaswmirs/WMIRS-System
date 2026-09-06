import Avatar from "../Avatar";

export default function AvatarPreviewCanvas({
  previewUrl,
  zoom,
  setZoom,
  userRole = "ranger",
  userName = "User",
  onResetZoom,
}) {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Circular Crop Viewport */}
      <div className="relative flex items-center justify-center py-1">
        <div
          className="relative w-32 h-32 rounded-full overflow-hidden bg-[#001e2b] shadow-md flex items-center justify-center select-none"
          style={{
            border: "3px solid #00ed64",
            boxShadow: "0 0 16px rgba(0, 237, 100, 0.2)",
          }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar preview"
              className="w-full h-full object-cover select-none pointer-events-none"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : (
            <Avatar name={userName} role={userRole} size="xl" />
          )}

          {/* Alignment Crosshairs Overlay */}
          <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-full flex items-center justify-center">
            <div className="w-full h-[1px] bg-white/10" />
            <div className="h-full w-[1px] bg-white/10 absolute" />
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="w-full max-w-xs flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px] text-[#5c6c7a] font-medium">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">zoom_in</span>
            Zoom & Crop
          </span>
          <span className="font-mono text-[#001e2b] font-semibold">{Math.round(zoom * 100)}%</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
            className="p-1 rounded text-[#5c6c7a] hover:text-[#001e2b] hover:bg-gray-100 transition-colors"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <span className="material-symbols-outlined text-[16px]">remove</span>
          </button>

          <input
            type="range"
            min="1"
            max="2.5"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-[#00ed64] cursor-pointer h-1.5 bg-gray-200 rounded-lg"
            aria-label="Avatar zoom level"
          />

          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))}
            className="p-1 rounded text-[#5c6c7a] hover:text-[#001e2b] hover:bg-gray-100 transition-colors"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>

          {zoom !== 1 && (
            <button
              type="button"
              onClick={onResetZoom}
              className="text-[11px] text-[#00684a] hover:underline font-medium ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Multi-Scale System Preview */}
      <div className="w-full pt-2.5 border-t border-[#e1e5e8] flex items-center justify-around text-center">
        <div className="flex flex-col items-center gap-1">
          <div className="w-7 h-7 rounded-full overflow-hidden border border-[#00ed64] shadow-sm bg-[#001e2b]">
            <img src={previewUrl} alt="Topbar preview" className="w-full h-full object-cover" style={{ transform: `scale(${zoom})` }} />
          </div>
          <span className="text-[9px] text-[#7c8c9a] uppercase font-bold tracking-wider">Topbar (28px)</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#00ed64] shadow-sm bg-[#001e2b]">
            <img src={previewUrl} alt="Table preview" className="w-full h-full object-cover" style={{ transform: `scale(${zoom})` }} />
          </div>
          <span className="text-[9px] text-[#7c8c9a] uppercase font-bold tracking-wider">Table (36px)</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#00ed64] shadow-sm bg-[#001e2b]">
            <img src={previewUrl} alt="Card preview" className="w-full h-full object-cover" style={{ transform: `scale(${zoom})` }} />
          </div>
          <span className="text-[9px] text-[#7c8c9a] uppercase font-bold tracking-wider">Profile (48px)</span>
        </div>
      </div>
    </div>
  );
}
