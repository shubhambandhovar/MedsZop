import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicine extends Document {
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
  estimatedDeliveryTime: number;
  imageUrl: string;
  pharmacyId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema = new Schema<IMedicine>({
  name: {
    type: String,
    required: [true, 'Please provide medicine name'],
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Please provide brand name'],
    trim: true
  },
  genericName: {
    type: String,
    required: [true, 'Please provide generic name'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please provide price'],
    min: 0
  },
  mrp: {
    type: Number,
    required: [true, 'Please provide MRP'],
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  description: {
    type: String,
    required: [true, 'Please provide description']
  },
  category: {
    type: String,
    required: [true, 'Please provide category'],
    enum: ['Pain Relief', 'Antibiotics', 'Allergy', 'Diabetes', 'Gastro', 'Cardiovascular', 'Vitamins', 'Other']
  },
  inStock: {
    type: Boolean,
    default: true
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  manufacturer: {
    type: String,
    required: [true, 'Please provide manufacturer name']
  },
  packSize: {
    type: String,
    required: [true, 'Please provide pack size']
  },
  nearbyAvailability: {
    type: Boolean,
    default: true
  },
  estimatedDeliveryTime: {
    type: Number,
    default: 30,
    min: 0
  },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'
  },
  pharmacyId: {
    type: Schema.Types.ObjectId,
    ref: 'Pharmacy'
  }
}, {
  timestamps: true
});

// Index for search functionality
MedicineSchema.index({ name: 'text', brand: 'text', genericName: 'text', category: 'text' });

export default mongoose.model<IMedicine>('Medicine', MedicineSchema);
