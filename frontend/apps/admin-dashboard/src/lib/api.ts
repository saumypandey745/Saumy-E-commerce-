import axios from 'axios';

// Fallback to empty string for relative paths (Storefront) or environment variable if set.
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // IMPORTANT: Sends cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Guest ID logic for carts
    if (typeof window !== 'undefined') {
      let guestId = localStorage.getItem('ecomm_guest_id');
      if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('ecomm_guest_id', guestId);
      }
      config.headers['x-guest-id'] = guestId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 503 Service Unavailable (API Gateway Circuit Breaker)
    if (error.response && error.response.status === 503) {
      console.warn('[Circuit Breaker] Service Unavailable:', originalRequest.url);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api-error', { detail: 'Service temporarily unavailable. Please try again later.' }));
      }
    }

    // Handle 401 Unauthorized -> Attempt refresh
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Don't loop on refresh endpoint
      if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
        if (typeof window !== 'undefined') {
           localStorage.removeItem('ecomm_user');
           localStorage.removeItem('sellerAccessToken'); // For legacy seller app
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Attempt to refresh token using the HttpOnly refreshToken cookie
        const res = await api.post('/api/v1/auth/refresh', {}, {
          withCredentials: true // Ensure cookies are sent
        });

        if (res.status === 200) {
          // Success! The backend will have set a new accessToken HttpOnly cookie
          // Retry original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed (token expired or invalid)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ecomm_user');
          localStorage.removeItem('sellerAccessToken');
          if (!window.location.pathname.includes('/auth/login') && !window.location.pathname.includes('/login')) {
            window.location.href = '/auth/login'; // Adjust route based on app
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
