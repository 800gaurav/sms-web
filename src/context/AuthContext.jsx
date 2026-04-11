import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sms_user")); } catch { return null; }
  });

  const login = (userData, token) => {
    localStorage.setItem("sms_user", JSON.stringify(userData));
    localStorage.setItem("sms_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("sms_user");
    localStorage.removeItem("sms_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const getToken = () => localStorage.getItem("sms_token");
