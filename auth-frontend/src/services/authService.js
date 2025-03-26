// src/services/authService.js
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = 'http://localhost:8080'; // Adjust to your backend URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add interceptor to refresh token if needed
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = Cookies.get('refreshToken');
        const response = await axios.post(`${API_URL}/user/refresh`, { refreshToken });
        const { accessToken } = response.data;
        
        sessionStorage.setItem('accessToken', accessToken);
        
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout user
        logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const signup = async (userData) => {
  try {
    const response = await api.post('/user/signup', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network error' };
  }
};

export const login = async (credentials) => {
  try {
    const response = await api.post('/user/login', credentials);
    const { accessToken, refreshToken } = response.data;
    
    // Store access token in session storage (memory)
    sessionStorage.setItem('accessToken', accessToken);
    
    // Store refresh token in HttpOnly cookie
    Cookies.set('refreshToken', refreshToken, { 
      secure: true, // For HTTPS
      sameSite: 'strict' 
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network error' };
  }
};

export const logout = async () => {
  try {
    await api.post('/user/logout');
    
    // Clear tokens
    sessionStorage.removeItem('accessToken');
    Cookies.remove('refreshToken');
    
    return { success: true };
  } catch (error) {
    // Still remove tokens on client side even if server request fails
    sessionStorage.removeItem('accessToken');
    Cookies.remove('refreshToken');
    
    throw error.response?.data || { error: 'Network error' };
  }
};

export const getCurrentUser = () => {
  const token = sessionStorage.getItem('accessToken');
  if (!token) return null;
  
  // Parse JWT payload (second part of token)
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    return payload;
  } catch (error) {
    return null;
  }
};

export default {
  signup,
  login,
  logout,
  getCurrentUser
};
