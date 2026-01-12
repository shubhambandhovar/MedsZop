import { Users, ShoppingBag, TrendingUp, Clock, Activity, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function AdminDashboard() {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">Admin Dashboard</h1>
        <p className="text-muted-foreground">MedsZop Platform Analytics</p>
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
    </div>
  );
}
