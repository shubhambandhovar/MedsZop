import mongoose, { Document, Schema } from 'mongoose';

export interface IPrescription extends Document {
  userId: mongoose.Types.ObjectId;
  imageUrl: string;
  uploadDate: Date;
  verified: boolean;
  medicines: string[];
  doctorName?: string;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema = new Schema<IPrescription>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Please provide prescription image']
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  },
  medicines: [{
    type: String
  }],
  doctorName: {
    type: String,
    trim: true
  },
  validUntil: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
