/**
 * Unified Temporal Bucketing Utility for WMIRS Analytics.
 * Conforms to FILE_ORGANIZATION.md (Pure JavaScript Utility).
 */

export const TIME_RANGES = ["1D", "1W", "1M", "1Y", "All Time"];

/**
 * Extracts milliseconds epoch from various timestamp formats.
 * @param {object|Date|string|number} itemDate
 * @returns {number|null}
 */
export function extractTimestampMs(itemDate) {
  if (!itemDate) return null;
  if (typeof itemDate.toMillis === "function") return itemDate.toMillis();
  if (typeof itemDate.toDate === "function") return itemDate.toDate().getTime();
  if (typeof itemDate.seconds === "number") return itemDate.seconds * 1000;
  if (itemDate instanceof Date) return itemDate.getTime();
  const parsed = new Date(itemDate).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Creates empty temporal buckets based on timeRange and items.
 * @param {string} timeRange - "1D" | "1W" | "1M" | "1Y" | "All Time"
 * @param {Array} items - Source items (used to find earliest date for "All Time")
 * @param {object} initialSeries - Object with keys and initial count 0, e.g. { "Avian Census": 0 }
 * @returns {Array<object>}
 */
export function createTemporalBuckets(timeRange, items = [], initialSeries = {}) {
  const now = new Date();
  const buckets = [];

  if (timeRange === "All Time") {
    const validTimestamps = items
      .map((item) => extractTimestampMs(item.createdAt || item.dateTime))
      .filter((ts) => ts !== null && ts > 0);

    let startDate;
    if (validTimestamps.length > 0) {
      const minTs = Math.min(...validTimestamps);
      startDate = new Date(minTs);
    } else {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 11);
    }

    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const current = new Date(startDate);
    const endTarget = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    while (current < endTarget) {
      buckets.push({
        label: current.toLocaleDateString(undefined, { month: "short", year: "numeric" }),
        timestamp: current.getTime(),
        year: current.getFullYear(),
        month: current.getMonth(),
        ...JSON.parse(JSON.stringify(initialSeries))
      });
      current.setMonth(current.getMonth() + 1);
    }

    return buckets;
  }

  if (timeRange === "1Y") {
    const current = new Date(now);
    current.setMonth(current.getMonth() - 11);
    current.setDate(1);
    current.setHours(0, 0, 0, 0);

    for (let i = 0; i < 12; i++) {
      buckets.push({
        label: current.toLocaleDateString(undefined, { month: "short", year: "numeric" }),
        timestamp: current.getTime(),
        year: current.getFullYear(),
        month: current.getMonth(),
        ...JSON.parse(JSON.stringify(initialSeries))
      });
      current.setMonth(current.getMonth() + 1);
    }

    return buckets;
  }

  const numBuckets = timeRange === "1D" ? 24 : timeRange === "1W" ? 7 : 30;
  const bucketDurationMs = timeRange === "1D" ? 3600000 : 86400000;
  const half = Math.floor(numBuckets / 2);

  for (let i = half; i > half - numBuckets; i--) {
    const d = new Date(now.getTime() - i * bucketDurationMs);
    const label = timeRange === "1D"
      ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "numeric", hour12: true })
      : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

    buckets.push({
      label,
      timestamp: d.getTime(),
      ...JSON.parse(JSON.stringify(initialSeries))
    });
  }

  return buckets;
}

/**
 * Finds the matching bucket for an item timestamp and increments series values.
 * @param {Array<object>} buckets
 * @param {string} timeRange
 * @param {number} timestampMs
 * @param {Function} updateFn - Callback taking (bucket) to increment series
 */
export function incrementTemporalBucket(buckets, timeRange, timestampMs, updateFn) {
  if (!buckets || buckets.length === 0 || !timestampMs) return;

  if (timeRange === "1Y" || timeRange === "All Time") {
    const d = new Date(timestampMs);
    const year = d.getFullYear();
    const month = d.getMonth();
    const targetBucket = buckets.find((b) => b.year === year && b.month === month);
    if (targetBucket) {
      updateFn(targetBucket);
    }
  } else {
    // Check if timestamp is within bounds
    const firstBucketTs = buckets[0].timestamp;
    const lastBucketTs = buckets[buckets.length - 1].timestamp;
    const bucketInterval = timeRange === "1D" ? 3600000 : 86400000;

    if (timestampMs < firstBucketTs - bucketInterval || timestampMs > lastBucketTs + bucketInterval) {
      return;
    }

    let bestIdx = 0;
    let minDiff = Infinity;
    buckets.forEach((b, idx) => {
      const diff = Math.abs(b.timestamp - timestampMs);
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = idx;
      }
    });

    if (buckets[bestIdx]) {
      updateFn(buckets[bestIdx]);
    }
  }
}
