// Type definitions for MedsZop platform

export interface Medicine {
  id: string;
  name: string;
  brand: string;
  genericName: string;
  price: number;
  mrp: number;
  discount: number;
  description: string;
  category: string;
  inStock: boolean;
  requiresPrescription: boolean;
  manufacturer: string;
  packSize: string;
  nearbyAvailability: boolean;
  estimatedDeliveryTime: number; // in minutes
  imageUrl: string;
}

export interface CartItem extends Medicine {
  quantity: number;
}

export interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryAddress: Address;
  estimatedDeliveryTime: number;
  paymentMethod: string;
  prescriptionRequired: boolean;
  prescriptionVerified: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  orders: Order[];
  savedPrescriptions: Prescription[];
}

export interface Prescription {
  id: string;
  imageUrl: string;
  uploadDate: string;
  verified: boolean;
  medicines: string[];
  doctorName?: string;
}

export interface PharmacyOrder extends Order {
  pharmacyId: string;
  assignedTo: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  rating: number;
  activeOrders: number;
  completedOrders: number;
  inventory: Medicine[];
}

export type ViewType = 
  | 'home' 
  | 'search' 
  | 'medicine-detail' 
  | 'prescription' 
  | 'cart' 
  | 'checkout'
  | 'order-tracking'
  | 'order-success'
  | 'profile'
  | 'login'
  | 'pharmacy-dashboard'
  | 'admin-dashboard'
  | 'chatbot'
  | 'doctor-consultation';

export type Language = 'en' | 'hi';
