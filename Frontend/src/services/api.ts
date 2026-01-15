/// <reference types="vite/client" />
import axios, { AxiosInstance } from 'axios';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

// Debug: Log the API URL being used
console.log(' API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_URL: API_URL,
  mode: import.meta.env.MODE
});

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(' API Request:', config.method?.toUpperCase(), config.url, 'Base:', config.baseURL);
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(' API Error:', error.config?.url, error.message);
    if (error.response?.status === 401) {
      // Unauthorized - preserve pharmacy medicines before clearing localStorage
      const pharmacyMedicines = localStorage.getItem('pharmacyMedicines');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Restore pharmacy medicines if they existed
      if (pharmacyMedicines) {
        localStorage.setItem('pharmacyMedicines', pharmacyMedicines);
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
