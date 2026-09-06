/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from "react";
import { 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser, 
  subscribeToAuthChanges 
} from "../firebase/services/authService";
import { getUserProfile, createUserProfile } from "../firebase/services/userService";

export const AuthContext = createContext();

/**
 * Normalizes legacy "user" role strings to the new "ranger" role.
 * Ensures backward compatibility with existing Firestore user documents.
 *
 * @param {string|null} role - Raw role from Firestore profile
 * @returns {string} Normalized role: "ranger", "staff", or "admin"
 */
const normalizeRole = (role) => {
  if (role === "user" || !role) return "ranger";
  return role;
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [staffScope, setStaffScope] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        try {
          let profile = await getUserProfile(user.uid);
          if (!profile) {
            // Self-healing: profile document missing from Firestore (e.g. prior failed registration)
            try {
              const fallbackName = user.displayName || user.email?.split("@")[0] || "Ranger";
              await createUserProfile(user.uid, fallbackName, user.email || "");
              profile = await getUserProfile(user.uid);
            } catch (createErr) {
              console.error("Failed to auto-create missing user profile:", createErr);
            }
          }

          if (profile) {
            // Force refresh the token if custom claims are stale (e.g. role changed by admin)
            try {
              const tokenResult = await user.getIdTokenResult();
              const currentRole = tokenResult.claims.role || "pending";
              const currentScope = tokenResult.claims.scope || null;
              
              if (currentRole !== profile.role || currentScope !== (profile.staffScope || null)) {
                await user.getIdToken(true); // Force refresh token
              }
            } catch (tokenErr) {
              console.warn("Failed to check or refresh token claims:", tokenErr);
            }

            setUserRole(normalizeRole(profile.role));
            setStaffScope(profile.staffScope || null);
            setProfileData(profile);
          } else {
            // Fallback default state if self-healing could not persist profile
            setUserRole("pending");
            setStaffScope(null);
            setProfileData(null);
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
          setUserRole("pending");
          setStaffScope(null);
          setProfileData(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setStaffScope(null);
        setProfileData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return loginWithEmail(email, password);
  };

  const register = (dataOrName, email, password, vettingData) => {
    return registerWithEmail(dataOrName, email, password, vettingData);
  };

  const logout = () => {
    return logoutUser();
  };

  const refreshProfile = async () => {
    if (!currentUser?.uid) return null;
    try {
      const profile = await getUserProfile(currentUser.uid);
      if (profile) {
        setProfileData(profile);
        setUserRole(normalizeRole(profile.role));
        setStaffScope(profile.staffScope || null);
      }
      return profile;
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
      return null;
    }
  };

  const value = {
    currentUser,
    userRole,
    staffScope,
    profileData,
    loading,
    login,
    register,
    logout,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

