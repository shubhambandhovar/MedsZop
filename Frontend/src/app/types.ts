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
  role: 'user' | 'admin' | 'pharmacy';
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

export interface MedicationSchedule {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string; // "Daily", "Twice a day", etc.
  timing: string[]; // ["9:00 AM", "9:00 PM"]
  startDate: string;
  endDate?: string;
  notes?: string;
  active: boolean;
}

export interface Appointment {
  id: string;
  type: 'doctor' | 'lab' | 'checkup';
  title: string;
  date: string;
  time: string;
  doctorName?: string;
  location: string;
  notes?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface HealthMetric {
  id: string;
  type: 'bloodPressure' | 'bloodSugar' | 'weight' | 'heartRate' | 'temperature';
  value: string;
  unit: string;
  date: string;
  notes?: string;
}

export interface LabReport {
  id: string;
  testName: string;
  date: string;
  reportUrl?: string;
  results: {
    parameter: string;
    value: string;
    normalRange: string;
    status: 'normal' | 'high' | 'low';
  }[];
  doctorName?: string;
  labName: string;
}

export interface MedicalHistory {
  id: string;
  condition: string;
  diagnosedDate: string;
  status: 'active' | 'resolved';
  medications: string[];
  notes?: string;
}

export interface HealthReminder {
  id: string;
  type: 'medication' | 'appointment' | 'checkup' | 'custom';
  title: string;
  description: string;
  time: string;
  date: string;
  repeat: 'once' | 'daily' | 'weekly' | 'monthly';
  active: boolean;
}

export interface HealthProfile {
  medications: MedicationSchedule[];
  appointments: Appointment[];
  healthMetrics: HealthMetric[];
  labReports: LabReport[];
  medicalHistory: MedicalHistory[];
  reminders: HealthReminder[];
}

export interface OCRResult {
  medicineNames: string[];
  confidence: number;
  rawText: string;
}

export interface ScannedMedicine {
  detectedName: string;
  matchedMedicine: Medicine | null;
  confidence: number;
  alternatives: Medicine[];
}

export type ViewType = 
  | 'home' 
  | 'search' 
  | 'medicine-detail' 
  | 'prescription' 
  | 'prescription-scanner'
  | 'cart' 
  | 'checkout'
  | 'order-tracking'
  | 'order-success'
  | 'profile'
  | 'login'
  | 'pharmacy-dashboard'
  | 'admin-dashboard'
  | 'health-dashboard'
  | 'chatbot'
  | 'doctor-consultation'
  | 'subscription-plans'
  | 'subscription-manager'
  | 'doctor-consultation';

export type Language = 'en' | 'hi';
