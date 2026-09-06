# System Design: Tayabas City 3-Tier Addressing & Geolocation System

**Status:** Validated & Approved  
**Date:** 2026-09-06  
**Scope:** WMIRS-SYSTEM Frontend & PWA Core  

---

## 1. Executive Summary & Problem Context

Currently, location inputs across the WMIRS system are captured as unstandardized, freeform text strings (`location: "Brgy. San Isidro, Tayabas"` in `IncidentForm.jsx`, `barangay: "..."` in `WasteTrackingForm.jsx`, and `locationMarker: "..."` in water monitoring forms). This results in:
* Fragmented and brittle analytics (waste logistics charts fail to aggregate cleanly due to casing, typos, and variations like "Barangay San Isidro" vs "San Isidro").
* Polluted filter dropdowns in `useLogFilters.js` that scrape whatever raw strings exist in Firestore documents.
* Inability for ENRO rangers to accurately specify coordinates or drop pins when conducting field inspections.

This design introduces a standardized **3-Tier Addressing and Geolocation System** incorporating the 66 canonical barangays of Tayabas City, specific street/sitio details, and optional PWA-friendly Leaflet/OpenStreetMap coordinate capture bounded strictly to ENRO's jurisdiction.

---

## 2. Complete Decision Log

| # | Decision | Options Considered | Rationale |
| :--- | :--- | :--- | :--- |
| **01** | **Addressing Structure** | (A) 2-Tier, (B) 3-Tier with Geolocation, (C) Barangay Only | Selected **Option B**: Provides granular locality for incident dispatch while maintaining full spatial context. |
| **02** | **Mapping & Geolocation** | Mandatory Map vs Optional Progressive Geolocation | Selected **Optional Progressive**: Submission is never blocked if GPS or map pinning is skipped. PWA attempts device GPS first, with manual pin/coordinate fallback. |
| **03** | **Geographic Boundary** | Unrestricted Global Map vs Strict Tayabas Bounds | Selected **Strict Tayabas Bounds**: Leaflet `maxBounds` locked to ENRO jurisdiction (Lat 13.9300–14.1500 N, Lng 121.5000–121.6800 E) to prevent out-of-boundary submissions. |
| **04** | **Existing Records Handling** | (A) Hybrid Migration, (B) Non-Destructive Code Fallback, (C) Hard Cutover | Selected **Option B (Zero Database Writes)**: Existing Firestore documents remain untouched. Downstream readers, filters, and analytics use a resilient fallback parser. |
| **05** | **Mapping Engine** | Leaflet + OpenStreetMap vs Google Maps JS API | Selected **Leaflet + OpenStreetMap**: Lightweight, open-source, zero API keys or billing overhead. Supports offline coordinate capture even when map tiles fail to load. |
| **06** | **Component Architecture** | Unified Atomic Component vs Separate Inputs + Modal | Selected **Approach 1 (Atomic `<LocationAddressPicker />`)**: Encapsulates Leaflet lifecycle, geolocation, and boundary validation in a single reusable component. |

---

## 3. Data Architecture & Specifications

### 3.1 Canonical Constants (`src/utils/tayabasBarangays.js`)
* **66 Canonical Barangays of Tayabas City**:
  1. Alitao
  2. Alsam Ibaba
  3. Alsam Ilaya
  4. Angeles
  5. Balagtas
  6. Banahaw
  7. Barangay Zone I (Poblacion)
  8. Barangay Zone II (Poblacion)
  9. Barangay Zone III (Poblacion)
  10. Barangay Zone IV (Poblacion)
  11. Barangay Zone V (Poblacion)
  12. Barangay Zone VI (Poblacion)
  13. Bukal
  14. Calumpang
  15. Camaysa
  16. Dapdap
  17. Domoit
  18. Gibanga
  19. Ibas
  20. Ilasan Ibaba
  21. Ilasan Ilaya
  22. Ipilan
  23. Isabang
  24. Katigan
  25. Lakawan
  26. Lalo
  27. Lawigue
  28. Lita
  29. Malaoa
  30. Masin
  31. Mate
  32. Mateuna
  33. May-Itao
  34. Nagsinamo
  35. Pandakaki
  36. Potol
  37. San Bernardo
  38. San Diego Ibaba
  39. San Diego Ilaya
  40. San Isidro Ibaba
  41. San Isidro Ilaya
  42. San Jose
  43. San Rafael
  44. San Roque
  45. Silangang Bukal
  46. Silangang Calumpang
  47. Silangang Palale
  48. Talolong
  49. Tamlong
  50. Tongko
  51. Valencia
  52. Wakas
  53. Kanlurang Calumpang
  54. Kanlurang Palale
  55. Baguio
  56. Ayuti
  57. Camastilisan
  58. Pandakaki
  59. Palale Centro
  60. Palale Ilaya
  61. Palale Silangan
  62. Potol
  63. Mamatid
  64. Ibabang Bukal
  65. Ilayang Bukal
  66. Ibabang Palale

