import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

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
