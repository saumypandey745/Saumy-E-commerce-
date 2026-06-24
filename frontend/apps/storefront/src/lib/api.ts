import axios from 'axios';
// Removed circular useAppStore import

// We rely on Next.js rewrites to proxy /api requests to the API Gateway
export const api = axios.create({
  baseURL: '', // Empty means it uses the current origin which triggers Next.js rewrite
  withCredentials: true,
  timeout: 10000,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Read from localStorage to avoid circular dependency
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

      // Guest ID
      let guestId = localStorage.getItem('ecomm_guest_id');
      if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('ecomm_guest_id', guestId);
      }
      if (!config.headers.Authorization) {
        config.headers['x-guest-id'] = guestId;
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
    // Handle 503 Service Unavailable (API Gateway Circuit Breaker)
    if (error.response && error.response.status === 503) {
      console.warn('[Circuit Breaker] Service Unavailable:', error.config.url);
      // Try to gracefully downgrade or show generic error UI
      if (typeof window !== 'undefined') {
        // Dispatch a custom event for the UI to show a toast or banner
        window.dispatchEvent(new CustomEvent('api-error', { detail: 'Service temporarily unavailable. Please try again later.' }));
      }
    }

    // Handle 401 Unauthorized globally
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
         localStorage.removeItem('ecomm_user');
         if (!window.location.pathname.includes('/auth/login')) {
            window.location.href = '/auth/login';
         }
      }
    }
    
    return Promise.reject(error);
  }
);
