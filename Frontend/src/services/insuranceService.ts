import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface InsuranceData {
  _id: string;
  userId: string;
  provider: 'PolicyBazaar' | 'MediAssist' | 'FHPL' | 'Star Health';
  providerCode: 'POLICYBAZAAR' | 'MEDIASSIST' | 'FHPL' | 'STARHEALTH';
  policyNumber: string;
  policyDocumentUrl: string;
  policyDocumentType: 'pdf' | 'image';
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  totalCoverageLimit: number;
  usedCoverage: number;
  remainingCoverage: number;
  policyStartDate?: string;
  policyEndDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CoverageCheckItem {
  itemId: string;
  itemType: 'medicine' | 'lab-test';
  price: number;
}

export interface CoverageResult {
  itemId: string;
  itemType: string;
  price: number;
  coveredAmount: number;
  userPayableAmount: number;
  coPayPercentage: number;
}

const insuranceService = {
  /**
   * Upload insurance policy
   */
  async uploadPolicy(formData: FormData): Promise<any> {
    const response = await axios.post(`${API_URL}/insurance/upload`, formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get user's insurance policies
   */
  async getUserInsurance(): Promise<InsuranceData[]> {
    const response = await axios.get(`${API_URL}/insurance/user`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data.insurances;
  },

  /**
   * Get insurance by ID
   */
  async getInsuranceById(insuranceId: string): Promise<InsuranceData> {
    const response = await axios.get(`${API_URL}/insurance/${insuranceId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data.insurance;
  },

  /**
   * Check coverage for items
   */
  async checkCoverage(insuranceId: string, items: CoverageCheckItem[]): Promise<any> {
    const response = await axios.post(
      `${API_URL}/insurance/check-coverage/${insuranceId}`,
      { items },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  },

  /**
   * Deactivate insurance
   */
  async deactivateInsurance(insuranceId: string): Promise<any> {
    const response = await axios.put(
      `${API_URL}/insurance/deactivate/${insuranceId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  },
};

export default insuranceService;
