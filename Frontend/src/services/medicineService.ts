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

const mapMedicineId = (medicine: any): Medicine => ({
  ...medicine,
  id: medicine._id || medicine.id
});

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
    const data = response.data;
    if (data.data && Array.isArray(data.data)) {
      data.data = data.data.map(mapMedicineId);
    }
    return data;
  },

  getMedicineById: async (id: string): Promise<MedicineResponse> => {
    const response = await api.get(`/medicines/${id}`);
    const data = response.data;
    if (data.data) {
      data.data = mapMedicineId(data.data);
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

  // Pharmacy-specific methods
  getPharmacyMedicines: async (pharmacyId: string, filters?: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<MedicinesResponse> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.page) params.append('page', String(filters.page || 1));
    if (filters?.limit) params.append('limit', String(filters.limit || 50));

    const response = await api.get(`/medicines/pharmacy/${pharmacyId}`, { params });
    const data = response.data;
    if (data.data && Array.isArray(data.data)) {
      data.data = data.data.map(mapMedicineId);
    }
    return data;
  },

  createPharmacyMedicine: async (pharmacyId: string, medicineData: Medicine) => {
    const response = await api.post('/medicines/pharmacy/add', {
      pharmacyId,
      ...medicineData
    });
    if (response.data.data) {
      response.data.data = mapMedicineId(response.data.data);
    }
    return response.data;
  },

  updatePharmacyMedicine: async (medicineId: string, pharmacyId: string, data: Partial<Medicine>) => {
    const response = await api.put(`/medicines/pharmacy/${medicineId}`, {
      pharmacyId,
      ...data
    });
    if (response.data.data) {
      response.data.data = mapMedicineId(response.data.data);
    }
    return response.data;
  },

  deletePharmacyMedicine: async (medicineId: string, pharmacyId: string) => {
    const response = await api.delete(`/medicines/pharmacy/${medicineId}`, {
      data: { pharmacyId }
    });
    return response.data;
  }
};
