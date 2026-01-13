import api from './api';

export interface SubscriptionPlan {
  _id: string;
  name: string;
  type: 'regular' | 'premium';
  description: string;
  price: number;
  medicines: string[];
  doctorConsultsPerMonth?: number;
  features: string[];
  isActive: boolean;
}

export interface UserSubscription {
  _id: string;
  userId: string;
  planId: string;
  planType: 'regular' | 'premium';
  medicines: Array<{
    medicineId: string;
    name: string;
    quantity: number;
  }>;
  status: 'active' | 'paused' | 'cancelled';
  startDate: Date;
  nextBillingDate: Date;
  totalAmount: number;
  doctorConsultsLeft: number;
  doctorConsultsUsed: number;
}

export interface DoctorConsultation {
  _id: string;
  subscriptionId: string;
  userId: string;
  consultationType: 'chat' | 'video' | 'text';
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  scheduledDate?: Date;
  completedAt?: Date;
  notes?: string;
  prescription?: string;
}

export const subscriptionService = {
  // Get all subscription plans
  getPlans: async (): Promise<{ success: boolean; plans: SubscriptionPlan[] }> => {
    const response = await api.get('/subscription/plans');
    return response.data;
  },

  // Get user's current subscription
  getUserSubscription: async (userId: string): Promise<{ success: boolean; subscription: UserSubscription | null }> => {
    const response = await api.get(`/subscription/user/${userId}`);
    return response.data;
  },

  // Create new subscription
  createSubscription: async (
    userId: string,
    planId: string,
    medicines: Array<{ medicineId: string; name: string; quantity: number }>,
    paymentMethodId?: string
  ): Promise<{ success: boolean; subscription: UserSubscription }> => {
    const response = await api.post('/subscription/create', {
      userId,
      planId,
      medicines,
      paymentMethodId,
    });
    return response.data;
  },

  // Update subscription medicines
  updateMedicines: async (subscriptionId: string, medicines: any[]): Promise<any> => {
    const response = await api.put(`/subscription/${subscriptionId}/medicines`, { medicines });
    return response.data;
  },

  // Pause subscription
  pauseSubscription: async (subscriptionId: string, pauseUntilDate: Date): Promise<any> => {
    const response = await api.put(`/subscription/${subscriptionId}/pause`, { pauseUntilDate });
    return response.data;
  },

  // Resume subscription
  resumeSubscription: async (subscriptionId: string): Promise<any> => {
    const response = await api.put(`/subscription/${subscriptionId}/resume`, {});
    return response.data;
  },

  // Skip a month
  skipMonth: async (subscriptionId: string): Promise<any> => {
    const response = await api.put(`/subscription/${subscriptionId}/skip-month`, {});
    return response.data;
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId: string, reason: string): Promise<any> => {
    const response = await api.put(`/subscription/${subscriptionId}/cancel`, { reason });
    return response.data;
  },

  // Create doctor consultation
  createConsultation: async (
    subscriptionId: string,
    userId: string,
    consultationType: 'chat' | 'video' | 'text',
    reason: string,
    scheduledDate: Date
  ): Promise<{ success: boolean; consultation: DoctorConsultation }> => {
    const response = await api.post('/consultation/create', {
      subscriptionId,
      userId,
      consultationType,
      reason,
      scheduledDate,
    });
    return response.data;
  },

  // Get user consultations
  getUserConsultations: async (userId: string): Promise<{ success: boolean; consultations: DoctorConsultation[] }> => {
    const response = await api.get(`/consultation/user/${userId}`);
    return response.data;
  },

  // Complete consultation
  completeConsultation: async (
    consultationId: string,
    notes: string,
    prescription: string
  ): Promise<any> => {
    const response = await api.put(`/consultation/${consultationId}/complete`, { notes, prescription });
    return response.data;
  },

  // Cancel consultation
  cancelConsultation: async (consultationId: string): Promise<any> => {
    const response = await api.put(`/consultation/${consultationId}/cancel`, {});
    return response.data;
  },
};
