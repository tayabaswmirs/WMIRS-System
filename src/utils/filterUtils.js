/**
 * Normalizes any timestamp or date string into a JavaScript Date object.
 * @param {any} rawDate 
 * @returns {Date|null}
 */
export const parseLogDate = (rawDate) => {
  if (!rawDate) return null;
  if (rawDate.seconds) return new Date(rawDate.seconds * 1000);
  const parsed = new Date(rawDate);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Checks if a date falls within a given preset or custom date range.
 * @param {Date|null} itemDate 
 * @param {string} preset 
 * @param {string} customStart 
 * @param {string} customEnd 
 * @returns {boolean}
 */
export const isDateInRange = (itemDate, preset, customStart, customEnd) => {
  if (preset === "all" || !itemDate) return preset === "all";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === "today") return itemDate >= startOfToday;
  if (preset === "7d") return itemDate >= new Date(startOfToday.getTime() - 7 * 86400000);
  if (preset === "30d") return itemDate >= new Date(startOfToday.getTime() - 30 * 86400000);

  if (preset === "custom") {
    if (customStart && itemDate < new Date(customStart)) return false;
    if (customEnd && itemDate > new Date(`${customEnd}T23:59:59.999`)) return false;
    return true;
  }

  return true;
};

/**
 * Evaluates whether an incident report is a critical submission awaiting review.
 * @param {Object} incident 
 * @returns {boolean}
 */
export const isCriticalSubmitted = (incident) => {
  if (!incident) return false;
  const sev = incident.severity?.toLowerCase();
  const st = incident.status?.toLowerCase();
  return sev === "critical" && (st === "submitted" || st === "under review");
};

/**
 * Evaluates whether an incident report is a critical item in an active stage.
 * In active staff stages (awaiting review, active assignments, pending verification),
 * critical incidents are treated as priority Tier 0.
 * In completed archive, priority elevation is disabled.
 * In global admin context (stageId = null), defaults to submitted & under review.
 * 
 * @param {Object} incident 
 * @param {string|null} [stageId=null]
 * @returns {boolean}
 */
export const isCriticalActive = (incident, stageId = null) => {
  if (!incident) return false;
  if (incident.severity?.toLowerCase() !== "critical") return false;
  if (stageId === "completed-archive") return false;

  const st = incident.status?.toLowerCase();
  if (stageId) {
    const activeStatuses = ["submitted", "under review", "assigned", "unresolved", "resolved"];
    return activeStatuses.includes(st);
  }
  return st === "submitted" || st === "under review";
};

/**
 * Sorts incidents with critical items prioritized at the top (Tier 0),
 * followed by all other submissions/incidents (Tier 1), preserving chronological
 * newest-first order within each tier.
 * 
 * @param {Array} incidents 
 * @param {boolean} [prioritize=true] 
 * @param {Object} [options={}]
 * @param {string|null} [options.stageId=null]
 * @returns {Array}
 */
export const sortIncidentsWithPriority = (incidents = [], prioritize = true, options = {}) => {
  if (!Array.isArray(incidents)) return [];
  const copy = [...incidents];
  const { stageId = null } = options;

  if (stageId === "completed-archive") {
    return copy.sort((a, b) => {
      const timeA = parseLogDate(a.dateTime || a.createdAt)?.getTime() || 0;
      const timeB = parseLogDate(b.dateTime || b.createdAt)?.getTime() || 0;
      return timeB - timeA;
    });
  }

  return copy.sort((a, b) => {
    if (prioritize) {
      const aCrit = isCriticalActive(a, stageId) ? 1 : 0;
      const bCrit = isCriticalActive(b, stageId) ? 1 : 0;
      if (aCrit !== bCrit) {
        return bCrit - aCrit; // Critical active comes first
      }
    }

    const timeA = parseLogDate(a.dateTime || a.createdAt)?.getTime() || 0;
    const timeB = parseLogDate(b.dateTime || b.createdAt)?.getTime() || 0;
    return timeB - timeA;
  });
};

