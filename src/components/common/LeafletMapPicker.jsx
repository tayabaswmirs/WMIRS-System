import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { TAYABAS_CENTER, TAYABAS_BOUNDS, isWithinTayabas, getBarangayCoordinates } from "../../utils/tayabasBarangays";
import { preloadTayabasTiles } from "../../utils/mapTilePreloader";
import useTayabasGeolocation from "../../hooks/useTayabasGeolocation";
import MapToolbar from "./MapToolbar";
import MapCoordinateInputs from "./MapCoordinateInputs";

const customPinIcon = L.divIcon({
  className: "lap-map-pin-wrap",
  html: `<div class="lap-map-pin"><span class="lap-map-pin-inner material-symbols-outlined">eco</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

export default function LeafletMapPicker({ coordinates, onChange, barangay }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const popupRef = useRef(null);
  const initialCenterRef = useRef(
    coordinates ? [coordinates.lat, coordinates.lng] : getBarangayCoordinates(barangay)
  );
  const [geoNotice, setGeoNotice] = useState(null);

  const handleCoordinateUpdate = useCallback((rawLat, rawLng) => {
    const lat = parseFloat(rawLat.toFixed(5));
    const lng = parseFloat(rawLng.toFixed(5));
    if (!isWithinTayabas(lat, lng)) {
      setGeoNotice({ type: "error", text: "Position outside Tayabas City ENRO boundary." });
      return;
    }
    setGeoNotice(null);
    onChange({ lat, lng });
  }, [onChange]);

  const handleGpsAcquired = useCallback((lat, lng) => {
    handleCoordinateUpdate(lat, lng);
    mapInstanceRef.current?.flyTo([lat, lng], 16);
  }, [handleCoordinateUpdate]);

  const { isLocating, acquireLocation } = useTayabasGeolocation(handleGpsAcquired, setGeoNotice);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const initialCenter = initialCenterRef.current;
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialCenter === TAYABAS_CENTER ? 13 : 15,
      minZoom: 11,
      maxZoom: 18,
      maxBounds: TAYABAS_BOUNDS,
      maxBoundsViscosity: 1.0,
      attributionControl: false,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    map.on("click", (e) => handleCoordinateUpdate(e.latlng.lat, e.latlng.lng));
    mapInstanceRef.current = map;

    const resizeTimer = setTimeout(() => map.invalidateSize(), 150);
    const idleTimer = setTimeout(() => preloadTayabasTiles(), 1200);

    return () => {
      clearTimeout(resizeTimer);
      clearTimeout(idleTimer);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [handleCoordinateUpdate]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !barangay) return;
    const target = getBarangayCoordinates(barangay);
    map.invalidateSize();
    map.flyTo(target, 15, { duration: 1.25, easeLinearity: 0.25 });

    if (popupRef.current) map.removeLayer(popupRef.current);
    const popup = L.popup({
      closeButton: false,
      autoClose: true,
      className: "lap-barangay-popup",
      offset: [0, -10],
    })
      .setLatLng(target)
      .setContent(`<div class="lap-popup-badge">📍 Brgy. ${barangay}</div>`)
      .openOn(map);
    popupRef.current = popup;
  }, [barangay]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (coordinates) {
      if (markerRef.current) {
        markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
      } else {
        const marker = L.marker([coordinates.lat, coordinates.lng], { icon: customPinIcon, draggable: true }).addTo(map);
        marker.on("dragend", (e) => handleCoordinateUpdate(e.target.getLatLng().lat, e.target.getLatLng().lng));
        markerRef.current = marker;
      }
    } else if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  }, [coordinates, handleCoordinateUpdate]);

  const handleClear = () => {
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    onChange(null);
    setGeoNotice(null);
  };

  return (
    <div className="lap-map-panel">
      <MapToolbar
        isLocating={isLocating}
        onLocate={acquireLocation}
        onClear={handleClear}
        hasCoordinates={Boolean(coordinates)}
      />
      <div ref={mapContainerRef} className="lap-leaflet-container" />
      {geoNotice && (
        <div className={`lap-boundary-notice lap-boundary-notice--${geoNotice.type}`}>
          <span className="material-symbols-outlined lap-boundary-notice__icon">
            {geoNotice.type === "error" ? "error" : "info"}
          </span>
          {geoNotice.text}
        </div>
      )}
      <MapCoordinateInputs coordinates={coordinates} onUpdate={handleCoordinateUpdate} />
    </div>
  );
}
