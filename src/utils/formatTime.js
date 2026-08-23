/**
 * Converts a Firestore timestamp, Date object, or ISO string into a concise relative time string.
 * Pure utility function.
 * 
 * @param {object|Date|string|number} timestamp
 * @returns {string} Relative time (e.g., 'Just now', '5m ago', '2h ago', '3d ago')
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "";

  let dateObj;
  if (typeof timestamp.toDate === "function") {
    dateObj = timestamp.toDate();
  } else if (timestamp.seconds) {
    dateObj = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    dateObj = timestamp;
  } else {
    dateObj = new Date(timestamp);
  }

  if (Number.isNaN(dateObj.getTime())) {
    return "";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 30) {
    return "Just now";
  }
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
