import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy, where, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { db, storage, functions } from "../firebase";
import { sendNotification, sendRoleNotification } from "./notificationService";

/**
 * Uploads a user's ID card photo/scan to Firebase Storage under their protected folder.
 * 
 * @param {string} uid - User ID
 * @param {File} file - ID card image file
 * @param {function} [onProgress] - Optional progress callback
 * @returns {Promise<{ url: string, path: string }>}
 */
export const uploadUserIdCard = (uid, file, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file provided for ID card upload."));
    }
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimes.includes(file.type)) {
      return reject(new Error("Invalid file format. Only JPG, PNG, and WebP images are allowed."));
    }
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return reject(new Error("ID card image size exceeds 5MB limit."));
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `users/${uid}/id_card/${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error("ID card upload error:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url: downloadURL, path: storagePath });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

/**
 * Deletes an ID card file from Firebase Storage.
 * 
 * @param {string} storagePath - Object path in Firebase Storage
 * @returns {Promise<void>}
 */
export const deleteUserIdCard = async (storagePath) => {
  if (!storagePath) return;
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn(`Failed to delete ID card at ${storagePath}:`, err);
  }
};

/**
 * Uploads a user's profile avatar to Firebase Storage.
 *
 * @param {string} uid - Target User ID
 * @param {File} file - Profile picture file
 * @param {function} [onProgress] - Upload progress callback (0-100)
 * @returns {Promise<{ url: string, path: string }>}
 */
export const uploadUserProfilePicture = (uid, file, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file provided for profile picture upload."));
    }
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimes.includes(file.type)) {
      return reject(new Error("Invalid image format. Only JPG, PNG, and WebP images are allowed."));
    }
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
    if (file.size > MAX_SIZE) {
      return reject(new Error("Profile image exceeds the 5MB size limit."));
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `users/${uid}/avatar/${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error("Profile picture upload error:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url: downloadURL, path: storagePath });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

/**
 * Deletes an avatar file from Firebase Storage.
 *
 * @param {string} storagePath - Object path in Firebase Storage
 * @returns {Promise<void>}
 */
export const deleteUserProfilePicture = async (storagePath) => {
  if (!storagePath) return;
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn(`Failed to delete profile avatar at ${storagePath}:`, err);
  }
};

/**
 * Creates a user profile document in Firestore.
 * Supports legacy signature (uid, name, email) and full vetting object.
 * 
 * @param {string} uid - Unique User ID from Firebase Auth
 * @param {object|string} dataOrName - Profile object or legacy full name string
 * @param {string} [emailParam] - Legacy email string if dataOrName was string
 * @returns {Promise<void>}
 */
export const createUserProfile = async (uid, dataOrName, emailParam) => {
  if (!uid) throw new Error("Cannot create user profile: missing UID");
  const userRef = doc(db, "users", uid);

  const profileData = (typeof dataOrName === "object" && dataOrName !== null)
    ? dataOrName
    : { name: dataOrName || "", email: emailParam || "" };

  const firstName = (profileData.firstName || "").trim();
  const lastName = (profileData.lastName || "").trim();
  const name = (profileData.name || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || "")).trim();
  const email = (profileData.email || "").trim();

  await setDoc(userRef, {
    uid,
    firstName,
    lastName,
    name,
    email,
    phone: (profileData.phone || "").trim(),
    address: (profileData.address || "").trim(),
    idNumber: (profileData.idNumber || "").trim(),
    idCardUrl: profileData.idCardUrl || "",
    idCardPath: profileData.idCardPath || "",
    photoURL: profileData.photoURL || "",
    profilePicturePath: profileData.profilePicturePath || "",
    role: "pending",
    staffScope: null,
    createdAt: serverTimestamp()
  });

  // Notify administrators of pending registration
  sendRoleNotification(
    { role: "admin" },
    {
      title: "New Account Pending Approval",
      message: `${name || "A new applicant"} (${email || "No email provided"}) registered and is awaiting role vetting.`,
      type: "account_vetted_pending",
      category: "system",
      referenceId: uid,
      referenceType: "user",
      link: "/admin/vetting"
    }
  ).catch((err) => console.warn("Failed to notify admins of user registration:", err));
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
 * Fetches all pending user registrations from Firestore.
 * Restricted to administrators by security rules.
 * 
 * @returns {Promise<Array<object>>}
 */
export const getPendingUsers = async () => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("role", "==", "pending"));
  const snap = await getDocs(q);
  // Sort in memory to avoid requiring a composite index
  return snap.docs
    .map((docSnap) => docSnap.data())
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });
};

