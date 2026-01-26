import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
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

  // fallback safety
  const authToken = token || localStorage.getItem("token");

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // ---------------- FETCH DATA ----------------

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
      console.error("Admin fetch error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Only fetch when token exists
  useEffect(() => {
  if (authToken) {
    fetchData();
  }
}, []);

  // ---------------- VERIFY PHARMACY ----------------

  const handleVerifyPharmacy = async (pharmacyId) => {
    try {
      await axios.put(
        `${API_URL}/admin/pharmacies/${pharmacyId}/verify`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      toast.success("Pharmacy verified!");
      fetchData();

    } catch (error) {
      toast.error("Verification failed");
    }
  };

  // ---------------- CHART DATA ----------------

  const COLORS = ["#0066FF", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];

  const userRoleData = [
    { name: "Customers", value: users.filter(u => u.role === "customer").length },
    { name: "Pharmacies", value: users.filter(u => u.role === "pharmacy").length },
    { name: "Delivery", value: users.filter(u => u.role === "delivery").length },
    { name: "Admins", value: users.filter(u => u.role === "admin").length },
  ].filter(d => d.value > 0);

  const orderData =
    stats?.recent_orders?.slice(0, 7).map((order, index) => ({
      name: `Day ${index + 1}`,
      revenue: order.total,
    })) || [];

  // ---------------- LOADING SCREEN ----------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-medium">Loading Admin Dashboard...</p>
      </div>
    );
  }

  // ---------------- UI ----------------

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Platform overview and management
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6 flex justify-between">
              <div>
                <p className="text-blue-100 text-sm">Users</p>
                <p className="text-3xl font-bold">{stats?.users_count || 0}</p>
              </div>
              <Users className="h-10 w-10 text-blue-200" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white">
            <CardContent className="p-6 flex justify-between">
              <div>
                <p className="text-violet-100 text-sm">Pharmacies</p>
                <p className="text-3xl font-bold">{pharmacies.length}</p>
              </div>
              <Store className="h-10 w-10 text-violet-200" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6 flex justify-between">
              <div>
                <p className="text-amber-100 text-sm">Orders</p>
                <p className="text-3xl font-bold">{stats?.orders_count || 0}</p>
              </div>
              <Package className="h-10 w-10 text-amber-200" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6 flex justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Revenue</p>
                <p className="text-3xl font-bold">
                  ₹{(stats?.total_revenue || 0).toFixed(0)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-emerald-200" />
            </CardContent>
          </Card>

        </div>

        {/* TABS */}

        <Tabs value={activeTab} onValueChange={setActiveTab}>

          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}

          <TabsContent value="overview">

            <div className="grid lg:grid-cols-2 gap-6">

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#0066FF" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userRoleData}
                        dataKey="value"
                        outerRadius={100}
                        label
                      >
                        {userRoleData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

            </div>

          </TabsContent>

          {/* USERS TAB */}

          <TabsContent value="users">

            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user._id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Eye className="h-4 w-4" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>

                </Table>
              </CardContent>
            </Card>

          </TabsContent>

          {/* PHARMACY TAB */}

          <TabsContent value="pharmacies">

            <Card>
              <CardHeader>
                <CardTitle>Pharmacy Partners</CardTitle>
              </CardHeader>

              <CardContent>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {pharmacies.map(pharmacy => (
                      <TableRow key={pharmacy._id}>
                        <TableCell>{pharmacy.name}</TableCell>
                        <TableCell>{pharmacy.city}</TableCell>
                        <TableCell>
                          {pharmacy.verified ? (
                            <Badge className="bg-green-100 text-green-800">
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Pending
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          {!pharmacy.verified && (
                            <Button
                              size="sm"
                              onClick={() => handleVerifyPharmacy(pharmacy._id)}
                            >
                              Verify
                            </Button>
                          )}
                        </TableCell>

                      </TableRow>
                    ))}
                  </TableBody>

                </Table>

              </CardContent>
            </Card>

          </TabsContent>

        </Tabs>

      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboardPage;
