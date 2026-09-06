/**
 * Formats Firebase Auth error codes into clear, user-friendly messages.
 *
 * @param {Error|object} err - Firebase error object
 * @returns {string} User-friendly message
 */
export function formatAuthError(err) {
  const errorCode = err?.code;
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "An account with this email address already exists. Please sign in instead.";
    case "auth/weak-password":
      return "The password chosen is too weak. It must be at least 8 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      return err?.message || "Authentication process failed. Please try again.";
  }
}
