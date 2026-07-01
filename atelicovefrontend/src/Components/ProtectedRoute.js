import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Route that requires user to be authenticated as an admin
export const AdminRoute = () => {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to unauthorized page if authenticated but not an admin
  if (!auth.isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and is an admin
  return <Outlet />;
};

// Route that requires user to be authenticated (any role)
export const ProtectedRoute = () => {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

// Route that is only accessible for non-authenticated users (like login page)
export const PublicRoute = () => {
  const auth = useAuth();
  
  if (auth.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If user is already logged in, redirect them to their home page
  if (auth.isAuthenticated()) {
    return <Navigate to={auth.isAdmin() ? "/admin" : "/worker"} replace />;
  }
  
  return <Outlet />;
};