*(Note: The full canonical 66-barangay list will be verified and formatted alphabetically with standardized naming).*

* **Geographic Boundary Box**:
  * Default Center: `[14.0250, 121.5930]`
  * `TAYABAS_BOUNDS = [[13.9300, 121.5000], [14.1500, 121.6800]]`
  * Validation Helper: `isWithinTayabas(lat, lng)`

### 3.2 Output Data Contract
```typescript
interface LocationPayload {
  barangay: string; // Required, exactly one of the 66 canonical names
  sitioStreet: string; // Optional/Required, e.g. "Purok 3, Near Brgy Hall"
  coordinates: {
    lat: number;
    lng: number;
  } | null; // Optional coordinate pair
  location: string; // Computed backward-compatible full address string
}
```

---

## 4. Component Architecture (`LocationAddressPicker.jsx`)

* **Tier 1 (Barangay Selector)**: Fast-lookup `<select>` with standard MongoDB-themed styling tokens (`#00ed64` focus borders, neutral surface palettes).
* **Tier 2 (Specific Location)**: Input field for Sitio / Purok / Street / Landmark.
* **Tier 3 (Collapsible Geolocation Panel)**:
  * Collapsed by default: `"📍 Precise Location & Map Pinning (Optional)"`.
  * **Lazy-loaded Leaflet Canvas**: Map DOM and OpenStreetMap tiles initialize strictly upon panel expansion to conserve memory and render time.
  * **"Use My Current Location"**: Queries `navigator.geolocation.getCurrentPosition({ enableHighAccuracy: true })`.
  * **Boundary Guard**: `maxBounds={TAYABAS_BOUNDS}` with `maxBoundsViscosity=1.0` prevents panning out of ENRO jurisdiction.
  * **Manual Inputs**: Latitude and Longitude inputs allow rangers to key in coordinates directly from external instruments.
  * **Offline PWA Readiness**: Even with disconnected cell service, device satellite GPS acquires coordinates and passes them safely into `outboxDb.js`.

---

## 5. Backward Compatibility & Downstream Consumers

* **Helper `resolveBarangay(record)`**:
  * Checks if `record.barangay` matches a canonical name.
  * If legacy, runs fuzzy match against `record.location` or `record.locationMarker`.
  * Falls back to `"Unclassified"`.
* **Search & Filters (`useLogFilters.js`)**:
  * Populates filter options directly from `TAYABAS_BARANGAYS`.
  * Matches both `item.barangay` and legacy `item.location`.
* **Analytics (`StaffDashboard.jsx`, `ComplianceAnalyticsView.jsx`)**:
  * Groups waste volume and incident tallies cleanly without messy prefix-stripping regex.
* **Export Services (`exportService.js`)**:
  * Retains `item.location || item.barangay` formatting while outputting clean coordinates when present.

---

## 6. Verification & Quality Gates

1. **Automated Validation**: Zero ESLint warnings (`npm run lint`) and clean Vite production build (`npm run build`).
2. **PWA & Offline Outbox Verification**: Verify that reports with GPS coordinates queue correctly when offline and sync when online.
3. **Map Boundary Validation**: Confirm pins cannot be placed outside Tayabas City ENRO boundaries.
4. **Historical Record Integrity**: Confirm existing incident records render cleanly without runtime errors.
