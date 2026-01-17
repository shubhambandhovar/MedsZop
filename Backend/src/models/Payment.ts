import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  gatewayOrderId: string;
  transactionId?: string;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet' | 'paylater' | 'insurance';
  paymentGateway: 'razorpay' | 'paytm';
  amount: number;
  currency: string;
  paymentStatus: 'pending' | 'success' | 'failed' | 'refunded';
  insuranceUsed: boolean;
  insuranceId?: mongoose.Types.ObjectId;
  insuranceCoveredAmount?: number;
  userPayableAmount: number;
  gatewayResponse?: any;
  webhookData?: any;
  failureReason?: string;
  refundId?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    gatewayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    transactionId: {
      type: String,
      index: true,
      sparse: true,
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet', 'paylater', 'insurance'],
      required: true,
    },
    paymentGateway: {
      type: String,
      enum: ['razorpay', 'paytm'],
      required: true,
      default: 'razorpay',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    insuranceUsed: {
      type: Boolean,
      default: false,
    },
    insuranceId: {
      type: Schema.Types.ObjectId,
      ref: 'Insurance',
      sparse: true,
    },
    insuranceCoveredAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    userPayableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
    },
    webhookData: {
      type: Schema.Types.Mixed,
    },
    failureReason: {
      type: String,
    },
    refundId: {
      type: String,
      sparse: true,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
PaymentSchema.index({ orderId: 1, paymentStatus: 1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ transactionId: 1 }, { sparse: true });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
