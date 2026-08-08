import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
    permissions?: { module: string; action: string }[];
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  hasPermission: (module: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  hasPermission: () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const { data } = await api.get("/auth/me");
          setUser(data.data);
        } catch (error) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, []);

  const login = (token: string, refreshToken: string, userData: User) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", refreshToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {}
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  const hasPermission = (module: string, action: string) => {
    if (!user) return false;
    if (user.role.name === "SuperAdmin") return true;
    if (!user.role.permissions) return false;
    
    // Check if permission exists in array
    return user.role.permissions.some(p => p.module === module && p.action === action);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
