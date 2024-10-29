import axios from 'axios';
import { refreshAccessToken } from './decodeJwtAsync'; // Adjust the import to match your file structure

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URI,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include credentials (cookies)
});

// Request interceptor to add the token
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/refresh-token')
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
          // Update the Authorization header with the new token
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Failed to refresh token, redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;