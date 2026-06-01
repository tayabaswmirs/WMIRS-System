/**
 * Maps each category section to its list of incident type options.
 * Used by IncidentForm for dynamic dropdown filtering.
 */
export const INCIDENT_MAP = {
  "Forest Management": [
    "Illegal Logging", "Illegal Tree Cutting", "Kaingin / Slash-and-Burn",
    "Forest Fire", "Illegal Charcoal Production", "Timber Smuggling",
    "Encroachment in Protected Area", "Unauthorized Land Clearing",
    "Deforestation", "Illegal Gathering of Forest Products"
  ],
  "Biodiversity Monitoring": [
    "Wildlife Hunting", "Wildlife Capture", "Wildlife Trafficking",
    "Habitat Destruction", "Killing of Endangered Species",
    "Illegal Wildlife Possession", "Disturbance of Wildlife Habitat"
  ],
  "Water Resources Management": [
    "Water Pollution", "River Contamination", "Illegal Waste Disposal in Waterways",
    "Fish Kill Incident", "Oil Spill", "Illegal Quarrying Near Rivers",
    "Sewage Discharge", "Water Obstruction", "Chemical Contamination"
  ],
  "Waste Management": [
    "Illegal Dumping", "Open Burning of Waste", "Improper Waste Disposal",
    "Plastic Ban Violation", "Hazardous Waste Disposal",
    "Overflowing Garbage Area", "Unsegregated Waste", "Unauthorized Waste Collection"
  ],
  "Environmental Compliance": [
    "Environmental Permit Violation", "Air Pollution Complaint", "Noise Pollution",
    "Unauthorized Construction", "Industrial Pollution", "Chemical Spill",
    "Smoke Emission Violation", "Business Non-Compliance", "Illegal Industrial Discharge"
  ],
  "Land and Ecosystem Protection": [
    "Soil Erosion", "Illegal Quarrying", "Land Conversion Violation",
    "Destruction of Natural Landscape", "Cave Disturbance", "Wetland Destruction"
  ]
};

/**
 * Maps each category to a Material Symbol icon name and an accent color.
 * Used for color-coded category indicators in the table rows and detail drawer.
 *
 * @type {Record<string, { icon: string, color: string }>}
 */
export const CATEGORY_META = {
  "Forest Management":            { icon: "forest",        color: "#00a35c" },
  "Biodiversity Monitoring":      { icon: "pets",          color: "#7b3ff2" },
  "Water Resources Management":   { icon: "water_drop",    color: "#3d4f9f" },
  "Waste Management":             { icon: "delete_sweep",  color: "#fa6e39" },
  "Environmental Compliance":     { icon: "gavel",         color: "#f06bb8" },
  "Land and Ecosystem Protection":{ icon: "landscape",     color: "#00684a" }
};

/** Ordered severity levels for display */
export const SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"];

/**
 * All statuses an admin can assign to an incident report.
 * Ordered from newest/open to closed.
 */
export const ADMIN_STATUSES = ["Submitted", "Under Review", "Resolved", "Dismissed"];

/**
 * Returns the CSS class suffix for a given severity string.
 * @param {string} severity
 * @returns {string}
 */
export const getSeverityClass = (severity) => {
  switch (severity?.toLowerCase()) {
    case "critical": return "severity-critical";
    case "high":     return "severity-high";
    case "medium":   return "severity-medium";
    default:         return "severity-low";
  }
};

/**
 * Returns the CSS class suffix for a given status string.
 * @param {string} status
 * @returns {string}
 */
export const getStatusClass = (status) =>
  `status-${status?.toLowerCase().replace(/\s+/g, "-")}`;

/**
 * Formats a datetime-local string into a human-readable date and time.
 * @param {string} dateStr
 * @returns {string}
 */
export const formatIncidentDate = (dateStr) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch {
    return dateStr || "—";
  }
};
