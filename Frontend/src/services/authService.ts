import api from './api';
import { User } from '../app/types';
import { mockAdminUser, mockPharmacyUser, mockUser } from '../app/data/mockData';

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

  login: async (email: string, password: string, role: 'user' | 'pharmacy' | 'admin' = 'user'): Promise<AuthResponse> => {
    // Demo accounts for different roles
    if (role === 'admin' && email === 'admin@medszop.com' && password === 'Medsadmin@2026') {
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

    if (role === 'pharmacy' && email === 'pharmacy@healthplus.com' && password === 'Healthplus@2026') {
      const mockResponse: AuthResponse = {
        success: true,
        message: 'Pharmacy login successful',
        data: {
          user: mockPharmacyUser,
          token: 'mock-pharmacy-token'
        }
      };
      localStorage.setItem('token', mockResponse.data.token);
      localStorage.setItem('user', JSON.stringify(mockResponse.data.user));
      return mockResponse;
    }

    if (role === 'user' && email === 'user@test.com' && password === 'password123') {
      const mockResponse: AuthResponse = {
        success: true,
        message: 'User login successful',
        data: {
          user: mockUser,
          token: 'mock-user-token'
        }
      };
      localStorage.setItem('token', mockResponse.data.token);
      localStorage.setItem('user', JSON.stringify(mockResponse.data.user));
      return mockResponse;
    }
    
    const response = await api.post('/auth/login', { email, password, role });
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

  getUserRole: (): 'user' | 'pharmacy' | 'admin' | null => {
    const user = authService.getCurrentUser();
    return user?.role || null;
  },

  setAdminPassword: async (token: string, password: string) => {
    const response = await api.post('/admin/set-password', { token, password });
    return response.data;
  },
};
