import { createContext, useState, useEffect } from "react";
import {
  clearAuthSession,
  getStoredUser,
  setAuthSession,
} from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUserFromStorage = () => {
      setUser(getStoredUser());
    };

    syncUserFromStorage();
    setLoading(false);

    window.addEventListener("auth-session-changed", syncUserFromStorage);
    window.addEventListener("storage", syncUserFromStorage);

    return () => {
      window.removeEventListener("auth-session-changed", syncUserFromStorage);
      window.removeEventListener("storage", syncUserFromStorage);
    };
  }, []);

  const login = (token, userData = null) => {
    const decoded = setAuthSession(token, userData);
    setUser({
      ...decoded,
      ...(userData || {}),
      id: userData?.id || decoded.id || decoded.userId,
      email: userData?.email || decoded.email,
    });
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
