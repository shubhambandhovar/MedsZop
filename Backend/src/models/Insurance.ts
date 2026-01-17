import mongoose, { Document, Schema } from 'mongoose';

export interface ICoveredItem {
  itemId: string;
  itemType: 'medicine' | 'lab';
  itemName: string;
  originalPrice: number;
  coveredAmount: number;
  coPayPercentage: number;
}

export interface IInsurance extends Document {
  userId: mongoose.Types.ObjectId;
  provider: string;
  providerCode: string;
  policyNumber: string;
  policyDocumentUrl: string;
  policyDocumentType: string;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  coveredItems: ICoveredItem[];
  totalCoverageLimit: number;
  usedCoverage: number;
  remainingCoverage: number;
  policyStartDate?: Date;
  policyEndDate?: Date;
  isActive: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const CoveredItemSchema = new Schema<ICoveredItem>({
  itemId: {
    type: String,
    required: true,
  },
  itemType: {
    type: String,
    enum: ['medicine', 'lab'],
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  coveredAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  coPayPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
});

const InsuranceSchema = new Schema<IInsurance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    providerCode: {
      type: String,
      required: true,
      uppercase: true,
      enum: ['POLICYBAZAAR', 'MEDIASSIST', 'FHPL', 'STARHEALTH', 'OTHER'],
    },
    policyNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    policyDocumentUrl: {
      type: String,
      required: true,
    },
    policyDocumentType: {
      type: String,
      enum: ['pdf', 'image'],
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
    },
    coveredItems: [CoveredItemSchema],
    totalCoverageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedCoverage: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingCoverage: {
      type: Number,
      default: 0,
      min: 0,
    },
    policyStartDate: {
      type: Date,
    },
    policyEndDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
InsuranceSchema.index({ userId: 1, verificationStatus: 1 });
InsuranceSchema.index({ policyNumber: 1 }, { unique: true });
InsuranceSchema.index({ providerCode: 1 });

// Pre-save hook to calculate remaining coverage
InsuranceSchema.pre('save', function (next) {
  if (this.isModified('totalCoverageLimit') || this.isModified('usedCoverage')) {
    this.remainingCoverage = this.totalCoverageLimit - this.usedCoverage;
  }
  next();
});

export const Insurance = mongoose.model<IInsurance>('Insurance', InsuranceSchema);
