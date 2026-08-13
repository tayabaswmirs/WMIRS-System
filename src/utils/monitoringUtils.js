import { getStatusClass, getStatusLabel } from "./incidentConstants";

export { getStatusClass, getStatusLabel };


export const formatLogDate = (timestamp) => {
  if (!timestamp) return "N/A";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return "N/A";
  }
};
