import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // DEVELOPMENT MODE: Always allow access
  const bypassAuth = true; // Set this to false when you want normal authentication

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated && !bypassAuth) {
    return <Navigate to="/auth/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
