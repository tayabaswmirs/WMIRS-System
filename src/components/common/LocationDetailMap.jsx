import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { getBarangayCoordinates, resolveBarangay } from "../../utils/tayabasBarangays";

const pinIcon = L.divIcon({
  className: "lap-map-pin-wrap",
  html: `<div class="lap-map-pin"><span class="lap-map-pin-inner material-symbols-outlined">eco</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

/**
 * Compact embedded geolocation preview map for Incident and Monitoring Detail drawers.
 * Strictly adheres to MongoDB visual tokens, SRP, and non-blocking drawer flow.
 */
export default function LocationDetailMap({ location, coordinates, barangay }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const isExact = Boolean(
    coordinates &&
    typeof coordinates.lat === "number" &&
    typeof coordinates.lng === "number" &&
    !isNaN(coordinates.lat) &&
    !isNaN(coordinates.lng)
  );

  const canonicalBarangay = barangay || resolveBarangay({ location, barangay });
  const targetCoords = isExact
    ? [coordinates.lat, coordinates.lng]
    : getBarangayCoordinates(canonicalBarangay);

  const [targetLat, targetLng] = targetCoords;

  useEffect(() => {
    if (!isExpanded || !mapContainerRef.current) return;

    const centerPoint = [targetLat, targetLng];
    const map = L.map(mapContainerRef.current, {
      center: centerPoint,
      zoom: isExact ? 16 : 14,
      minZoom: 11,
      maxZoom: 18,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

    const marker = L.marker(centerPoint, { icon: pinIcon }).addTo(map);
    const popupContent = isExact
      ? `<strong>${location || "Exact Site"}</strong>`
      : `<strong>Brgy. ${canonicalBarangay}</strong><br/><small>Centroid estimate</small>`;
    marker.bindPopup(popupContent);

    mapInstanceRef.current = map;
    const resizeTimer = setTimeout(() => map.invalidateSize(), 150);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isExpanded, isExact, targetLat, targetLng, location, canonicalBarangay]);

  if (!location && !coordinates && !barangay) return null;

  const googleMapsUrl = `https://www.google.com/maps?q=${targetCoords[0]},${targetCoords[1]}`;

  return (
    <div className="lap-detail-map-section">
      <div className="lap-detail-map-header">
        <span className="inc-drawer__section-label">
          <span className="material-symbols-outlined inc-drawer__section-label-icon">map</span>
          Site Geolocation &amp; Map
        </span>
        <button
          type="button"
          className="lap-detail-map-toggle"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
            {isExpanded ? "expand_less" : "expand_more"}
          </span>
          {isExpanded ? "Hide Map" : "View Map"}
        </button>
      </div>

      {isExpanded && (
        <div className="lap-detail-map-frame">
          <div
            className={`lap-detail-map-badge ${
              isExact ? "lap-detail-map-badge--exact" : "lap-detail-map-badge--approx"
            }`}
          >
            <span className="lap-detail-map-dot" />
            {isExact
              ? `Exact Site (${targetCoords[0].toFixed(5)}, ${targetCoords[1].toFixed(5)})`
              : `Brgy. ${canonicalBarangay} (Centroid)`}
          </div>

          <div ref={mapContainerRef} className="lap-detail-map-canvas" />

          <div className="lap-detail-map-footer">
            <span className="lap-detail-map-label">
              <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>
                location_on
              </span>
              Brgy. {canonicalBarangay}
            </span>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="lap-detail-map-ext"
              title="Open directions in Google Maps"
            >
              Google Maps
              <span className="material-symbols-outlined" style={{ fontSize: "0.85rem" }}>
                open_in_new
              </span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
