import { useEffect } from "react";

/**
 * useLoadingLock — Locks (disables and grays out) all inputs, textareas, selects,
 * and buttons inside a specified DOM container (ref) whenever loading is true.
 *
 * It dynamically tracks and modifies the native 'disabled' attribute of elements
 * within the container to maintain maximum accessibility and screen-reader awareness.
 *
 * It selectively marks and restores elements to prevent overriding pre-existing
 * disabled states (e.g. button disabled by form validation).
 *
 * @param {object} ref - React ref targeting the container element
 * @param {boolean} isLoading - Active loading state
 */
export default function useLoadingLock(ref, isLoading) {
  useEffect(() => {
    if (!ref || !ref.current) return;

    const container = ref.current;

    // Toggle container classes and attributes for custom styling
    if (isLoading) {
      container.setAttribute("data-loading", "true");
      container.classList.add("um-loading-locked");
    } else {
      container.removeAttribute("data-loading");
      container.classList.remove("um-loading-locked");
    }

    // Target all common interactive form controls
    const selector = "input, textarea, select, button";
    const elements = container.querySelectorAll(selector);

    elements.forEach((el) => {
      if (isLoading) {
        // Cache originally disabled controls so we don't mistakenly re-enable them later
        if (el.disabled) {
          el.setAttribute("data-originally-disabled", "true");
        } else {
          el.disabled = true;
          el.setAttribute("data-disabled-by-lock", "true");
        }
      } else {
        // Restore controls only if they were disabled by this hook
        if (el.getAttribute("data-disabled-by-lock") === "true") {
          el.disabled = false;
          el.removeAttribute("data-disabled-by-lock");
        }
        el.removeAttribute("data-originally-disabled");
      }
    });
  }, [ref, isLoading]);
}
