import axios from 'axios';
import { performCleanLogout, getStoredToken } from '../utils/auth';

const api = axios.create({
  baseURL: '/api',
});

// Add a request interceptor to append the JWT token
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication & token expiry errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const originalRequestUrl = error.config?.url;
      const isAuthEndpoint = originalRequestUrl === '/auth/login' || originalRequestUrl === '/auth/logout';

      // Catch 401 Unauthorized or 403 Forbidden with expired token code
      const isTokenExpired = 
        status === 401 || 
        (status === 403 && error.response.data?.code === 'TOKEN_EXPIRED');

      if (isTokenExpired && !isAuthEndpoint) {
        performCleanLogout({
          sessionExpired: true,
          message: error.response.data?.message || 'Your session has expired. Please log in again.',
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
