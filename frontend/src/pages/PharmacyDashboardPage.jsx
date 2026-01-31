import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Store,
  Package,
  TrendingUp,
  Clock,
  DollarSign,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;
const PharmacyDashboardPage = () => {
  const { token } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);

  // ================= FETCH DATA =================

  const fetchData = async () => {
  if (!token) return;

  try {
    const [dashboardRes, ordersRes] = await Promise.all([
      axios.get(`${API_URL}/pharmacy/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${API_URL}/pharmacy/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    setDashboardData(dashboardRes.data);
    setOrders(ordersRes.data || []);
  } catch (error) {
    console.error(error);
    toast.error("Failed to load pharmacy data");
  } finally {
    setLoading(false);
  }
};
  // ✅ ONLY FETCH WHEN TOKEN EXISTS
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // ================= UPDATE ORDER STATUS =================

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Order updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update order");
    }
  };

  // ================= STATUS BADGE =================

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      out_for_delivery: "bg-cyan-100 text-cyan-800",
      delivered: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // ================= STATS SAFE FALLBACK =================

  const stats = dashboardData?.stats || {
    medicines_count: 0,
    total_orders: 0,
    pending_orders: 0,
    total_revenue: 0,
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Pharmacy Dashboard...
      </div>
    );
  }

  // ================= UI =================

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Store className="text-primary" />
            Pharmacy Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your pharmacy orders and inventory
          </p>
        </div>

        {/* ================= STATS ================= */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6 flex justify-between">
              <div>
                <p>Total Orders</p>
                <h2 className="text-3xl font-bold">{stats.total_orders}</h2>
              </div>
              <Package />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6 flex justify-between">
              <div>
                <p>Pending Orders</p>
                <h2 className="text-3xl font-bold">{stats.pending_orders}</h2>
              </div>
              <Clock />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6 flex justify-between">
              <div>
                <p>Total Revenue</p>
                <h2 className="text-3xl font-bold">
                  ₹{stats.total_revenue.toFixed(0)}
                </h2>
              </div>
              <DollarSign />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white">
            <CardContent className="p-6 flex justify-between">
              <div>
                <p>Medicines</p>
                <h2 className="text-3xl font-bold">{stats.medicines_count}</h2>
              </div>
              <TrendingUp />
            </CardContent>
          </Card>
        </div>

        {/* ================= TABS ================= */}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          {/* ================= OVERVIEW ================= */}

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>

              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="mx-auto mb-2" />
                    No orders yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {orders.slice(0, 5).map((order) => (
                        <TableRow key={order._id}>
                          <TableCell>
                            {order._id.slice(0, 8)}...
                          </TableCell>

                          <TableCell>{order.items.length}</TableCell>

                          <TableCell>
                            ₹{order.total.toFixed(2)}
                          </TableCell>

                          <TableCell>
                            <Badge
                              className={getStatusBadge(order.order_status)}
                            >
                              {order.order_status.replace("_", " ")}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {order.order_status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdateOrderStatus(order._id, "confirmed")
                                }
                              >
                                Confirm
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= ALL ORDERS ================= */}

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell>
                          {order._id.slice(0, 8)}...
                        </TableCell>

                        {/* SAFE USER DISPLAY */}
                        <TableCell>
                          {order.user?._id
                            ? order.user._id.slice(0, 8)
                            : order.user?.slice(0, 8)}
                        </TableCell>

                        <TableCell>
                          ₹{order.total.toFixed(2)}
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={getStatusBadge(order.order_status)}
                          >
                            {order.order_status.replace("_", " ")}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>

                        <TableCell>
                          <Eye size={18} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= INVENTORY ================= */}

          <TabsContent value="inventory">
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Inventory Management</h3>
                <p className="text-muted-foreground mb-4">
                  Add and manage medicines
                </p>
                <Button onClick={() => setShowAddMedicineModal(true)}>Add Medicine</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
{showAddMedicineModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Add Medicine</h2>
      {/* Add your form fields here */}
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => setShowAddMedicineModal(false)}
      >
        Close
      </button>
    </div>
  </div>
)}
      <Footer />
    </div>
  );
};

export default PharmacyDashboardPage;
