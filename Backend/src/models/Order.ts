import mongoose, { Document, Schema } from 'mongoose';

interface ICartItem {
  medicineId: mongoose.Types.ObjectId;
  name: string;
  brand: string;
  price: number;
  quantity: number;
}

interface IDeliveryAddress {
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  items: ICartItem[];
  total: number;
  status: 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryAddress: IDeliveryAddress;
  estimatedDeliveryTime: number;
  paymentMethod: string;
  prescriptionRequired: boolean;
  prescriptionVerified: boolean;
  prescriptionId?: mongoose.Types.ObjectId;
  pharmacyId?: mongoose.Types.ObjectId;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  medicineId: {
    type: Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 }
});

const DeliveryAddressSchema = new Schema<IDeliveryAddress>({
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    required: true
  },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  landmark: String
});

const OrderSchema = new Schema<IOrder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [CartItemSchema],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  deliveryAddress: {
    type: DeliveryAddressSchema,
    required: true
  },
  estimatedDeliveryTime: {
    type: Number,
    default: 30
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash_on_delivery', 'card', 'upi', 'wallet']
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  prescriptionVerified: {
    type: Boolean,
    default: false
  },
  prescriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  pharmacyId: {
    type: Schema.Types.ObjectId,
    ref: 'Pharmacy'
  },
  assignedTo: String
}, {
  timestamps: true
});

// Generate order number before saving
OrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD${Date.now()}${count + 1}`;
  }
  next();
});

export default mongoose.model<IOrder>('Order', OrderSchema);
