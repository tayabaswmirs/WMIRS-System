import { TAYABAS_BOUNDS, TAYABAS_BARANGAY_COORDINATES } from "./tayabasBarangays";

const CACHE_KEY = "wmirs_tiles_cached_at";
const TILE_BASE = "https://tile.openstreetmap.org";
let isPreloading = false;

/**
 * Converts longitude and zoom to OpenStreetMap X tile coordinate.
 */
const lon2tile = (lon, zoom) => Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));

/**
 * Converts latitude and zoom to OpenStreetMap Y tile coordinate.
 */
const lat2tile = (lat, zoom) =>
  Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );

/**
 * Generates all unique tile URLs covering Tayabas City (zooms 12-14 and zoom 15 centroids).
 * 
 * @returns {string[]} Array of OpenStreetMap tile URLs
 */
export const getTayabasTileUrls = () => {
  const urls = new Set();
  const [sw, ne] = TAYABAS_BOUNDS;
  const [minLat, minLng] = sw;
  const [maxLat, maxLng] = ne;

  // Complete coverage for zooms 12, 13, and 14
  for (let z = 12; z <= 14; z++) {
    const minX = lon2tile(minLng, z);
    const maxX = lon2tile(maxLng, z);
    const minY = lat2tile(maxLat, z);
    const maxY = lat2tile(minLat, z);
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        urls.add(`${TILE_BASE}/${z}/${x}/${y}.png`);
      }
    }
  }

  // Zoom 15 street-level detail for all 66 barangay centers
  for (const coords of Object.values(TAYABAS_BARANGAY_COORDINATES)) {
    const [lat, lng] = coords;
    const x = lon2tile(lng, 15);
    const y = lat2tile(lat, 15);
    urls.add(`${TILE_BASE}/15/${x}/${y}.png`);
  }

  return Array.from(urls);
};

/**
 * Checks if Tayabas map tiles have been pre-cached recently.
 * 
 * @param {number} [maxAgeDays=7]
 * @returns {boolean}
 */
export const isTayabasMapCached = (maxAgeDays = 7) => {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    if (!saved) return false;
    const ageMs = Date.now() - parseInt(saved, 10);
    return ageMs < maxAgeDays * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

/**
 * Automatically and silently warms the PWA Cache with Tayabas City map tiles in the background.
 * Uses gentle batching to avoid network or CPU contention.
 * 
 * @param {object} [options]
 * @param {number} [options.concurrency=3] - Max concurrent fetches per batch
 * @param {number} [options.batchDelayMs=50] - Pause between batches
 * @returns {Promise<boolean>} True if preloading completed
 */
export const preloadTayabasTiles = async ({ concurrency = 3, batchDelayMs = 50 } = {}) => {
  if (typeof window === "undefined" || !navigator.onLine) return false;
  if (isPreloading || isTayabasMapCached()) return false;

  isPreloading = true;
  const urls = getTayabasTileUrls();

  try {
    for (let i = 0; i < urls.length; i += concurrency) {
      if (!navigator.onLine) break;
      const batch = urls.slice(i, i + concurrency);
      await Promise.all(
        batch.map((url) =>
          fetch(url, { mode: "no-cors" }).catch(() => null)
        )
      );
      if (batchDelayMs > 0 && i + concurrency < urls.length) {
        await new Promise((res) => setTimeout(res, batchDelayMs));
      }
    }

    try {
      localStorage.setItem(CACHE_KEY, Date.now().toString());
    } catch {
      // Ignore quota errors on localStorage
    }
    return true;
  } catch (err) {
    console.warn("Tile pre-cache idle cycle interrupted:", err);
    return false;
  } finally {
    isPreloading = false;
  }
};
