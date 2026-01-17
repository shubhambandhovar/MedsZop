import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface CreateOrderParams {
  orderId: string;
  amount: number;
  insuranceId?: string;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentData {
  _id: string;
  orderId: string;
  userId: string;
  gatewayOrderId: string;
  transactionId?: string;
  paymentMethod: string;
  paymentGateway: string;
  paymentStatus: 'pending' | 'success' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  insuranceUsed: boolean;
  insuranceId?: string;
  insuranceCoveredAmount?: number;
  userPayableAmount: number;
  createdAt: string;
  updatedAt: string;
}

const paymentService = {
  /**
   * Create payment order
   */
  async createOrder(params: CreateOrderParams): Promise<any> {
    const response = await axios.post(`${API_URL}/payments/create-order`, params, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  /**
   * Verify payment after successful transaction
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<any> {
    const response = await axios.post(`${API_URL}/payments/verify`, params, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<PaymentData> {
    const response = await axios.get(`${API_URL}/payments/order/${orderId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data.payment;
  },

  /**
   * Get user's payment history
   */
  async getUserPayments(limit: number = 10): Promise<PaymentData[]> {
    const response = await axios.get(`${API_URL}/payments/user?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data.payments;
  },

  /**
   * Initialize Razorpay checkout
   */
  initializeRazorpay(
    options: {
      key: string;
      amount: number;
      currency: string;
      order_id: string;
      name: string;
      description: string;
      prefill?: {
        name?: string;
        email?: string;
        contact?: string;
      };
      theme?: {
        color?: string;
      };
    },
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void
  ) {
    const rzp = new (window as any).Razorpay({
      ...options,
      handler: onSuccess,
      modal: {
        ondismiss: () => {
          onFailure({ error: 'Payment cancelled by user' });
        },
      },
    });

    rzp.on('payment.failed', (response: any) => {
      onFailure(response);
    });

    rzp.open();
  },
};

export default paymentService;
