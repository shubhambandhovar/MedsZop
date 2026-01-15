import axios from 'axios';
import api from './api';

const API_BASE_URL = 'http://localhost:5000/api';

interface PrescriptionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const prescriptionService = {
  /**
   * Upload prescription image for OCR processing
   */
  uploadPrescription: async (file: File | FormData): Promise<PrescriptionResponse> => {
    try {
      let formData: FormData;
      
      if (file instanceof FormData) {
        formData = file;
      } else {
        formData = new FormData();
        formData.append('prescription', file);
      }

      const response = await axios.post(
        `${API_BASE_URL}/prescription/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to upload prescription'
      };
    }
  },

  /**
   * Get user's prescriptions from cloud
   */
  getMyPrescriptions: async (): Promise<PrescriptionResponse> => {
    try {
      const response = await api.get('/prescription/my-prescriptions');
      return { success: true, data: response.data.data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch prescriptions'
      };
    }
  },

  /**
   * Save prescription metadata to cloud
   */
  savePrescription: async (prescriptionData: {
    imageUrl: string;
    medicines?: string[];
    doctorName?: string;
    validUntil?: string;
  }): Promise<PrescriptionResponse> => {
    try {
      const response = await api.post('/prescription/save', prescriptionData);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to save prescription'
      };
    }
  },

  /**
   * Verify prescription with pharmacist
   */
  verifyPrescription: async (
    detectedMedicines: any[],
    pharmacistNotes?: string
  ) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/prescription/verify`,
        {
          detectedMedicines,
          pharmacistNotes,
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          'Failed to verify prescription'
      );
    }
  },
};
