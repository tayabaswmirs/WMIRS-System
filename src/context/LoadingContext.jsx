/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useCallback } from "react";

export const LoadingContext = createContext(null);

/**
 * LoadingProvider — supplies global page-wide loading locking.
 * Displays a viewport-wide backdrop overlay with a premium spinner and 
 * customizable task description message.
 */
export function LoadingProvider({ children }) {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const startLoading = useCallback((message = "Processing...") => {
    setLoadingMessage(message);
    setGlobalLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setGlobalLoading(false);
    setLoadingMessage("");
  }, []);

  // Wraps an asynchronous action, locking the screen during execution
  const withLoading = useCallback(async (actionFn, message) => {
    try {
      startLoading(message);
      return await actionFn();
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return (
    <LoadingContext.Provider
      value={{
        isLoading: globalLoading,
        loadingMessage,
        startLoading,
        stopLoading,
        withLoading,
      }}
    >
      {children}
      {globalLoading && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[rgba(0,30,43,0.7)] backdrop-blur-[3px] transition-all duration-200"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-4 p-8 bg-[var(--c-canvas)] border border-[var(--c-hairline)] rounded-[var(--r-xl)] shadow-[var(--shadow-4)] max-w-xs text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[rgba(0,104,74,0.08)] border border-[rgba(0,104,74,0.15)]">
              <span className="material-symbols-outlined text-[var(--c-green-dark)] animate-spin text-[26px] leading-none" aria-hidden="true">
                progress_activity
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--c-ink)]">
                {loadingMessage}
              </p>
              <p className="text-xs text-[var(--c-stone)] mt-1">
                Please wait a moment.
              </p>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
