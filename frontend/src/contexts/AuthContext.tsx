import React, { createContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { toast } from "react-toastify";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
    // Check if user is already logged in via session
    const checkAuthStatus = async () => {
      try {
        // We'll make a request to any authenticated endpoint to check if we're logged in
        // If the session is valid, our credentials will be sent with the request
        const response = await axios.get("/lobby", {
          headers: { Accept: "application/json" },
        });
        if (response.data && response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        // User is not authenticated, that's okay
        console.log("Not authenticated yet");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        "/auth/login",
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Since we use session-based auth, we need to check if login was successful
      // and then get the user data
      if (response.status === 200) {
        const userResponse = await axios.get("/lobby", {
          headers: { Accept: "application/json" },
        });
        if (userResponse.data && userResponse.data.user) {
          setUser(userResponse.data.user);
          toast.success("Successfully logged in!");
        }
      }
    } catch (error) {
      console.error("Login error", error);
      toast.error("Login failed. Please check your credentials.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        "/auth/register",
        {
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Since we use session-based auth, check if registration was successful
      if (response.status === 200) {
        const userResponse = await axios.get("/lobby", {
          headers: { Accept: "application/json" },
        });
        if (userResponse.data && userResponse.data.user) {
          setUser(userResponse.data.user);
          toast.success("Registration successful!");
        }
      }
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
      await axios.get("/auth/logout");
      setUser(null);
      toast.success("Successfully logged out!");
    } catch (error) {
      console.error("Logout error", error);
      toast.error("Logout failed.");
      throw error;
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
