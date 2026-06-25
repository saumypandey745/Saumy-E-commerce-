import axios from 'axios';

// We'll fallback to localhost:8000 if NEXT_PUBLIC_API_URL is undefined
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Read from localStorage
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('ecomm_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
          }
        } catch (e) {}
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized globally
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
         localStorage.removeItem('ecomm_user');
         // Redirect to login handled by frontend/components
      }
    }
    return Promise.reject(error);
  }
);
