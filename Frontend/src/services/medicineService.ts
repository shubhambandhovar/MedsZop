import api from './api';
import { Medicine } from '../app/types';

interface MedicinesResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: Medicine[];
}

interface CategoriesResponse {
  success: boolean;
  data: string[];
}

interface MedicineResponse {
  success: boolean;
  data: Medicine;
}

export const medicineService = {
  getMedicines: async (filters?: {
    search?: string;
    category?: string;
    requiresPrescription?: boolean;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }): Promise<MedicinesResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.requiresPrescription !== undefined) {
      params.append('requiresPrescription', String(filters.requiresPrescription));
    }
    if (filters?.inStock !== undefined) {
      params.append('inStock', String(filters.inStock));
    }
    if (filters?.minPrice) params.append('minPrice', String(filters.minPrice));
    if (filters?.maxPrice) params.append('maxPrice', String(filters.maxPrice));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await api.get('/medicines', { params });
    // Map MongoDB _id to id
    const data = response.data;
    if (data.data && Array.isArray(data.data)) {
      data.data = data.data.map((medicine: any) => ({
        ...medicine,
        id: medicine._id || medicine.id
      }));
    }
    return data;
  },

  getMedicineById: async (id: string): Promise<MedicineResponse> => {
    const response = await api.get(`/medicines/${id}`);
    const data = response.data;
    if (data.data) {
      data.data = {
        ...data.data,
        id: data.data._id || data.data.id
      };
    }
    return data;
  },

  getCategories: async (): Promise<CategoriesResponse> => {
    const response = await api.get('/medicines/categories');
    return response.data;
  },

  createMedicine: async (data: Medicine) => {
    const response = await api.post('/medicines', data);
    return response.data;
  },

  updateMedicine: async (id: string, data: Partial<Medicine>) => {
    const response = await api.put(`/medicines/${id}`, data);
    return response.data;
  },

  deleteMedicine: async (id: string) => {
    const response = await api.delete(`/medicines/${id}`);
    return response.data;
  },
};
