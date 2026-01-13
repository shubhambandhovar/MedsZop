import api from './api';
import { User } from '../app/types';
import { mockAdminUser } from '../app/data/mockData';

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const authService = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role?: 'user' | 'pharmacy' | 'admin';
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    // Check for admin demo login
    if (email === 'admin@medszop.com' && password === 'admin123') {
      const mockResponse: AuthResponse = {
        success: true,
        message: 'Admin login successful',
        data: {
          user: mockAdminUser,
          token: 'mock-admin-token'
        }
      };
      localStorage.setItem('token', mockResponse.data.token);
      localStorage.setItem('user', JSON.stringify(mockResponse.data.user));
      return mockResponse;
    }
    
    const response = await api.post('/auth/login', { email, password });
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: {
    name?: string;
    phone?: string;
    addresses?: any[];
  }) => {
    const response = await api.put('/auth/profile', data);
    if (response.data.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  isLoggedIn: (): boolean => {
    return !!localStorage.getItem('token');
  },

  saveCurrentUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
};
