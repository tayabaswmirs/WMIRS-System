// Central Gateway Registry for Firebase Cloud Functions
// All triggers are imported and re-exported from here as modular components.

export { testSecureEndpoint } from "./src/triggers/https/testSecureEndpoint.js";
export { adminUpdateUser } from "./src/triggers/https/adminUpdateUser.js";
export { adminSetRole } from "./src/triggers/https/adminSetRole.js";
export { adminDeleteUser } from "./src/triggers/https/adminDeleteUser.js";
export { selfDeleteAccount } from "./src/triggers/https/selfDeleteAccount.js";
export { onUserUpdate } from "./src/triggers/db/onUserUpdate.js";

