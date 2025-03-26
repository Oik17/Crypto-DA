// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const signup = async (userData) => {
    try {
      setError(null);
      const response = await authService.signup(userData);
      return response;
    } catch (error) {
      setError(error.message || 'Signup failed');
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      await authService.login(credentials);
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      return user;
    } catch (error) {
      setError(error.message || 'Login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
    } catch (error) {
      setError(error.message || 'Logout failed');
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    signup,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
