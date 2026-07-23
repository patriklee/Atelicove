import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { AUTH_UNAUTHORIZED_EVENT } from '../shared/api/client';
import { clearStoredAuth, storeUser } from '../shared/auth';
import { roleLandingPath } from '../shared/routing/rolePaths';

const AuthContext = createContext(null);

const toFrontendUser = (profile) => ({
  username: profile.workerUser,
  firstName: profile.workerFName,
  lastName: profile.workerLName,
  displayName: profile.workerDisplayName,
  email: profile.workerEmail,
  lastLoginAt: profile.lastLoginAt,
  isAdmin: profile.admin,
  workerID: profile.workerID,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // The server session is authoritative. Local storage only caches display data.
  useEffect(() => {
    let active = true;

    const clearAuth = () => {
      clearStoredAuth();
      if (active) setUser(null);
    };

    const handleUnauthorized = () => {
      clearAuth();
      if (active) navigate('/login', { replace: true });
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);

    apiFetch('/auth/me')
      .then(profile => {
        if (!active) return;
        const authenticatedUser = toFrontendUser(profile);
        setUser(authenticatedUser);
        storeUser(authenticatedUser);
      })
      .catch(error => {
        clearAuth();
        if (error.status !== 401) {
          console.warn('Unable to validate the server session.', error);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [navigate]);

  const login = (userData) => {
    setUser(userData);
    storeUser(userData);
    
    navigate(roleLandingPath(userData));
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    storeUser(updatedUser);
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Server logout failed; clearing the local session.', error);
    }
    setUser(null);
    clearStoredAuth();
    navigate('/login', { replace: true });
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user is an admin
  const isAdmin = () => {
    return user?.isAdmin === true;
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        updateUser,
        logout, 
        loading, 
        isAuthenticated,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
