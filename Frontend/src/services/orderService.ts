import api from './api';
import { Order, Address } from '../app/types';

interface CreateOrderData {
  items: Array<{
    medicineId: string;
    name: string;
    brand: string;
    price: number;
    quantity: number;
  }>;
  deliveryAddress: Address;
  paymentMethod: string;
  prescriptionId?: string;
}

interface OrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

interface OrdersResponse {
  success: boolean;
  count: number;
  data: Order[];
}

export const orderService = {
  createOrder: async (orderData: CreateOrderData): Promise<OrderResponse> => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getMyOrders: async (): Promise<OrdersResponse> => {
    const response = await api.get('/orders');
    return response.data;
  },

  getOrderById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  cancelOrder: async (id: string) => {
    const response = await api.put(`/orders/${id}/cancel`);
    return response.data;
  },

  getAllOrders: async (filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await api.get('/orders/all/orders', { params });
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },
};
