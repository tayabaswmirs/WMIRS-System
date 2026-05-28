import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";

/**
 * Creates a user profile document in Firestore.
 * Defaults the user's role to 'user' for safety.
 * 
 * @param {string} uid - Unique User ID from Firebase Auth
 * @param {string} name - The user's full name
 * @param {string} email - The user's registered email address
 * @returns {Promise<void>}
 */
export const createUserProfile = async (uid, name, email) => {
  const userRef = doc(db, "users", uid);
  return setDoc(userRef, {
    uid,
    name,
    email,
    role: "user", // Default role is standard user
    createdAt: serverTimestamp()
  });
};

/**
 * Fetches user profile data (including role) from Firestore.
 * 
 * @param {string} uid - Unique User ID to fetch
 * @returns {Promise<object|null>}
 */
export const getUserProfile = async (uid) => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  
  if (snap.exists()) {
    return snap.data();
  }
  
  return null;
};

/**
 * Fetches all registered user profiles from Firestore.
 * Restricted to administrators by security rules.
 * 
 * @returns {Promise<Array<object>>}
 */
export const getAllUsers = async () => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => docSnap.data());
};

/**
 * Updates a user's Auth credentials and Firestore profile via admin Cloud Function.
 * 
 * @param {string} uid - Target user's unique ID
 * @param {object} updateData - Object containing email, name, or password to update
 * @returns {Promise<object>}
 */
export const updateUserAdmin = async (uid, updateData) => {
  const updateFn = httpsCallable(functions, "adminUpdateUser");
  const res = await updateFn({ uid, ...updateData });
  return res.data;
};

/**
 * Promotes or demotes a user's role and admin claims via admin Cloud Function.
 * 
 * @param {string} uid - Target user's unique ID
 * @param {string} role - Target role: 'admin' or 'user'
 * @returns {Promise<object>}
 */
export const setUserRoleAdmin = async (uid, role) => {
  const setRoleFn = httpsCallable(functions, "adminSetRole");
  const res = await setRoleFn({ uid, role });
  return res.data;
};

/**
 * Permanently deletes a user's authentication and Firestore profile document.
 * 
 * @param {string} uid - Target user's unique ID
 * @returns {Promise<object>}
 */
export const deleteUserAdmin = async (uid) => {
  const deleteFn = httpsCallable(functions, "adminDeleteUser");
  const res = await deleteFn({ uid });
  return res.data;
};

