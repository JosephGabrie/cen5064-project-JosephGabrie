"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Only check auth status after hydration to avoid mismatch
    setIsMounted(true);
    
    // For now, check local storage so login persists through refresh
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (loggedIn) {
      setIsAuthenticated(true);
    }
  }, []);

  const login = () => {
    // TODO: Replace with your actual login logic (API call, token validation, etc.)
    localStorage.setItem("isLoggedIn", "true");
    setIsAuthenticated(true);
  };

  const logout = () => {
    // TODO: Replace with your actual logout logic
    localStorage.removeItem("isLoggedIn");
    setIsAuthenticated(false);
  };

  if (!isMounted) return null; // Avoid hydration mismatch on the first render

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
