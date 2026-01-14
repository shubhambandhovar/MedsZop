import { useState } from 'react';
import { Users, ShoppingBag, TrendingUp, Clock, Activity, Package, LogOut, CheckCircle, XCircle, AlertCircle, FileText, Shield, Settings, BarChart3, Stethoscope, LayoutDashboard, Store, Pill, Receipt, User, Eye, EyeOff, Bell, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

interface AdminDashboardProps {
  onLogout?: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  // Mock pharmacy approval requests
  const pharmacyRequests = [
    { id: '1', name: 'HealthPlus Pharmacy', address: 'MG Road, Bangalore', phone: '+91 98765 43214', status: 'pending', license: 'DL-12345', performance: 4.8, orders: 1250 },
    { id: '2', name: 'QuickMeds Pharmacy', address: 'Koramangala, Bangalore', phone: '+91 98765 43215', status: 'pending', license: 'DL-23456', performance: 4.6, orders: 980 },
    { id: '3', name: 'MediCare Store', address: 'Indiranagar, Bangalore', phone: '+91 98765 43216', status: 'pending', license: 'DL-34567', performance: 4.7, orders: 856 },
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

  // Navigation items
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'profile', icon: User, label: 'My Profile' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'pharmacies', icon: Store, label: 'Pharmacies' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'prescriptions', icon: FileText, label: 'Prescriptions' },
    { id: 'subscriptions', icon: Receipt, label: 'Subscriptions' },
    { id: 'doctors', icon: Stethoscope, label: 'Doctors' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

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

  const handleApprovePharmacy = (name: string) => {
    toast.success(`${name} approved successfully`);
  };

  const handleRejectPharmacy = (name: string) => {
    toast.error(`${name} rejected`);
  };

  const handleBlockUser = (name: string) => {
    toast.warning(`User ${name} blocked`);
  };

  const handleOverridePrescription = (id: string) => {
    toast.success(`Prescription #${id} decision overridden`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">Admin Dashboard</h1>
          <p className="text-muted-foreground">MedsZop Platform Analytics</p>
        </div>
        {onLogout && (
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        )}
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

      {/* Charts Section */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="pharmacies">Pharmacy Approvals</TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders & Revenue Chart */}
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
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  stroke="#0369a1"
                  strokeWidth={2}
                  name="Orders"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Revenue (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Delivery Performance */}
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
                  {deliveryPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Medicines */}
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

        {/* Pharmacy Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Pharmacy Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--health-green-light)]">
                    <Package className="h-5 w-5 text-[var(--health-green)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">HealthPlus Pharmacy</h3>
                    <p className="text-sm text-muted-foreground">1,250 orders completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--health-green)]">4.8★</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--health-blue-light)]">
                    <Package className="h-5 w-5 text-[var(--health-blue)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">MediCare Pharmacy</h3>
                    <p className="text-sm text-muted-foreground">980 orders completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--health-green)]">4.6★</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Apollo Pharmacy</h3>
                    <p className="text-sm text-muted-foreground">856 orders completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--health-green)]">4.7★</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border p-4">
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
                        <p className="font-semibold">{user.orders} orders</p>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-green-light)]">
                      <ShoppingBag className="h-6 w-6 text-[var(--health-green)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Order #MZ2026010001</h3>
                      <p className="text-sm text-muted-foreground">Rajesh Kumar</p>
                      <p className="text-xs text-muted-foreground">2 items • ₹156</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Delivered
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-blue-light)]">
                      <ShoppingBag className="h-6 w-6 text-[var(--health-blue)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Order #MZ2026010002</h3>
                      <p className="text-sm text-muted-foreground">Priya Sharma</p>
                      <p className="text-xs text-muted-foreground">3 items • ₹245</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-blue-100 text-blue-700">
                      <Activity className="mr-1 h-3 w-3" />
                      Out for Delivery
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">30 min ago</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                      <ShoppingBag className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Order #MZ2026010003</h3>
                      <p className="text-sm text-muted-foreground">Amit Patel</p>
                      <p className="text-xs text-muted-foreground">1 item • ₹95</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-orange-100 text-orange-700">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Processing
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">Just now</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pharmacy Approvals Tab */}
        <TabsContent value="pharmacies">
          <Card>
            <CardHeader>
              <CardTitle>Pharmacy Approval Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pharmacyRequests.map((pharmacy) => (
                  <div key={pharmacy.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                        <Package className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{pharmacy.name}</h3>
                        <p className="text-sm text-muted-foreground">{pharmacy.address}</p>
                        <p className="text-xs text-muted-foreground">{pharmacy.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="bg-[var(--health-green)] hover:bg-[var(--health-green-dark)]">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
