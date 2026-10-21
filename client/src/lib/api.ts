import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token automatically if present
api.interceptors.request.use((config) => {
  const token = Cookies.get('grav_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // If unauthorized on protected routes, redirect to login
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        Cookies.remove('grav_token');
        Cookies.remove('grav_user');
      }
    }
    return Promise.reject(error);
  }
);
