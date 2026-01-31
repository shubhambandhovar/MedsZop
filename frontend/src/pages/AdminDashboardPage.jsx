import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Shield,
  Users,
  Store,
  Package,
  DollarSign,
  CheckCircle,
  Eye,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

const AdminDashboardPage = () => {
  const { token } = useAuth();
  const authToken = token || localStorage.getItem("token");

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // ✅ STATE FOR CREATE USER
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "pharmacy",
  });

  // ================= FETCH DASHBOARD DATA =================
  const fetchData = async () => {
    try {
      const [statsRes, usersRes, pharmaciesRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get(`${API_URL}/admin/pharmacies`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPharmacies(pharmaciesRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchData();
    }
  }, [authToken]);

  // ================= VERIFY PHARMACY =================
  const handleVerifyPharmacy = async (id) => {
    try {
      await axios.put(
        `${API_URL}/admin/pharmacies/${id}/verify`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      toast.success("Pharmacy verified");
      fetchData();
    } catch {
      toast.error("Verification failed");
    }
  };

  // ================= CREATE USER (PHARMACY / DELIVERY) =================
  const handleCreateUser = async () => {
    try {
      await axios.post(
        `${API_URL}/admin/create-user`,
        newUser,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      toast.success("User created successfully");

      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "pharmacy",
      });

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    }
  };

  // ================= CHART DATA =================
  const COLORS = ["#0066FF", "#06B6D4", "#10B981", "#F59E0B"];

  const userRoleData = [
    { name: "Customers", value: users.filter(u => u.role === "customer").length },
    { name: "Pharmacies", value: users.filter(u => u.role === "pharmacy").length },
    { name: "Delivery", value: users.filter(u => u.role === "delivery").length },
    { name: "Admins", value: users.filter(u => u.role === "admin").length },
  ].filter(d => d.value > 0);

  const orderData =
    stats?.recent_orders?.map((order, i) => ({
      name: `Day ${i + 1}`,
      revenue: order.total,
    })) || [];

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Admin Dashboard...
      </div>
    );
  }

  // ================= UI =================
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-6">
          <Shield className="text-primary" />
          Admin Dashboard
        </h1>

        {/* STATS */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card><CardContent className="p-4"><p>Users</p><h2 className="text-2xl font-bold">{stats?.users_count}</h2></CardContent></Card>
          <Card><CardContent className="p-4"><p>Orders</p><h2 className="text-2xl font-bold">{stats?.orders_count}</h2></CardContent></Card>
          <Card><CardContent className="p-4"><p>Revenue</p><h2 className="text-2xl font-bold">₹{stats?.total_revenue}</h2></CardContent></Card>
          <Card><CardContent className="p-4"><p>Pharmacies</p><h2 className="text-2xl font-bold">{pharmacies.length}</h2></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
            <TabsTrigger value="create">Create User</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#0066FF" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>User Roles</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={userRoleData} dataKey="value" label>
                        {userRoleData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u._id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Badge>{u.role}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          {/* PHARMACIES */}
          <TabsContent value="pharmacies">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pharmacies.map(p => (
                  <TableRow key={p._id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      {p.verified ? <Badge>Verified</Badge> : <Badge variant="outline">Pending</Badge>}
                    </TableCell>
                    <TableCell>
                      {!p.verified && (
                        <Button size="sm" onClick={() => handleVerifyPharmacy(p._id)}>
                          Verify
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          {/* CREATE USER */}
          <TabsContent value="create">
            <div className="max-w-md space-y-4">
              <Input placeholder="Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
              <Input placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
              <Input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />

              <Select value={newUser.role} onValueChange={value => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleCreateUser}>Create User</Button>
            </div>
          </TabsContent>

        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboardPage;
