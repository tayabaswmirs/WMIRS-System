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
 * Maps each category to a Material Symbol icon name, accent color, and short description.
 * Used for visual category selection cards in step 1 of the incident wizard.
 *
 * @type {Record<string, { icon: string, color: string, desc: string }>}
 */
export const CATEGORY_META = {
  "Forest Management": {
    icon: "forest",
    color: "#00a35c",
    desc: "Tree cutting, illegal logging, slash-and-burn, forest fire, and timber smuggling."
  },
  "Biodiversity Monitoring": {
    icon: "pets",
    color: "#7b3ff2",
    desc: "Wildlife hunting, illegal capture, trafficking, and habitat destruction."
  },
  "Water Resources Management": {
    icon: "water_drop",
    color: "#3d4f9f",
    desc: "Water pollution, river contamination, fish kills, oil spills, and illegal quarrying."
  },
  "Waste Management": {
    icon: "delete_sweep",
    color: "#fa6e39",
    desc: "Illegal dumping, open waste burning, plastic ban violations, and hazardous waste."
  },
  "Environmental Compliance": {
    icon: "gavel",
    color: "#f06bb8",
    desc: "Permit violations, industrial emissions, chemical spills, and noise complaints."
  },
  "Land and Ecosystem Protection": {
    icon: "landscape",
    color: "#00684a",
    desc: "Soil erosion, illegal land quarrying, wetland destruction, and landscape damage."
  }
};

/**
 * Maps each specific incident type to an icon and short descriptive subtitle.
 * Used for step 2 sub-category card buttons in the incident wizard.
 *
 * @type {Record<string, { icon: string, desc: string }>}
 */
export const INCIDENT_TYPE_META = {
  "Illegal Logging": { icon: "park", desc: "Unauthorized timber extraction and forest clearing." },
  "Illegal Tree Cutting": { icon: "content_cut", desc: "Cutting of trees without necessary permits." },
  "Kaingin / Slash-and-Burn": { icon: "local_fire_department", desc: "Slash-and-burn clearing of forest lands for agriculture." },
  "Forest Fire": { icon: "fire_truck", desc: "Uncontrolled wildland fire spreading in forest zones." },
  "Illegal Charcoal Production": { icon: "skillet", desc: "Unauthorized burning of wood for commercial charcoal." },
  "Timber Smuggling": { icon: "local_shipping", desc: "Illicit transport and sale of harvested timber." },
  "Encroachment in Protected Area": { icon: "fence", desc: "Settlement or development within restricted forest reserves." },
  "Unauthorized Land Clearing": { icon: "do_not_disturb_on", desc: "Bulldozing or clearing vegetation without authorization." },
  "Deforestation": { icon: "nature_people", desc: "Large-scale permanent removal of forest canopy." },
  "Illegal Gathering of Forest Products": { icon: "eco", desc: "Unlicensed collection of wild flora, rattan, or wood." },

  "Wildlife Hunting": { icon: "target", desc: "Unauthorized hunting or poaching of wild animals." },
  "Wildlife Capture": { icon: "catching_pokemon", desc: "Trapping or capturing protected fauna species." },
  "Wildlife Trafficking": { icon: "shopping_bag", desc: "Commercial trade or transport of wild animals." },
  "Habitat Destruction": { icon: "broken_image", desc: "Damage to natural breeding or nesting environments." },
  "Killing of Endangered Species": { icon: "priority_high", desc: "Lethal harm caused to threatened or endangered fauna." },
  "Illegal Wildlife Possession": { icon: "home_pin", desc: "Unlawful keeping of wild animals as pets or stock." },
  "Disturbance of Wildlife Habitat": { icon: "volume_up", desc: "Disruption to fauna feeding or nesting grounds." },

  "Water Pollution": { icon: "water_ph", desc: "Contamination of freshwater or coastal water bodies." },
  "River Contamination": { icon: "waves", desc: "Pollutants, runoff, or toxins introduced into river systems." },
  "Illegal Waste Disposal in Waterways": { icon: "delete", desc: "Dumping garbage or debris into streams or rivers." },
  "Fish Kill Incident": { icon: "set_meal", desc: "Sudden mass mortality of fish populations." },
  "Oil Spill": { icon: "oil_barrel", desc: "Accidental or deliberate release of petroleum liquid." },
  "Illegal Quarrying Near Rivers": { icon: "landscape", desc: "Extraction of sand or gravel near riverbeds." },
  "Sewage Discharge": { icon: "cleaning_services", desc: "Untreated wastewater released into public waters." },
  "Water Obstruction": { icon: "block", desc: "Illegal damming or blockage of natural waterways." },
  "Chemical Contamination": { icon: "science", desc: "Toxic chemical run-off into aquatic ecosystems." },

  "Illegal Dumping": { icon: "delete_forever", desc: "Unlawful disposal of garbage on open land." },
  "Open Burning of Waste": { icon: "mode_heat", desc: "Outdoor burning of solid or synthetic refuse." },
  "Improper Waste Disposal": { icon: "delete_sweep", desc: "Failure to follow prescribed waste collection rules." },
  "Plastic Ban Violation": { icon: "shopping_basket", desc: "Use or distribution of prohibited single-use plastics." },
  "Hazardous Waste Disposal": { icon: "warning", desc: "Unsafe disposal of toxic or medical biohazard waste." },
  "Overflowing Garbage Area": { icon: "restore_from_trash", desc: "Uncollected trash bins causing health or odor hazards." },
  "Unsegregated Waste": { icon: "difference", desc: "Mixing recyclable, biodegradable, and residual waste." },
  "Unauthorized Waste Collection": { icon: "local_shipping", desc: "Unlicensed garbage collectors dumping illegally." },

  "Environmental Permit Violation": { icon: "assignment_late", desc: "Operating without required ECC or discharge permits." },
  "Air Pollution Complaint": { icon: "air", desc: "Excessive particulate or noxious gas releases into air." },
  "Noise Pollution": { icon: "volume_off", desc: "Excessive industrial or commercial acoustic noise." },
  "Unauthorized Construction": { icon: "domain_disabled", desc: "Building structures in ecologically sensitive areas." },
  "Industrial Pollution": { icon: "factory", desc: "Factory emissions or waste harming nearby environment." },
  "Chemical Spill": { icon: "science", desc: "Hazardous chemical leakage on land or in facilities." },
  "Smoke Emission Violation": { icon: "cloud", desc: "Black smoke or toxic exhaust from machinery or vehicles." },
  "Business Non-Compliance": { icon: "store", desc: "Commercial establishment violating green ordinances." },
  "Illegal Industrial Discharge": { icon: "pipe", desc: "Direct piping of industrial effluent into environment." },

  "Soil Erosion": { icon: "terrain", desc: "Loss of topsoil due to vegetation removal or runoff." },
  "Illegal Quarrying": { icon: "landscape", desc: "Unpermitted excavation of earth, stone, or sand." },
  "Land Conversion Violation": { icon: "alt_route", desc: "Converting forest/agricultural land without permit." },
  "Destruction of Natural Landscape": { icon: "visibility_off", desc: "Defacing or altering natural landmarks and terrain." },
  "Cave Disturbance": { icon: "explore", desc: "Damage or unauthorized exploitation of cave ecosystems." },
  "Wetland Destruction": { icon: "water", desc: "Draining or filling protected marshlands and swamps." }
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
