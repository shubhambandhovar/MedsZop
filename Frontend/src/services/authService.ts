import api from './api';
import { User } from '../app/types';
import { mockAdminUser, mockUser, mockPharmacyUser } from '../app/data/mockData';

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

  login: async (email: string, password: string, role?: 'user' | 'pharmacy' | 'admin'): Promise<AuthResponse> => {
    // Demo accounts for testing - credentials loaded from environment variables
    const DEMO_ADMIN_EMAIL = import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@medszop.com';
    const DEMO_ADMIN_PASS = import.meta.env.VITE_DEMO_ADMIN_PASS || 'demo-admin';
    const DEMO_CUSTOMER_EMAIL = import.meta.env.VITE_DEMO_CUSTOMER_EMAIL || 'customer@medszop.com';
    const DEMO_CUSTOMER_PASS = import.meta.env.VITE_DEMO_CUSTOMER_PASS || 'demo-customer';
    const DEMO_PHARMACY_EMAIL = import.meta.env.VITE_DEMO_PHARMACY_EMAIL || 'pharmacy@medszop.com';
    const DEMO_PHARMACY_PASS = import.meta.env.VITE_DEMO_PHARMACY_PASS || 'demo-pharmacy';
    
    if (email === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASS) {
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

    if (email === DEMO_CUSTOMER_EMAIL && password === DEMO_CUSTOMER_PASS) {
      const mockResponse: AuthResponse = {
        success: true,
        message: 'Customer login successful',
        data: {
          user: mockUser,
          token: 'mock-user-token'
        }
      };
      localStorage.setItem('token', mockResponse.data.token);
      localStorage.setItem('user', JSON.stringify(mockResponse.data.user));
      return mockResponse;
    }

    if (email === DEMO_PHARMACY_EMAIL && password === DEMO_PHARMACY_PASS) {
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
    
    const response = await api.post('/auth/login', { email, password, role });
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  logout: () => {
    // Preserve pharmacy medicines before clearing localStorage
    const pharmacyMedicines = localStorage.getItem('pharmacyMedicines');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Restore pharmacy medicines if they existed
    if (pharmacyMedicines) {
      localStorage.setItem('pharmacyMedicines', pharmacyMedicines);
    }
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
