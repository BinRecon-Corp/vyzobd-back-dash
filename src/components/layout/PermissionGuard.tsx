import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

interface PermissionGuardProps {
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  module, 
  action, 
  children, 
  fallback = null 
}) => {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export const RoutePermissionGuard: React.FC<{ 
  module: string; 
  action: string; 
  children: React.ReactNode;
}> = ({ module, action, children }) => {
  const { hasPermission, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!hasPermission(module, action)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