/**
 * Updates a user's Auth credentials and Firestore profile via admin Cloud Function.
 * 
 * @param {string} uid - Target user's unique ID
 * @param {object} updateData - Object containing email, name, or password to update
 * @returns {Promise<object>}
 */
export const updateUserAdmin = async (uid, updateData) => {
  try {
    const updateFn = httpsCallable(functions, "adminUpdateUser");
    const res = await updateFn({ uid, ...updateData });
    return res.data;
  } catch (err) {
    console.warn("Cloud Function 'adminUpdateUser' call failed (backend deployment pending). Falling back to direct Firestore document update:", err);
    const userRef = doc(db, "users", uid);
    const profileFields = {};
    if (updateData.name !== undefined) profileFields.name = updateData.name;
    if (updateData.email !== undefined) profileFields.email = updateData.email;
    if (Object.keys(profileFields).length > 0) {
      await updateDoc(userRef, profileFields);
    }
    return { status: "success", fallback: true };
  }
};

/**
 * Promotes or demotes a user's role and admin claims via admin Cloud Function.
 * 
 * @param {string} uid - Target user's unique ID
 * @param {string} role - Target role: 'admin', 'staff', or 'ranger'
 * @param {string|null} [staffScope=null] - Domain scope required when role is 'staff' ('incidents', 'BMS', 'Water', 'Compliance')
 * @returns {Promise<object>}
 */
export const setUserRoleAdmin = async (uid, role, staffScope = null) => {
  const resolvedScope = role === "staff" ? staffScope : null;
  let result;

  try {
    const setRoleFn = httpsCallable(functions, "adminSetRole");
    const res = await setRoleFn({ uid, role, staffScope: resolvedScope });
    result = res.data;
  } catch (err) {
    console.warn("Cloud Function 'adminSetRole' call failed (backend deployment pending). Falling back to direct Firestore document update:", err);
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      role,
      staffScope: resolvedScope,
    });
    result = { status: "success", fallback: true };
  }

  // Notify the user of their role assignment/update
  sendNotification(uid, {
    title: "Account Role Updated",
    message: `Your account role has been set to ${role.toUpperCase()}${resolvedScope ? ` (${resolvedScope})` : ""}.`,
    type: "role_updated",
    category: "system",
    link: "/profile"
  }).catch((notifErr) => console.warn("Failed to dispatch role update notification:", notifErr));

  return result;
};

/**
 * Permanently deletes a user's authentication and Firestore profile document.
 * 
 * @param {string} uid - Target user's unique ID
 * @returns {Promise<object>}
 */
export const deleteUserAdmin = async (uid) => {
  // Clean up uploaded ID card from Firebase Storage if present
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.idCardPath) {
        await deleteUserIdCard(userData.idCardPath);
      }
    }
  } catch (storageErr) {
    console.warn(`Failed to cleanup ID card for user ${uid} from storage:`, storageErr);
  }

  try {
    const deleteFn = httpsCallable(functions, "adminDeleteUser");
    const res = await deleteFn({ uid });
    return res.data;
  } catch (err) {
    console.warn("Cloud Function 'adminDeleteUser' call failed (backend deployment pending). Falling back to direct Firestore document deletion:", err);
    const userRef = doc(db, "users", uid);
    await deleteDoc(userRef);
    return { status: "success", fallback: true };
  }
};

/**
 * Updates a user's own Firestore profile (restricted to their own data by security rules).
 * 
 * @param {string} uid - Unique target User ID
 * @param {object} profileUpdates - Fields to update (e.g. name, address)
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (uid, profileUpdates) => {
  const userRef = doc(db, "users", uid);
  return updateDoc(userRef, profileUpdates);
};

/**
 * Deletes a user's own account and Firestore profile document via Cloud Function.
 * 
 * @returns {Promise<object>}
 */
export const deleteSelfAccount = async () => {
  const deleteFn = httpsCallable(functions, "selfDeleteAccount");
  const res = await deleteFn();
  return res.data;
};

/**
 * Fetches a user profile and sanitizes private vetting documents/credentials
 * if the requester is not an Administrator or the profile owner.
 *
 * @param {string} uid - Target User ID
 * @param {boolean} [isViewerAdmin=false] - Whether the viewer has admin privileges
 * @returns {Promise<object|null>}
 */
export const getUserPublicProfile = async (uid, isViewerAdmin = false) => {
  if (!uid) return null;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;

  const data = snap.data();
  if (isViewerAdmin) {
    return data;
  }

  // Zero-Trust field sanitization for non-admin viewers: omit private ID scans and numbers
  const sanitizedProfile = { ...data };
  delete sanitizedProfile.idNumber;
  delete sanitizedProfile.idCardUrl;
  delete sanitizedProfile.idCardPath;
  return sanitizedProfile;
};


