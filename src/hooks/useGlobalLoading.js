import { useContext } from "react";
import { LoadingContext } from "../context/LoadingContext";

/**
 * useGlobalLoading — Hook to trigger and manage global viewport-level loading locks.
 * Exposes: isLoading, loadingMessage, startLoading, stopLoading, and withLoading.
 */
export function useGlobalLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useGlobalLoading must be used within a LoadingProvider");
  }
  return context;
}
