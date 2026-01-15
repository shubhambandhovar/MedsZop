import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import { ADMIN_PERMISSIONS, AdminPermission } from '../utils/constants/adminPermissions';
import { sendAdminInviteEmail } from '../utils/email';

const getAllowedDomain = () => process.env.ADMIN_EMAIL_DOMAIN || 'medszop.com';

const isAdminPermission = (p: unknown): p is AdminPermission =>
  (ADMIN_PERMISSIONS as readonly string[]).includes(String(p));

const sanitizePermissions = (perms: unknown): AdminPermission[] => {
  if (!Array.isArray(perms)) return [];
  return perms
    .map((p) => String(p))
    .filter((p): p is AdminPermission => isAdminPermission(p));
};

export const createAdminUser = async (req: Request, res: Response) => {
  try {
    const { name, email, role = 'admin', department, permissions = [], status = 'active' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const emailDomain = email.split('@')[1];
    if (!emailDomain || emailDomain.toLowerCase() !== getAllowedDomain().toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Email must be a company email' });
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid admin role' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User already exists with this email' });
    }

    const sanitizedPermissions = sanitizePermissions(permissions);

    const user = new User({
      name,
      email,
      password: null,
      phone: '0000000000',
      role,
      department,
      permissions: sanitizedPermissions,
      status,
      firstLogin: true,
      createdBy: req.user?._id
    });

    const { token, expires } = user.createPasswordResetToken();
    await user.save();

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/admin/set-password/${token}`;

    let emailSent = false;
    try {
      const emailResult = await sendAdminInviteEmail({ to: email, name, inviteLink, expires });
      emailSent = emailResult.sent;
      console.log('[mailer:createAdminUser]', { emailSent, to: email, inviteLink });
      if (!emailResult.sent) {
        console.warn('[mailer] Invite email not sent (not configured). Link:', inviteLink);
      }
    } catch (err) {
      console.error('Failed to send admin invite email', err);
    }

    return res.status(201).json({
      success: true,
      message: 'Admin user created and invite sent',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          permissions: user.permissions,
          status: user.status,
          firstLogin: user.firstLogin
        },
        invite: { link: inviteLink, expires, emailSent }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const listAdmins = async (_req: Request, res: Response) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('-password -passwordResetToken -passwordResetExpires');
    return res.status(200).json({ success: true, data: admins });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateAdminStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const admin = await User.findById(id);
    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (admin.role === 'super_admin' && req.user?._id.toString() !== admin._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot change status of another super admin' });
    }

    admin.status = status;
    await admin.save();

    return res.status(200).json({ success: true, message: 'Status updated', data: { id: admin._id, status: admin.status } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateAdminPermissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions, department, role } = req.body;

    const admin = await User.findById(id);
    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (admin.role === 'super_admin' && req.user?._id.toString() !== admin._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot modify another super admin' });
    }

    if (role && !['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (permissions) {
      admin.permissions = sanitizePermissions(permissions);
    }

    if (department !== undefined) {
      admin.department = department;
    }

    if (role) {
      admin.role = role;
    }

    await admin.save();

    return res.status(200).json({
      success: true,
      message: 'Admin permissions updated',
      data: {
        id: admin._id,
        role: admin.role,
        permissions: admin.permissions,
        department: admin.department
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const resendAdminInvite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = await User.findById(id);

    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const { token, expires } = admin.createPasswordResetToken();
    admin.firstLogin = true;
    await admin.save();

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/admin/set-password/${token}`;

    let emailSent = false;
    try {
      const emailResult = await sendAdminInviteEmail({ to: admin.email, name: admin.name, inviteLink, expires });
      emailSent = emailResult.sent;
      console.log('[mailer:resendInvite]', { emailSent, to: admin.email, inviteLink });
      if (!emailResult.sent) {
        console.warn('[mailer] Invite email not sent (not configured). Link:', inviteLink);
      }
    } catch (err) {
      console.error('Failed to send admin invite email (resend)', err);
    }

    return res.status(200).json({
      success: true,
      message: 'Invite resent',
      data: { invite: { link: inviteLink, expires, emailSent } }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const setAdminPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required' });
    }

    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const admin = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() }
    }).select('+password');

    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    admin.password = password;
    admin.firstLogin = false;
    admin.status = 'active';
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;

    await admin.save();

    return res.status(200).json({ success: true, message: 'Password set successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get all pending pharmacy registrations
// @route   GET /api/admin/pharmacy/pending
// @access  Private/Admin
export const getPendingPharmacies = async (req: Request, res: Response) => {
  try {
    const pendingPharmacies = await User.find({
      role: 'pharmacy',
      isApproved: false
    }).select('-password');

    res.status(200).json({
      success: true,
      count: pendingPharmacies.length,
      data: pendingPharmacies
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve pharmacy registration
// @route   PUT /api/admin/pharmacy/:id/approve
// @access  Private/Admin
export const approvePharmacy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?._id;

    const pharmacy = await User.findById(id);

    if (!pharmacy || pharmacy.role !== 'pharmacy') {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    if (pharmacy.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Pharmacy is already approved'
      });
    }

    pharmacy.isApproved = true;
    pharmacy.approvedBy = adminId;
    pharmacy.approvedAt = new Date();
    pharmacy.rejectionReason = undefined;

    await pharmacy.save();

    res.status(200).json({
      success: true,
      message: 'Pharmacy approved successfully',
      data: pharmacy
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject pharmacy registration
// @route   PUT /api/admin/pharmacy/:id/reject
// @access  Private/Admin
export const rejectPharmacy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const pharmacy = await User.findById(id);

    if (!pharmacy || pharmacy.role !== 'pharmacy') {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    pharmacy.isApproved = false;
    pharmacy.rejectionReason = reason;

    await pharmacy.save();

    res.status(200).json({
      success: true,
      message: 'Pharmacy registration rejected',
      data: pharmacy
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
