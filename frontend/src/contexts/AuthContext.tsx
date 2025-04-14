import React, { createContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { toast } from "react-toastify";

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get("/api/auth/me");
        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        // User is not authenticated
        console.error("Not authenticated", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post("/api/auth/login", { email, password });
      setUser(response.data.user);
      toast.success("Successfully logged in!");
    } catch (error) {
      console.error("Login error", error);
      toast.error("Login failed. Please check your credentials.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      setIsLoading(true);
      const response = await axios.post("/api/auth/register", {
        username,
        email,
        password,
      });
      setUser(response.data.user);
      toast.success("Registration successful!");
    } catch (error) {
      console.error("Registration error", error);
      toast.error("Registration failed. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
      setUser(null);
      toast.success("Successfully logged out!");
    } catch (error) {
      console.error("Logout error", error);
      toast.error("Logout failed.");
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
