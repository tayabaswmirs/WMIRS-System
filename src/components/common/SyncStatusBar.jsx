import { useState, useEffect } from "react";
import { subscribeSyncState, syncPendingOutbox } from "../../services/syncService";

/**
 * SyncStatusBar — Displays real-time network connectivity and background sync status.
 * Adheres to MongoDB design tokens with high-contrast pills and micro-animations.
 */
function SyncStatusBar() {
  const [syncState, setSyncState] = useState({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    justSynced: false,
  });
  const [showSyncedNotice, setShowSyncedNotice] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSyncState((newState) => {
      setSyncState(newState);

      if (newState.justSynced) {
        setShowSyncedNotice(true);
        const timer = setTimeout(() => setShowSyncedNotice(false), 4000);
        return () => clearTimeout(timer);
      }
    });

    return unsubscribe;
  }, []);

  const { isOnline, isSyncing, pendingCount } = syncState;

  // Render "Just Synced" feedback badge
  if (showSyncedNotice) {
    return (
      <div 
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#00ed64]/10 text-[#00ed64] border border-[#00ed64]/30 shadow-sm transition-all duration-300"
        role="status"
        aria-live="polite"
      >
        <span className="material-symbols-outlined text-sm text-[#00ed64]">check_circle</span>
        <span>All logs synced</span>
      </div>
    );
  }

  // Render "Syncing..." in-progress badge
  if (isSyncing) {
    return (
      <div 
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#00ed64]/15 text-[#00ed64] border border-[#00ed64]/40 shadow-sm animate-pulse"
        role="status"
        aria-live="polite"
      >
        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
        <span>Syncing {pendingCount} {pendingCount === 1 ? "log" : "logs"}...</span>
      </div>
    );
  }

  // Render "Offline Mode" badge when disconnected
  if (!isOnline) {
    return (
      <div 
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm"
        role="status"
        aria-live="polite"
        title="Operating offline. All submissions will be queued locally."
      >
        <span className="material-symbols-outlined text-sm text-amber-400">cloud_off</span>
        <span>Offline Mode</span>
        {pendingCount > 0 && (
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px]">
            {pendingCount} outbox
          </span>
        )}
      </div>
    );
  }

  // If online with pending items (e.g. initial connection), show pending pill with retry trigger
  if (pendingCount > 0) {
    return (
      <button 
        type="button"
        onClick={() => syncPendingOutbox()}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#00ed64]/10 text-[#00ed64] border border-[#00ed64]/30 hover:bg-[#00ed64]/20 transition-colors cursor-pointer"
        title="Click to sync queued reports now"
      >
        <span className="material-symbols-outlined text-sm">cloud_upload</span>
        <span>{pendingCount} pending sync</span>
      </button>
    );
  }

  // Clean, minimal online status
  return null;
}

export default SyncStatusBar;
