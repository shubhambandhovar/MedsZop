import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const prescriptionService = {
  /**
   * Upload prescription image for OCR processing
   */
  uploadPrescription: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('prescription', file);

      const response = await axios.post(
        `${API_BASE_URL}/prescription/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          'Failed to upload prescription'
      );
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
