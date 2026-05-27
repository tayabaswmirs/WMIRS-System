/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from "react";
import { 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser, 
  subscribeToAuthChanges 
} from "../firebase/services/authService";
import { getUserProfile } from "../firebase/services/userService";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setLoading(true); // Keep loading true while fetching firestore profile
      if (user) {
        setCurrentUser(user);
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserRole(profile.role || "user");
            setProfileData(profile);
          } else {
            // Profile document might not exist yet during initial sign-up transaction
            setUserRole("user");
            setProfileData(null);
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
          setUserRole("user");
          setProfileData(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setProfileData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return loginWithEmail(email, password);
  };

  const register = (name, email, password) => {
    return registerWithEmail(name, email, password);
  };

  const logout = () => {
    return logoutUser();
  };

  const value = {
    currentUser,
    userRole,
    profileData,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

