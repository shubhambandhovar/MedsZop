import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

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
  password: string;
  phone: string;
  role: 'user' | 'pharmacy' | 'admin';
  addresses: IAddress[];
  savedPrescriptions: string[]; // Array of prescription IDs
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
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
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  role: {
    type: String,
    enum: ['user', 'pharmacy', 'admin'],
    default: 'user'
  },
  addresses: [AddressSchema],
  savedPrescriptions: [{
    type: Schema.Types.ObjectId,
    ref: 'Prescription'
  }],
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
