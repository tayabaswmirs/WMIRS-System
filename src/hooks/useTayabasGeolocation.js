import { useState, useCallback } from "react";
import { isWithinTayabas } from "../utils/tayabasBarangays";

/**
 * Custom hook managing GPS geolocation acquisition within Tayabas City ENRO boundaries.
 * 
 * @param {Function} onLocationAcquired - Callback receiving valid (latitude, longitude)
 * @param {Function} onError - Callback receiving { type: string, text: string } | null
 * @returns {object} { isLocating, acquireLocation }
 */
export default function useTayabasGeolocation(onLocationAcquired, onError) {
  const [isLocating, setIsLocating] = useState(false);

  const acquireLocation = useCallback(() => {
    if (!navigator.geolocation) {
      onError({ type: "error", text: "Geolocation unsupported on this device." });
      return;
    }
    setIsLocating(true);
    onError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        if (isWithinTayabas(latitude, longitude)) {
          onLocationAcquired(latitude, longitude);
        } else {
          onError({
            type: "error",
            text: `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) is outside Tayabas City.`
          });
        }
      },
      (err) => {
        setIsLocating(false);
        onError({
          type: "warning",
          text: err.code === 1
            ? "Location access denied. Pin manually on the map."
            : "GPS unavailable offline. Pin manually on the map."
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [onLocationAcquired, onError]);

  return { isLocating, acquireLocation };
}
