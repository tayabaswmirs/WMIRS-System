import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  updatePassword,
  updateEmail
} from "firebase/auth";
import { auth } from "../firebase";
import { createUserProfile } from "./userService";

/**
 * Registers a new user, updates their Auth display name, and writes their default 'user' profile to Firestore.
 * 
 * @param {string} name 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<import("firebase/auth").User>}
 */
export const registerWithEmail = async (name, email, password) => {
  // 1. Create account inside Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Add the user's name to the auth profile
  await updateProfile(user, { displayName: name });

  // 3. Store user record and role inside Firestore
  await createUserProfile(user.uid, name, email);

  return user;
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
  if (updates.name) {
    promises.push(updateProfile(user, { displayName: updates.name }));
  }
  if (updates.password) {
    promises.push(updatePassword(user, updates.password));
  }
  if (updates.email) {
    promises.push(updateEmail(user, updates.email));
  }
  await Promise.all(promises);
};

