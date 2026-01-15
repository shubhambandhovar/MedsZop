import { Request, Response } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import { FirebaseRequest } from '../middleware/firebaseAuth';

// Generate JWT Token
const generateToken = (id: string, role: string, permissions: string[]): string => {
  const payload = { id, role, permissions };
  const secret: Secret = process.env.JWT_SECRET ?? 'default-secret';
  const expiresInEnv = process.env.JWT_EXPIRE;
  const expiresIn: SignOptions['expiresIn'] =
    expiresInEnv && expiresInEnv.trim().length > 0
      ? (expiresInEnv as unknown as SignOptions['expiresIn'])
      : '7d';
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, secret, options);
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role, pharmacyName, pharmacyLicenseUrl, pharmacyLicenseNumber } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    // Validate pharmacy-specific fields
    if (role === 'pharmacy') {
      if (!pharmacyName || !pharmacyLicenseUrl) {
        return res.status(400).json({
          success: false,
          message: 'Pharmacy name and license are required for pharmacy registration'
        });
      }
    }

    // Create user data
    const userData: any = {
      name,
      email,
      password,
      phone,
      role: role || 'user'
    };

    // Add pharmacy-specific fields
    if (role === 'pharmacy') {
      userData.pharmacyName = pharmacyName;
      userData.pharmacyLicenseUrl = pharmacyLicenseUrl;
      userData.pharmacyLicenseNumber = pharmacyLicenseNumber;
      userData.isApproved = false; // Requires admin approval
    }

    // Create user
    const user = await User.create(userData);

    // For pharmacy, don't generate token yet (wait for approval)
    if (role === 'pharmacy') {
      return res.status(201).json({
        success: true,
        message: 'Pharmacy registration submitted successfully. Please wait for admin approval.',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            pharmacyName: user.pharmacyName,
            isApproved: user.isApproved
          },
          requiresApproval: true
        }
      });
    }

    // Generate token for regular users
    const token = generateToken(user._id.toString(), user.role, user.permissions || []);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions,
          status: user.status,
          firstLogin: user.firstLogin,
          addresses: user.addresses
        },
        token
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    // Check if pharmacy account is approved
    if (user.role === 'pharmacy' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your pharmacy account is pending approval. Please wait for admin to approve your account.',
        data: {
          isPending: true,
          pharmacyName: user.pharmacyName,
          email: user.email
        }
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role, user.permissions || []);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions,
          status: user.status,
          firstLogin: user.firstLogin,
          addresses: user.addresses,
          pharmacyName: user.pharmacyName,
          isApproved: user.isApproved
        },
        token
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

// @desc    Login/Create user via Firebase token
// @route   POST /api/auth/firebase-login
// @access  Public (protected by firebaseAuth middleware)
export const firebaseLogin = async (req: FirebaseRequest, res: Response) => {
  try {
    const firebaseUser = req.firebaseUser;

    if (!firebaseUser) {
      return res.status(401).json({ success: false, message: 'No Firebase user attached' });
    }

    const { uid, email, phone } = firebaseUser;

    // Try by uid first
    let user = await User.findOne({ uid });

    // If not found by uid, try by email (to avoid duplicate key error)
    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      // Create new user when neither uid nor email exists
      user = await User.create({
        uid,
        email,
        phone: phone || '0000000000',
        role: 'user',
        password: null
      });
    } else {
      // Ensure uid is set on existing user
      if (!user.uid) {
        user.uid = uid;
        await user.save();
      }
    }

    const token = generateToken(user._id.toString(), user.role, user.permissions || []);

    return res.status(200).json({
      success: true,
      message: 'Firebase login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions,
          status: user.status,
          firstLogin: user.firstLogin,
          addresses: user.addresses
        },
        token
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server error during Firebase login' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).populate('savedPrescriptions');

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user?._id,
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          role: user?.role,
          permissions: user?.permissions,
          status: user?.status,
          firstLogin: user?.firstLogin,
          addresses: user?.addresses,
          savedPrescriptions: user?.savedPrescriptions
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, phone, addresses } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (addresses) user.addresses = addresses;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
