import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IAddress {
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string | null;
  phone: string;
  role: 'user' | 'pharmacy' | 'admin' | 'super_admin';
  permissions: string[];
  department?: string;
  status: 'active' | 'inactive';
  firstLogin: boolean;
  addresses: IAddress[];
  savedPrescriptions: string[]; // Array of prescription IDs
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createPasswordResetToken(): { token: string; expires: Date };
}

const AddressSchema = new Schema<IAddress>({
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  landmark: String,
  isDefault: { type: Boolean, default: false }
});

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    minlength: 6,
    select: false,
    default: null
  },
  phone: {
    type: String,
    required: [function(this: IUser) { return this.role === 'user' || this.role === 'pharmacy'; }, 'Please provide a phone number'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    default: '0000000000'
  },
  role: {
    type: String,
    enum: ['user', 'pharmacy', 'admin', 'super_admin'],
    default: 'user'
  },
  permissions: {
    type: [String],
    default: []
  },
  department: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  firstLogin: {
    type: Boolean,
    default: false
  },
  addresses: [AddressSchema],
  savedPrescriptions: [{
    type: Schema.Types.ObjectId,
    ref: 'Prescription'
  }],
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.createPasswordResetToken = function(): { token: string; expires: Date } {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  this.passwordResetExpires = expires;
  return { token: resetToken, expires };
};

export default mongoose.model<IUser>('User', UserSchema);
