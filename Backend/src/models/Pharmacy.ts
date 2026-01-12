import mongoose, { Document, Schema } from 'mongoose';

export interface IPharmacy extends Document {
  name: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  activeOrders: number;
  completedOrders: number;
  userId: mongoose.Types.ObjectId; // Link to user account with pharmacy role
  createdAt: Date;
  updatedAt: Date;
}

const PharmacySchema = new Schema<IPharmacy>({
  name: {
    type: String,
    required: [true, 'Please provide pharmacy name'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Please provide pharmacy address']
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true
  },
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  activeOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  completedOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IPharmacy>('Pharmacy', PharmacySchema);
