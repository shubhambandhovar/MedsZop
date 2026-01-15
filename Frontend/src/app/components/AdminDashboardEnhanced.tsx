import { useState, useEffect } from 'react';
import { Users, ShoppingBag, TrendingUp, Clock, Activity, LogOut, CheckCircle, XCircle, AlertCircle, FileText, Shield, Settings, BarChart3, Stethoscope, LayoutDashboard, Store, Receipt, User, Eye, EyeOff, Bell, Lock, Edit2, Ban, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { authService } from '../../services/authService';

interface AdminDashboardProps {
  onLogout?: () => void;
  currentUser?: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
}

export function AdminDashboard({ onLogout, currentUser }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [blockedPharmacies, setBlockedPharmacies] = useState<Set<string>>(new Set());
  const [blockedDoctors, setBlockedDoctors] = useState<Set<string>>(new Set());
  const [viewUserModal, setViewUserModal] = useState<any>(null);
  const [viewPharmacyModal, setViewPharmacyModal] = useState<any>(null);
  const [viewDoctorModal, setViewDoctorModal] = useState<any>(null);
  const [viewOrderModal, setViewOrderModal] = useState<any>(null);
  const [viewPrescriptionModal, setViewPrescriptionModal] = useState<any>(null);
  const [viewSubscriptionModal, setViewSubscriptionModal] = useState<any>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [profileUser, setProfileUser] = useState<any>(() => currentUser || authService.getCurrentUser() || {});
  const storedUser = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('Failed to parse stored user', err);
      return null;
    }
  })();

  useEffect(() => {
    const nextUser = currentUser || storedUser || authService.getCurrentUser() || {};
    setProfileUser(nextUser);
  }, [currentUser, storedUser?.email, storedUser?.name, storedUser?.phone, storedUser?.role]);
  
  // Current user role (mock - replace with actual auth context)
  const currentUserRole = 'super_admin';
  
  // Admin management state with localStorage persistence
  const [adminList, setAdminList] = useState<any[]>(() => {
    const saved = localStorage.getItem('medszop_admins');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: '1', name: 'Admin User', email: 'admin@medszop.com', role: 'admin', department: 'Operations', permissions: ['users', 'orders'], status: 'active', createdAt: '2 weeks ago' },
      { id: '2', name: 'Support Admin', email: 'support@medszop.com', role: 'admin', department: 'Support', permissions: ['users', 'prescriptions'], status: 'active', createdAt: '1 week ago' },
    ];
  });
  
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  
  const [createAdminForm, setCreateAdminForm] = useState({
    name: '',
    email: '',
    role: 'admin',
    department: '',
    permissions: new Set<string>(),
    status: 'active'
  });

  // Mock analytics data
  const orderData = [
    { name: 'Mon', orders: 45, revenue: 12500 },
    { name: 'Tue', orders: 52, revenue: 14200 },
    { name: 'Wed', orders: 48, revenue: 13800 },
    { name: 'Thu', orders: 61, revenue: 16500 },
    { name: 'Fri', orders: 55, revenue: 15200 },
    { name: 'Sat', orders: 67, revenue: 18900 },
    { name: 'Sun', orders: 58, revenue: 16100 },
  ];

  const deliveryPerformance = [
    { name: '< 30 min', value: 45 },
    { name: '30-45 min', value: 35 },
    { name: '45-60 min', value: 15 },
    { name: '> 60 min', value: 5 },
  ];

  const popularMedicines = [
    { name: 'Paracetamol', orders: 234 },
    { name: 'Amoxicillin', orders: 189 },
    { name: 'Cetirizine', orders: 156 },
    { name: 'Metformin', orders: 142 },
    { name: 'Omeprazole', orders: 128 },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  // Mock user data
  const users = [
    { id: '1', name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '+91 98765 43210', orders: 12, status: 'active', prescriptions: 5 },
    { id: '2', name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98765 43211', orders: 8, status: 'active', prescriptions: 3 },
    { id: '3', name: 'Amit Patel', email: 'amit@example.com', phone: '+91 98765 43212', orders: 15, status: 'active', prescriptions: 7 },
    { id: '4', name: 'Sneha Reddy', email: 'sneha@example.com', phone: '+91 98765 43213', orders: 5, status: 'inactive', prescriptions: 2 },
  ];

  // Mock pharmacy data
  const pharmacies = [
    { id: '1', name: 'HealthPlus Pharmacy', address: 'MG Road, Bangalore', phone: '+91 98765 43214', status: 'approved', license: 'DL-12345', performance: 4.8, orders: 1250 },
    { id: '2', name: 'QuickMeds Pharmacy', address: 'Koramangala, Bangalore', phone: '+91 98765 43215', status: 'pending', license: 'DL-23456', performance: 4.6, orders: 980 },
    { id: '3', name: 'MediCare Store', address: 'Indiranagar, Bangalore', phone: '+91 98765 43216', status: 'pending', license: 'DL-34567', performance: 4.7, orders: 856 },
    { id: '4', name: 'Apollo Pharmacy', address: 'HSR Layout, Bangalore', phone: '+91 98765 43217', status: 'approved', license: 'DL-45678', performance: 4.9, orders: 1542 },
  ];

  // Mock prescriptions
  const prescriptions = [
    { id: '1', userName: 'Rajesh Kumar', uploadedAt: '2 hours ago', status: 'pending', aiDetected: ['Paracetamol 500mg', 'Amoxicillin 250mg'], pharmacyStatus: 'pending' },
    { id: '2', userName: 'Priya Sharma', uploadedAt: '1 day ago', status: 'approved', aiDetected: ['Cetirizine 10mg'], pharmacyStatus: 'approved' },
    { id: '3', userName: 'Amit Patel', uploadedAt: '3 hours ago', status: 'pending', aiDetected: ['Metformin 500mg', 'Aspirin 75mg'], pharmacyStatus: 'pending' },
  ];

  // Mock subscriptions
  const subscriptions = [
    { id: '1', userName: 'Rajesh Kumar', plan: 'Premium', status: 'active', nextDelivery: 'Jan 20, 2026', revenue: '₹999/month' },
    { id: '2', userName: 'Priya Sharma', plan: 'Regular', status: 'active', nextDelivery: 'Jan 18, 2026', revenue: '₹499/month' },
    { id: '3', userName: 'Amit Patel', plan: 'Premium', status: 'paused', nextDelivery: '-', revenue: '₹999/month' },
  ];

  // Mock doctors
  const doctors = [
    { id: '1', name: 'Dr. Ramesh Verma', specialization: 'General Physician', fee: '₹500', availability: 'Available', consultations: 125 },
    { id: '2', name: 'Dr. Meera Patel', specialization: 'Cardiologist', fee: '₹800', availability: 'Busy', consultations: 89 },
    { id: '3', name: 'Dr. Arjun Singh', specialization: 'Dermatologist', fee: '₹600', availability: 'Available', consultations: 67 },
  ];

  // Mock orders
  const orders = [
    { id: 'MZ2026010001', userName: 'Rajesh Kumar', items: 2, amount: '₹156', status: 'delivered', time: '2 hours ago' },
    { id: 'MZ2026010002', userName: 'Priya Sharma', items: 3, amount: '₹245', status: 'out_for_delivery', time: '30 min ago' },
    { id: 'MZ2026010003', userName: 'Amit Patel', items: 1, amount: '₹95', status: 'processing', time: 'Just now' },
  ];

  // Navigation items
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'profile', icon: User, label: 'My Profile' },
    { id: 'admin-users', icon: Shield, label: 'Admin Management' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'pharmacies', icon: Store, label: 'Pharmacies' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'prescriptions', icon: FileText, label: 'Prescriptions' },
    { id: 'subscriptions', icon: Receipt, label: 'Subscriptions' },
    { id: 'doctors', icon: Stethoscope, label: 'Doctors' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  // Persist adminList to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('medszop_admins', JSON.stringify(adminList));
  }, [adminList]);

  const handlePasswordChange = () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    toast.success('Password changed successfully');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleOpenProfileEdit = () => {
    setProfileForm({
      name: profileUser?.name || '',
      phone: profileUser?.phone || ''
    });
    setShowEditProfileModal(true);
  };

  const handleProfileSave = async () => {
    if (!profileForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (profileForm.phone && profileForm.phone.trim().length < 6) {
      toast.error('Phone looks too short');
      return;
    }

    setProfileSaving(true);
    try {
      const response = await authService.updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
      });

      const updatedUser = (response as any)?.data?.user || (response as any)?.data?.data?.user || profileUser;
      if (updatedUser) {
        setProfileUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      toast.success('Profile updated successfully');
      setShowEditProfileModal(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to update profile';
      toast.error(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleApprovePharmacy = (name: string) => {
    toast.success(`${name} approved successfully`);
  };

  const handleRejectPharmacy = (name: string) => {
    toast.error(`${name} rejected`);
  };

  const handleBlockUser = (name: string, userId: string) => {
    setBlockedUsers(prev => new Set([...prev, userId]));
    toast.warning(`User ${name} blocked`);
  };

  const handleUnblockUser = (name: string, userId: string) => {
    setBlockedUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
    toast.success(`User ${name} unblocked`);
  };

  const handleOverridePrescription = (id: string) => {
    toast.success(`Prescription #${id} decision overridden`);
  };

  const handleAddDoctor = () => {
    toast.success('Add Doctor form opened');
  };

  const handleEditDoctor = (name: string) => {
    toast.info(`Editing ${name}'s profile`);
  };

  const handleBlockDoctor = (name: string, doctorId: string) => {
    setBlockedDoctors(prev => new Set([...prev, doctorId]));
    toast.warning(`${name} blocked from consultations`);
  };

  const handleUnblockDoctor = (name: string, doctorId: string) => {
    setBlockedDoctors(prev => {
      const newSet = new Set(prev);
      newSet.delete(doctorId);
      return newSet;
    });
    toast.success(`${name} unblocked from consultations`);
  };

  const handleViewUser = (user: any) => {
    setViewUserModal(user);
  };

  const handleViewPharmacy = (pharmacy: any) => {
    setViewPharmacyModal(pharmacy);
  };

  const handleBlockPharmacy = (name: string, pharmacyId: string) => {
    setBlockedPharmacies(prev => new Set([...prev, pharmacyId]));
    toast.warning(`${name} blocked from platform`);
  };

  const handleUnblockPharmacy = (name: string, pharmacyId: string) => {
    setBlockedPharmacies(prev => {
      const newSet = new Set(prev);
      newSet.delete(pharmacyId);
      return newSet;
    });
    toast.success(`${name} unblocked from platform`);
  };

  const handleViewOrder = (order: any) => {
    setViewOrderModal(order);
  };

  const handleViewPrescription = (prescription: any) => {
    setViewPrescriptionModal(prescription);
  };

  const handleViewSubscription = (subscription: any) => {
    setViewSubscriptionModal(subscription);
  };

  const handleViewDoctor = (doctor: any) => {
    setViewDoctorModal(doctor);
  };

  const handleSaveSettings = (section: string) => {
    toast.success(`${section} settings saved successfully`);
  };

  const handleEditAdmin = (admin: any) => {
    setEditingAdmin({
      ...admin,
      permissions: new Set(admin.permissions)
    });
    setShowEditAdminModal(true);
  };

  const handleSaveEditAdmin = () => {
    if (!editingAdmin.name || !editingAdmin.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (editingAdmin.permissions.size === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    const updatedList = adminList.map(admin => 
      admin.id === editingAdmin.id 
        ? {
            ...editingAdmin,
            permissions: Array.from(editingAdmin.permissions)
          }
        : admin
    );
    
    setAdminList(updatedList);
    setShowEditAdminModal(false);
    setEditingAdmin(null);
    toast.success(`${editingAdmin.name}'s permissions updated successfully`);
  };

  const handleCreateAdmin = () => {
    if (!createAdminForm.name || !createAdminForm.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!createAdminForm.email.includes('@medszop.com')) {
      toast.error('Email must be a company email (@medszop.com)');
      return;
    }
    if (createAdminForm.permissions.size === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    const newAdmin = {
      id: (adminList.length + 1).toString(),
      name: createAdminForm.name,
      email: createAdminForm.email,
      role: createAdminForm.role,
      department: createAdminForm.department,
      permissions: Array.from(createAdminForm.permissions),
      status: 'active',
      createdAt: 'Just now'
    };

    setAdminList([...adminList, newAdmin]);
    setCreateAdminForm({
      name: '',
      email: '',
      role: 'admin',
      department: '',
      permissions: new Set(),
      status: 'active'
    });
    setShowCreateAdminModal(false);
    toast.success('Admin user created successfully');
  };

  const handlePermissionToggle = (permission: string) => {
    setCreateAdminForm(prev => {
      const newPerms = new Set(prev.permissions);
      if (newPerms.has(permission)) {
        newPerms.delete(permission);
      } else {
        newPerms.add(permission);
      }
      return { ...prev, permissions: newPerms };
    });
  };

  const handleDeleteAdmin = (adminId: string) => {
    setAdminList(adminList.filter(a => a.id !== adminId));
    toast.success('Admin user deleted successfully');
  };

  const renderDashboard = () => (
    <div>
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">Dashboard Overview</h1>
        <p className="text-muted-foreground">Monitor platform performance and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-blue-light)]">
                <Users className="h-6 w-6 text-[var(--health-blue)]" />
              </div>
              <div>
                <p className="text-2xl font-bold">12,453</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-[var(--health-green)]">
              <TrendingUp className="h-4 w-4" />
              <span>+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-green-light)]">
                <ShoppingBag className="h-6 w-6 text-[var(--health-green)]" />
              </div>
              <div>
                <p className="text-2xl font-bold">3,864</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-[var(--health-green)]">
              <TrendingUp className="h-4 w-4" />
              <span>+8% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹8.4L</p>
                <p className="text-sm text-muted-foreground">Revenue (This Month)</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-[var(--health-green)]">
              <TrendingUp className="h-4 w-4" />
              <span>+15% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">38 min</p>
                <p className="text-sm text-muted-foreground">Avg. Delivery Time</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-[var(--health-green)]">
              <TrendingUp className="h-4 w-4" />
              <span>5 min faster</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-orange-50 p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900">2 Pharmacy approval requests pending</p>
                <p className="text-sm text-orange-700">Review and approve new pharmacy partners</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setActiveSection('pharmacies')}>Review</Button>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">2 Prescriptions awaiting review</p>
                <p className="text-sm text-blue-700">Monitor AI detection accuracy</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setActiveSection('prescriptions')}>Review</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders & Revenue (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={orderData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#0369a1" strokeWidth={2} name="Orders" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deliveryPerformance}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deliveryPerformance.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div>
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">Admin Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and security</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={profileUser?.name || 'Admin User'} readOnly className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profileUser?.email || 'admin@medszop.com'} readOnly className="mt-1" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={profileUser?.phone || 'N/A'} readOnly className="mt-1" />
            </div>
            <div>
              <Label>Role</Label>
              <Badge className="mt-1 bg-purple-600">{profileUser?.role || 'admin'}</Badge>
            </div>
            <Button className="w-full" onClick={handleOpenProfileEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handlePasswordChange} className="w-full">
              <Lock className="mr-2 h-4 w-4" />
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-semibold">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add extra security to your account</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.success('2FA enabled successfully')}>Enable</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-semibold">Active Sessions</p>
                <p className="text-sm text-muted-foreground">Manage logged in devices</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info('Viewing active sessions')}>View</Button>
            </div>
            <Button variant="destructive" className="w-full" onClick={() => toast.success('Logged out from all devices')}>
              Logout from All Devices
            </Button>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                <div>
                  <p className="font-semibold">Approved pharmacy registration</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                <div>
                  <p className="font-semibold">Updated platform settings</p>
                  <p className="text-xs text-muted-foreground">Yesterday</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                <div>
                  <p className="font-semibold">Reviewed prescription scan</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">User Management</h1>
          <p className="text-muted-foreground">View and manage customer accounts</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-blue-light)]">
                    <Users className="h-6 w-6 text-[var(--health-blue)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{user.orders} orders</p>
                    <p className="text-xs text-muted-foreground">{user.prescriptions} prescriptions</p>
                    <Badge variant={blockedUsers.has(user.id) ? 'destructive' : user.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                      {blockedUsers.has(user.id) ? 'blocked' : user.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewUser(user)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {blockedUsers.has(user.id) ? (
                      <Button variant="outline" size="sm" className="text-green-600 hover:bg-green-50" onClick={() => handleUnblockUser(user.name, user.id)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleBlockUser(user.name, user.id)}>
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPharmacies = () => (
    <div>
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">Pharmacy Management</h1>
        <p className="text-muted-foreground">Review, approve, and manage pharmacy partners</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-orange-700">Pending Approvals ({pharmacies.filter(p => p.status === 'pending').length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pharmacies.filter(p => p.status === 'pending').map((pharmacy) => (
              <div key={pharmacy.id} className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-200">
                    <Store className="h-6 w-6 text-orange-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{pharmacy.name}</h3>
                    <p className="text-sm text-muted-foreground">{pharmacy.address}</p>
                    <p className="text-xs text-muted-foreground">License: {pharmacy.license} • {pharmacy.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="bg-[var(--health-green)] hover:bg-[var(--health-green-dark)]" onClick={() => handleApprovePharmacy(pharmacy.name)}>
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleRejectPharmacy(pharmacy.name)}>
                    <XCircle className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Pharmacies ({pharmacies.filter(p => p.status === 'approved').length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pharmacies.filter(p => p.status === 'approved').map((pharmacy) => (
              <div key={pharmacy.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-green-light)]">
                    <Store className="h-6 w-6 text-[var(--health-green)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{pharmacy.name}</h3>
                    <p className="text-sm text-muted-foreground">{pharmacy.address}</p>
                    <p className="text-xs text-muted-foreground">License: {pharmacy.license} • {pharmacy.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-[var(--health-green)]">{pharmacy.performance}★</p>
                    <p className="text-sm">{pharmacy.orders} orders</p>
                    <Badge className={`mt-1 ${blockedPharmacies.has(pharmacy.id) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {blockedPharmacies.has(pharmacy.id) ? 'Blocked' : 'Active'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewPharmacy(pharmacy)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {blockedPharmacies.has(pharmacy.id) ? (
                      <Button variant="outline" size="sm" className="text-green-600 hover:bg-green-50" onClick={() => handleUnblockPharmacy(pharmacy.name, pharmacy.id)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleBlockPharmacy(pharmacy.name, pharmacy.id)}>
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrders = () => (
    <div>
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">Order Management</h1>
        <p className="text-muted-foreground">Monitor all platform orders and delivery performance</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100' :
                    order.status === 'out_for_delivery' ? 'bg-blue-100' :
                    'bg-orange-100'
                  }`}>
                    <ShoppingBag className={`h-6 w-6 ${
                      order.status === 'delivered' ? 'text-green-600' :
                      order.status === 'out_for_delivery' ? 'text-blue-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Order #{order.id}</h3>
                    <p className="text-sm text-muted-foreground">{order.userName}</p>
                    <p className="text-xs text-muted-foreground">{order.items} items • {order.amount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge className={
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }>
                      {order.status === 'delivered' && <CheckCircle className="mr-1 h-3 w-3" />}
                      {order.status === 'out_for_delivery' && <Activity className="mr-1 h-3 w-3" />}
                      {order.status === 'processing' && <AlertCircle className="mr-1 h-3 w-3" />}
                      {order.status.replace('_', ' ')}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">{order.time}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPrescriptions = () => (
    <div>
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">Prescription Oversight</h1>
        <p className="text-muted-foreground">Review AI-scanned prescriptions and ensure medical safety</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--health-blue-light)]">
                      <FileText className="h-6 w-6 text-[var(--health-blue)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Prescription #{prescription.id}</h3>
                      <p className="text-sm text-muted-foreground">{prescription.userName}</p>
                      <p className="text-xs text-muted-foreground">Uploaded {prescription.uploadedAt}</p>
                      <div className="mt-2">
                        <p className="text-sm font-semibold">AI Detected Medicines:</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {prescription.aiDetected.map((med, idx) => (
                            <Badge key={idx} variant="outline">{med}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant={prescription.status === 'approved' ? 'default' : 'secondary'}>
                      {prescription.status}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleViewPrescription(prescription)}>
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                    {prescription.status === 'pending' && (
                      <Button size="sm" onClick={() => handleOverridePrescription(prescription.id)}>
                        Override
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSubscriptions = () => (
    <div>
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">Subscription Management</h1>
        <p className="text-muted-foreground">Monitor recurring revenue and subscription plans</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--health-blue)]">156</p>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">98</p>
              <p className="text-sm text-muted-foreground">Premium Plans</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--health-green)]">₹1.2L</p>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                    <Receipt className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{sub.userName}</h3>
                    <p className="text-sm text-muted-foreground">Plan: {sub.plan}</p>
                    <p className="text-xs text-muted-foreground">Next delivery: {sub.nextDelivery}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">{sub.revenue}</p>
                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                      {sub.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleViewSubscription(sub)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDoctors = () => (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">Doctor Management</h1>
          <p className="text-muted-foreground">Manage doctors for premium consultation services</p>
        </div>
        <Button className="bg-[var(--health-green)] hover:bg-[var(--health-green-dark)]" onClick={handleAddDoctor}>
          <Users className="mr-2 h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-blue-light)]">
                    <Stethoscope className="h-6 w-6 text-[var(--health-blue)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{doctor.name}</h3>
                    <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                    <p className="text-xs text-muted-foreground">{doctor.consultations} consultations completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">{doctor.fee}</p>
                    <Badge variant={blockedDoctors.has(doctor.id) ? 'destructive' : doctor.availability === 'Available' ? 'default' : 'secondary'} className="mt-1">
                      {blockedDoctors.has(doctor.id) ? 'Blocked' : doctor.availability}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewDoctor(doctor)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditDoctor(doctor.name)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {blockedDoctors.has(doctor.id) ? (
                      <Button variant="outline" size="sm" className="text-green-600 hover:bg-green-50" onClick={() => handleUnblockDoctor(doctor.name, doctor.id)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleBlockDoctor(doctor.name, doctor.id)}>
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div>
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">Analytics & Reports</h1>
        <p className="text-muted-foreground">Business intelligence and performance metrics</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Medicines</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularMedicines}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#0369a1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={orderData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Pharmacies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pharmacies.filter(p => p.status === 'approved').map((pharmacy) => (
                  <div key={pharmacy.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-semibold">{pharmacy.name}</p>
                      <p className="text-xs text-muted-foreground">{pharmacy.orders} orders</p>
                    </div>
                    <p className="font-semibold text-[var(--health-green)]">{pharmacy.performance}★</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div>
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">Platform Settings</h1>
        <p className="text-muted-foreground">Configure system behavior and platform controls</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Delivery Charge (₹)</Label>
              <Input type="number" defaultValue="40" className="mt-1" />
            </div>
            <div>
              <Label>Free Delivery Above (₹)</Label>
              <Input type="number" defaultValue="500" className="mt-1" />
            </div>
            <Button className="w-full" onClick={() => handleSaveSettings('Delivery')}>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Commission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Commission Rate (%)</Label>
              <Input type="number" defaultValue="15" className="mt-1" />
            </div>
            <div>
              <Label>Subscription Commission (%)</Label>
              <Input type="number" defaultValue="10" className="mt-1" />
            </div>
            <Button className="w-full" onClick={() => handleSaveSettings('Commission')}>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Toggles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p>AI Prescription Scanner</p>
              <Badge className="bg-green-100 text-green-700">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p>Doctor Consultations</p>
              <Badge className="bg-green-100 text-green-700">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p>Subscription Plans</p>
              <Badge className="bg-green-100 text-green-700">Enabled</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medicine Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-2">
              <span className="text-sm">General Medicines</span>
              <Button variant="ghost" size="sm">
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-2">
              <span className="text-sm">Prescription Required</span>
              <Button variant="ghost" size="sm">
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-2">
              <span className="text-sm">Supplements</span>
              <Button variant="ghost" size="sm">
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => toast.success('Add category dialog opened')}>Add Category</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAdminManagement = () => (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">Admin Management</h1>
          <p className="text-muted-foreground">Create and manage admin users with role-based permissions</p>
        </div>
        <Button 
          className="bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)]"
          disabled={currentUserRole !== 'super_admin'}
          title={currentUserRole !== 'super_admin' ? 'Only super admins can create admins' : 'Create a new admin'}
          onClick={() => {
            if (currentUserRole === 'super_admin') {
              setShowCreateAdminModal(true);
            } else {
              toast.error('Only super admins can create new admins');
            }
          }}
        >
          <Shield className="mr-2 h-4 w-4" />
          Create New Admin
        </Button>
      </div>

      {/* Admin List */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Permissions</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminList.map((admin) => (
                  <tr key={admin.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{admin.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{admin.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                        {admin.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{admin.department || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {admin.permissions.map((perm: string) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={admin.status === 'active' ? 'default' : 'destructive'}>
                        {admin.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={currentUserRole !== 'super_admin'}
                          title={currentUserRole !== 'super_admin' ? 'Only super admins can edit' : 'Edit permissions'}
                          onClick={() => {
                            if (currentUserRole === 'super_admin') {
                              handleEditAdmin(admin);
                            } else {
                              toast.error('Only super admins can edit other admins');
                            }
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          disabled={currentUserRole !== 'super_admin'}
                          title={currentUserRole !== 'super_admin' ? 'Only super admins can delete' : 'Delete admin'}
                          onClick={() => {
                            if (currentUserRole === 'super_admin') {
                              handleDeleteAdmin(admin.id);
                            } else {
                              toast.error('Only super admins can delete admins');
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r bg-white p-4">
          <div className="mb-6 flex items-center gap-2">
            <img src="/assets/M logo1.png" alt="MedsZop" className="h-10 w-10 rounded-lg" />
            <div>
              <h2 className="font-bold text-[var(--health-blue)]">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">MedsZop Platform</p>
            </div>
          </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  activeSection === item.id
                    ? 'bg-[#5a3bc4] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {onLogout && (
          <Button
            variant="outline"
            onClick={onLogout}
            className="mt-6 w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'profile' && renderProfile()}
          {activeSection === 'admin-users' && renderAdminManagement()}
          {activeSection === 'users' && renderUsers()}
          {activeSection === 'pharmacies' && renderPharmacies()}
          {activeSection === 'orders' && renderOrders()}
          {activeSection === 'prescriptions' && renderPrescriptions()}
          {activeSection === 'subscriptions' && renderSubscriptions()}
          {activeSection === 'doctors' && renderDoctors()}
          {activeSection === 'analytics' && renderAnalytics()}
          {activeSection === 'settings' && renderSettings()}
        </div>
      </div>
      </div>

      {/* View User Modal */}
      <Dialog open={!!viewUserModal} onOpenChange={() => setViewUserModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewUserModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Name</Label>
                  <p className="text-sm">{viewUserModal.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Email</Label>
                  <p className="text-sm">{viewUserModal.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Phone</Label>
                  <p className="text-sm">{viewUserModal.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <Badge variant={blockedUsers.has(viewUserModal.id) ? 'destructive' : viewUserModal.status === 'active' ? 'default' : 'secondary'}>
                    {blockedUsers.has(viewUserModal.id) ? 'blocked' : viewUserModal.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Total Orders</Label>
                  <p className="text-sm">{viewUserModal.orders}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Prescriptions Uploaded</Label>
                  <p className="text-sm">{viewUserModal.prescriptions}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Pharmacy Modal */}
      <Dialog open={!!viewPharmacyModal} onOpenChange={() => setViewPharmacyModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pharmacy Details</DialogTitle>
          </DialogHeader>
          {viewPharmacyModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Name</Label>
                  <p className="text-sm">{viewPharmacyModal.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">License Number</Label>
                  <p className="text-sm">{viewPharmacyModal.license}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Address</Label>
                  <p className="text-sm">{viewPharmacyModal.address}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Phone</Label>
                  <p className="text-sm">{viewPharmacyModal.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Performance Rating</Label>
                  <p className="text-sm">{viewPharmacyModal.performance}★</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Total Orders</Label>
                  <p className="text-sm">{viewPharmacyModal.orders}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <Badge variant={blockedPharmacies.has(viewPharmacyModal.id) ? 'destructive' : viewPharmacyModal.status === 'approved' ? 'default' : 'secondary'}>
                    {blockedPharmacies.has(viewPharmacyModal.id) ? 'Blocked' : viewPharmacyModal.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Doctor Modal */}
      <Dialog open={!!viewDoctorModal} onOpenChange={() => setViewDoctorModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Doctor Details</DialogTitle>
          </DialogHeader>
          {viewDoctorModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Name</Label>
                  <p className="text-sm">{viewDoctorModal.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Specialization</Label>
                  <p className="text-sm">{viewDoctorModal.specialization}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Consultation Fee</Label>
                  <p className="text-sm">{viewDoctorModal.fee}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Availability</Label>
                  <Badge variant={blockedDoctors.has(viewDoctorModal.id) ? 'destructive' : viewDoctorModal.availability === 'Available' ? 'default' : 'secondary'}>
                    {blockedDoctors.has(viewDoctorModal.id) ? 'Blocked' : viewDoctorModal.availability}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Total Consultations</Label>
                  <p className="text-sm">{viewDoctorModal.consultations}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Order Modal */}
      <Dialog open={!!viewOrderModal} onOpenChange={() => setViewOrderModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {viewOrderModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Order ID</Label>
                  <p className="text-sm">#{viewOrderModal.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Customer</Label>
                  <p className="text-sm">{viewOrderModal.userName}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Items</Label>
                  <p className="text-sm">{viewOrderModal.items} items</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Amount</Label>
                  <p className="text-sm">{viewOrderModal.amount}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <Badge className={
                    viewOrderModal.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    viewOrderModal.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-700' :
                    'bg-orange-100 text-orange-700'
                  }>
                    {viewOrderModal.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Time</Label>
                  <p className="text-sm">{viewOrderModal.time}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Prescription Modal */}
      <Dialog open={!!viewPrescriptionModal} onOpenChange={() => setViewPrescriptionModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          {viewPrescriptionModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Prescription ID</Label>
                  <p className="text-sm">#{viewPrescriptionModal.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Patient</Label>
                  <p className="text-sm">{viewPrescriptionModal.userName}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Uploaded</Label>
                  <p className="text-sm">{viewPrescriptionModal.uploadedAt}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <Badge variant={viewPrescriptionModal.status === 'approved' ? 'default' : 'secondary'}>
                    {viewPrescriptionModal.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">AI Detected Medicines</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {viewPrescriptionModal.aiDetected.map((med: string, idx: number) => (
                    <Badge key={idx} variant="outline">{med}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Subscription Modal */}
      <Dialog open={!!viewSubscriptionModal} onOpenChange={() => setViewSubscriptionModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          {viewSubscriptionModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Subscription ID</Label>
                  <p className="text-sm">#{viewSubscriptionModal.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Customer</Label>
                  <p className="text-sm">{viewSubscriptionModal.userName}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Plan</Label>
                  <p className="text-sm">{viewSubscriptionModal.plan}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Revenue</Label>
                  <p className="text-sm">{viewSubscriptionModal.revenue}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <Badge variant={viewSubscriptionModal.status === 'active' ? 'default' : 'secondary'}>
                    {viewSubscriptionModal.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Next Delivery</Label>
                  <p className="text-sm">{viewSubscriptionModal.nextDelivery}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={showEditProfileModal} onOpenChange={setShowEditProfileModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditProfileModal(false)} disabled={profileSaving}>
                Cancel
              </Button>
              <Button onClick={handleProfileSave} disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Admin Modal */}
      <Dialog open={showCreateAdminModal} onOpenChange={setShowCreateAdminModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Admin User</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Name and Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Full Name *</Label>
                <Input
                  id="admin-name"
                  placeholder="Admin name"
                  value={createAdminForm.name}
                  onChange={(e) => setCreateAdminForm({ ...createAdminForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Official Email *</Label>
                <Input
                  id="admin-email"
                  placeholder="name@medszop.com"
                  value={createAdminForm.email}
                  onChange={(e) => setCreateAdminForm({ ...createAdminForm, email: e.target.value })}
                />
              </div>
            </div>

            {/* Role and Department */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-role">Role *</Label>
                <select
                  id="admin-role"
                  value={createAdminForm.role}
                  onChange={(e) => setCreateAdminForm({ ...createAdminForm, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-dept">Department</Label>
                <Input
                  id="admin-dept"
                  placeholder="e.g., Operations, Support"
                  value={createAdminForm.department}
                  onChange={(e) => setCreateAdminForm({ ...createAdminForm, department: e.target.value })}
                />
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Permissions *</Label>
              <div className="space-y-2">
                {['users', 'pharmacies', 'orders', 'prescriptions', 'subscriptions', 'analytics'].map((perm) => (
                  <div key={perm} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`perm-${perm}`}
                      checked={createAdminForm.permissions.has(perm)}
                      onChange={() => handlePermissionToggle(perm)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor={`perm-${perm}`} className="font-normal capitalize">
                      {perm === 'users' && 'User Management'}
                      {perm === 'pharmacies' && 'Pharmacy Management'}
                      {perm === 'orders' && 'Order Management'}
                      {perm === 'prescriptions' && 'Prescription & AI Monitoring'}
                      {perm === 'subscriptions' && 'Subscription Management'}
                      {perm === 'analytics' && 'Analytics & Reports'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Initial Status</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="status-active"
                    value="active"
                    checked={createAdminForm.status === 'active'}
                    onChange={(e) => setCreateAdminForm({ ...createAdminForm, status: e.target.value })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="status-active" className="font-normal">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="status-inactive"
                    value="inactive"
                    checked={createAdminForm.status === 'inactive'}
                    onChange={(e) => setCreateAdminForm({ ...createAdminForm, status: e.target.value })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="status-inactive" className="font-normal">Inactive</Label>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <p className="font-semibold">Note:</p>
              <p>A password setup invitation will be sent to the admin's email. They must set a password to access the dashboard.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowCreateAdminModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)]"
                onClick={handleCreateAdmin}
              >
                Create Admin
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Modal */}
      <Dialog open={showEditAdminModal} onOpenChange={setShowEditAdminModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Admin User</DialogTitle>
          </DialogHeader>
          {editingAdmin && (
            <div className="space-y-6">
              {/* Name and Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-admin-name">Full Name *</Label>
                  <Input
                    id="edit-admin-name"
                    placeholder="Admin name"
                    value={editingAdmin.name}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-admin-email">Official Email *</Label>
                  <Input
                    id="edit-admin-email"
                    placeholder="name@medszop.com"
                    value={editingAdmin.email}
                    disabled
                    className="bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>

              {/* Role and Department */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-admin-role">Role *</Label>
                  <select
                    id="edit-admin-role"
                    value={editingAdmin.role}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, role: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-admin-dept">Department</Label>
                  <Input
                    id="edit-admin-dept"
                    placeholder="e.g., Operations, Support"
                    value={editingAdmin.department}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, department: e.target.value })}
                  />
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Permissions *</Label>
                <div className="space-y-2">
                  {['users', 'pharmacies', 'orders', 'prescriptions', 'subscriptions', 'analytics'].map((perm) => (
                    <div key={perm} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-perm-${perm}`}
                        checked={editingAdmin.permissions.has(perm)}
                        onChange={() => {
                          const newPerms = new Set(editingAdmin.permissions);
                          if (newPerms.has(perm)) {
                            newPerms.delete(perm);
                          } else {
                            newPerms.add(perm);
                          }
                          setEditingAdmin({ ...editingAdmin, permissions: newPerms });
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor={`edit-perm-${perm}`} className="font-normal capitalize">
                        {perm === 'users' && 'User Management'}
                        {perm === 'pharmacies' && 'Pharmacy Management'}
                        {perm === 'orders' && 'Order Management'}
                        {perm === 'prescriptions' && 'Prescription & AI Monitoring'}
                        {perm === 'subscriptions' && 'Subscription Management'}
                        {perm === 'analytics' && 'Analytics & Reports'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="edit-status-active"
                      value="active"
                      checked={editingAdmin.status === 'active'}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, status: e.target.value })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="edit-status-active" className="font-normal">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="edit-status-inactive"
                      value="inactive"
                      checked={editingAdmin.status === 'inactive'}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, status: e.target.value })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="edit-status-inactive" className="font-normal">Inactive</Label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowEditAdminModal(false);
                    setEditingAdmin(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)]"
                  onClick={handleSaveEditAdmin}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
