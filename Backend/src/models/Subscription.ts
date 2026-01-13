import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  name: string;
  type: 'regular' | 'premium';
  description: string;
  price: number;
  medicines: string[];
  doctorConsultsPerMonth?: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscription extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  planId: mongoose.Schema.Types.ObjectId;
  planType: 'regular' | 'premium';
  medicines: Array<{
    medicineId: string;
    name: string;
    quantity: number;
  }>;
  status: 'active' | 'paused' | 'cancelled';
  startDate: Date;
  nextBillingDate: Date;
  billingCycleDay: number;
  totalAmount: number;
  autoPaymentEnabled: boolean;
  paymentMethodId?: string;
  doctorConsultsLeft: number;
  doctorConsultsUsed: number;
  skippedMonths: Date[];
  pausedUntil?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  notificationsSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoctorConsultation extends Document {
  subscriptionId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  doctorId?: mongoose.Schema.Types.ObjectId;
  consultationType: 'chat' | 'video' | 'text';
  reason: string;
  prescription?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  scheduledDate?: Date;
  completedAt?: Date;
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: ['regular', 'premium'], required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    medicines: [{ type: String }],
    doctorConsultsPerMonth: { type: Number, default: 0 },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    planType: { type: String, enum: ['regular', 'premium'], required: true },
    medicines: [
      {
        medicineId: String,
        name: String,
        quantity: Number,
      },
    ],
    status: { type: String, enum: ['active', 'paused', 'cancelled'], default: 'active' },
    startDate: { type: Date, default: Date.now },
    nextBillingDate: { type: Date, required: true },
    billingCycleDay: { type: Number, default: 1 },
    totalAmount: { type: Number, required: true },
    autoPaymentEnabled: { type: Boolean, default: true },
    paymentMethodId: String,
    doctorConsultsLeft: { type: Number, default: 0 },
    doctorConsultsUsed: { type: Number, default: 0 },
    skippedMonths: [{ type: Date }],
    pausedUntil: Date,
    cancelledAt: Date,
    cancellationReason: String,
    notificationsSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const DoctorConsultationSchema = new Schema<IDoctorConsultation>(
  {
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    consultationType: { type: String, enum: ['chat', 'video', 'text'], required: true },
    reason: { type: String, required: true },
    prescription: String,
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
    scheduledDate: Date,
    completedAt: Date,
    notes: String,
    attachments: [String],
  },
  { timestamps: true }
);

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>(
  'SubscriptionPlan',
  SubscriptionPlanSchema
);

export const Subscription = mongoose.model<ISubscription>(
  'Subscription',
  SubscriptionSchema
);

export const DoctorConsultation = mongoose.model<IDoctorConsultation>(
  'DoctorConsultation',
  DoctorConsultationSchema
);
