const STATUS_CLASSES = {
  "Submitted":    "status-submitted",
  "Under Review": "status-under-review",
  "Approved":     "status-approved",
  "Rejected/Flagged": "status-dismissed"
};

export const getStatusClass = (status) => STATUS_CLASSES[status] ?? "status-submitted";

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
