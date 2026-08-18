export const CATEGORIES = [
  {
    id: "BMS",
    icon: "forest",
    label: "Biodiversity Monitoring",
    desc: "Avian surveys and general protected fauna tracking."
  },
  {
    id: "Water",
    icon: "water",
    label: "Water Resource",
    desc: "Routine aquatic condition logs and water pollution risk markers."
  },
  {
    id: "Compliance",
    icon: "verified_user",
    label: "Compliance Audits",
    desc: "Waste collection tracking and plastic bag ban audits."
  }
];

export const SUBCATEGORY_META = {
  "Avian Tracking Form": {
    icon: "flutter",
    desc: "Systematic bird census data along transect lines."
  },
  "Wildlife Observations Form": {
    icon: "cruelty_free",
    desc: "Non-avian fauna sightings and habitat condition notes."
  },
  "Local Water Source Monitoring Form": {
    icon: "water_drop",
    desc: "Aquatic condition logs for local water bodies."
  },
  "Ecosystem Conservation Log": {
    icon: "eco",
    desc: "Pollution risk indicators and aquatic wildlife activity."
  },
  "Waste Collection Tracking Form": {
    icon: "delete_sweep",
    desc: "Waste volume and collection route tracking by barangay."
  },
  "Plastic Bag Ban Inspection Form": {
    icon: "block",
    desc: "Establishment compliance checks for the plastic bag ban."
  }
};

export const SUBCATEGORIES = {
  BMS: ["Avian Tracking Form", "Wildlife Observations Form"],
  Water: ["Local Water Source Monitoring Form", "Ecosystem Conservation Log"],
  Compliance: ["Waste Collection Tracking Form", "Plastic Bag Ban Inspection Form"]
};
