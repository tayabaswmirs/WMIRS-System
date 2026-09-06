import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  updatePassword,
  updateEmail,
  deleteUser
} from "firebase/auth";
import { auth } from "../firebase";
import { createUserProfile, uploadUserIdCard, deleteUserIdCard } from "./userService";

/**
 * Registers a new user, uploads their ID card, and creates their pending profile in Firestore.
 * Supports both object payload and legacy positional arguments with atomic rollback on failure.
 * 
 * @param {object|string} dataOrName - Registration object or legacy full name string
 * @param {string} [emailParam] - Email if dataOrName was string
 * @param {string} [passwordParam] - Password if dataOrName was string
 * @param {object} [vettingParam] - Vetting data if dataOrName was string
 * @returns {Promise<import("firebase/auth").User>}
 */
export const registerWithEmail = async (dataOrName, emailParam, passwordParam, vettingParam = {}) => {
  const registrationData = (typeof dataOrName === "object" && dataOrName !== null)
    ? dataOrName
    : {
        name: dataOrName,
        email: emailParam,
        password: passwordParam,
        ...vettingParam
      };

  const {
    firstName = "",
    lastName = "",
    email = "",
    password = "",
    phone = "",
    address = "",
    idNumber = "",
    idCardFile = null
  } = registrationData;

  const resolvedName = (registrationData.name || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || "")).trim();

  // 1. Create account inside Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;

  let uploadedCardPath = null;

  try {
    // 2. Add the user's name to the auth profile
    if (resolvedName) {
      await updateProfile(user, { displayName: resolvedName });
    }

    // 3. Upload ID card image if provided
    let idCardUrl = "";
    if (idCardFile) {
      const uploadRes = await uploadUserIdCard(user.uid, idCardFile);
      idCardUrl = uploadRes.url;
      uploadedCardPath = uploadRes.path;
    }

    // 4. Store complete user record and pending role inside Firestore
    await createUserProfile(user.uid, {
      firstName,
      lastName,
      name: resolvedName,
      email: email.trim(),
      phone,
      address,
      idNumber,
      idCardUrl,
      idCardPath: uploadedCardPath || ""
    });

    return user;
  } catch (err) {
    console.error("Registration post-auth step failed. Rolling back created account:", err);
    // Rollback: clean up any uploaded storage file
    if (uploadedCardPath) {
      await deleteUserIdCard(uploadedCardPath).catch((e) => console.warn("Rollback file delete failed:", e));
    }
    // Rollback: delete the created auth user so no orphaned account is left
    try {
      await deleteUser(user);
    } catch (deleteErr) {
      console.warn("Rollback auth delete failed:", deleteErr);
    }
    throw err;
  }
};

/**
 * Logs in a user using email and password.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export const loginWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Logs out the currently authenticated user.
 * @returns {Promise<void>}
 */
export const logoutUser = () => {
  return signOut(auth);
};

/**
 * Subscribes to changes in the user's authentication state.
 * @param {function} callback 
 * @returns {import("firebase/auth").Unsubscribe}
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Updates the currently logged in user's authentication details (displayName and/or password).
 * 
 * @param {import("firebase/auth").User} user - Current user object
 * @param {object} updates - Object containing new displayName or password
 * @returns {Promise<void>}
 */
export const updateUserAuthProfile = async (user, updates) => {
  const promises = [];
  const profileUpdates = {};
  if (updates.name !== undefined) profileUpdates.displayName = updates.name;
  if (updates.photoURL !== undefined) profileUpdates.photoURL = updates.photoURL;

  if (Object.keys(profileUpdates).length > 0) {
    promises.push(updateProfile(user, profileUpdates));
  }
  if (updates.password) {
    promises.push(updatePassword(user, updates.password));
  }
  if (updates.email) {
    promises.push(updateEmail(user, updates.email));
  }
  await Promise.all(promises);
};

