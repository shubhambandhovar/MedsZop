import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
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
        { headers: { Authorization: `Bearer ${token}` } },
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



  // ================= UI =================

  // ================= MEDICINE FORM STATE =================
  const [medicineForm, setMedicineForm] = useState({
    name: "",
    genericName: "",
    company: "",
    mrp: "",
    price: "",
    discount: 0,
    description: "",
    image: ""
  });

  const handleMedicineChange = (e) => {
    const { name, value } = e.target;
    setMedicineForm((prev) => {
      const newData = { ...prev, [name]: value };

      // Auto-calculate discount
      if (name === "mrp" || name === "price") {
        const m = name === "mrp" ? parseFloat(value) : parseFloat(prev.mrp);
        const p = name === "price" ? parseFloat(value) : parseFloat(prev.price);

        if (m && p && m > p) {
          newData.discount = Math.round(((m - p) / m) * 100);
        } else {
          newData.discount = 0;
        }
      }
      return newData;
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedicineForm((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMedicineSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/pharmacy/add-medicine`, medicineForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Medicine Added Successfully!");
      setShowAddMedicineModal(false);
      fetchData();
      setMedicineForm({
        name: "",
        genericName: "",
        company: "",
        mrp: "",
        price: "",
        discount: 0,
        description: "",
        image: ""
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add medicine");
    }
  };

  // ================= UI =================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Pharmacy Dashboard...
      </div>
    );
  }

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
                          <TableCell>{order._id.slice(0, 8)}...</TableCell>

                          <TableCell>{order.items.length}</TableCell>

                          <TableCell>₹{order.total.toFixed(2)}</TableCell>

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
                                  handleUpdateOrderStatus(
                                    order._id,
                                    "confirmed",
                                  )
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
                        <TableCell>{order._id.slice(0, 8)}...</TableCell>

                        {/* SAFE USER DISPLAY */}
                        <TableCell>
                          {order.user?._id
                            ? order.user._id.slice(0, 8)
                            : order.user?.slice(0, 8)}
                        </TableCell>

                        <TableCell>₹{order.total.toFixed(2)}</TableCell>

                        <TableCell>
                          <Badge className={getStatusBadge(order.order_status)}>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Inventory Management</CardTitle>
                <Button onClick={() => setShowAddMedicineModal(true)}>
                  <Package className="h-4 w-4 mr-2" />
                  Add Medicine
                </Button>
              </CardHeader>
              <CardContent>
                {!dashboardData?.medicines || dashboardData.medicines.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold">No Medicines Added</h3>
                    <p className="text-muted-foreground mb-4">Start by adding medicines to your inventory.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>MRP</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.medicines.map((med) => (
                        <TableRow key={med._id}>
                          <TableCell>
                            {med.image ? (
                              <img src={med.image} alt={med.name} className="h-10 w-10 object-contain rounded-md bg-white border" />
                            ) : (
                              <div className="h-10 w-10 bg-slate-100 rounded-md flex items-center justify-center">
                                <Package className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{med.name}</span>
                              <span className="text-xs text-muted-foreground">{med.genericName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{med.company || "-"}</TableCell>
                          <TableCell className="font-bold text-emerald-600">₹{med.price}</TableCell>
                          <TableCell className="text-muted-foreground line-through">₹{med.mrp || med.price}</TableCell>
                          <TableCell>
                            {med.discount > 0 ? (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                                {med.discount}% Off
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={med.inStock ? "outline" : "destructive"}>
                              {med.inStock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ================= ADD MEDICINE MODAL ================= */}
      {showAddMedicineModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-heading">Add Medicine</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddMedicineModal(false)}
              >
                X
              </Button>
            </div>

            <form onSubmit={handleMedicineSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Medicine Name *</label>
                  <input
                    name="name"
                    value={medicineForm.name}
                    onChange={handleMedicineChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    placeholder="e.g. Dolo 650"
                    required
                  />
                </div>
                {/* Generic Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Generic Name</label>
                  <input
                    name="genericName"
                    value={medicineForm.genericName}
                    onChange={handleMedicineChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    placeholder="e.g. Paracetamol"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Manufacturer / Company</label>
                  <input
                    name="company"
                    value={medicineForm.company}
                    onChange={handleMedicineChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    placeholder="e.g. Micro Labs"
                  />
                </div>
                {/* Price Calculation Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">MRP (₹)</label>
                    <input
                      name="mrp"
                      type="number"
                      value={medicineForm.mrp}
                      onChange={handleMedicineChange}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selling Price (₹) *</label>
                    <input
                      name="price"
                      type="number"
                      value={medicineForm.price}
                      onChange={handleMedicineChange}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Discount (%)</label>
                  <span className="text-sm font-bold text-emerald-600">{medicineForm.discount}% Off</span>
                </div>
                <input
                  name="discount"
                  type="number"
                  value={medicineForm.discount}
                  readOnly
                  className="w-full h-10 px-3 rounded-md border border-input bg-slate-100 cursor-not-allowed"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  value={medicineForm.description}
                  onChange={handleMedicineChange}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                  placeholder="Medicine details, dosage, usage..."
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Medicine Image</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {medicineForm.image ? (
                    <img src={medicineForm.image} alt="Preview" className="h-24 mx-auto object-contain" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Package className="h-8 w-8 text-slate-400 mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload image</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddMedicineModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Save Medicine
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default PharmacyDashboardPage;
