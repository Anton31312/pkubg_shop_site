import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * ProtectedRoute component for handling authentication-based routing
 * Redirects to login if user is not authenticated
 * Supports role-based access control with single role or array of roles
 */
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page, saving the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole) {
    const userRole = user?.role;
    const hasRequiredRole = Array.isArray(requiredRole) 
      ? requiredRole.includes(userRole)
      : userRole === requiredRole;
    
    if (!hasRequiredRole) {
      // User doesn't have required role, redirect to home
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
