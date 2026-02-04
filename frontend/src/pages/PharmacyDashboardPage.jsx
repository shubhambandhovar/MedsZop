import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
  Trash2,
  Edit,
  Filter,
  User,
  MapPin,
  Phone,
  FileText,
  Settings,
  ShieldCheck,
  LogOut
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "../components/ui/dialog";

const API_URL = import.meta.env.VITE_API_URL;

const PharmacyDashboardPage = () => {
  const { token, logout, user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Filter States
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [showEditMedicineModal, setShowEditMedicineModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false); // For prescriptions

  // Selection States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

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

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // ================= ORDERS LOGIC =================

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success(`Order marked as ${status.replace("_", " ")}`);
      fetchData();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, order_status: status }));
      }
    } catch (error) {
      toast.error("Failed to update order");
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === "all") return true;
    return order.order_status === statusFilter;
  });

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  // ================= MEDICINE FORM STATE & LOGIC =================
  const [medicineForm, setMedicineForm] = useState({
    id: "", // For edit
    name: "",
    genericName: "",
    company: "",
    mrp: "",
    price: "",
    discount: 0,
    description: "",
    image: "",
    inStock: true
  });

  const resetForm = () => {
    setMedicineForm({
      id: "",
      name: "",
      genericName: "",
      company: "",
      mrp: "",
      price: "",
      discount: 0,
      description: "",
      image: "",
      inStock: true
    });
  };

  const handleMedicineChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMedicineForm((prev) => {
      const val = type === "checkbox" ? checked : value;
      const newData = { ...prev, [name]: val };

      // Auto-calculate discount
      if (name === "mrp" || name === "price") {
        const m = name === "mrp" ? parseFloat(val) : parseFloat(prev.mrp);
        const p = name === "price" ? parseFloat(val) : parseFloat(prev.price);

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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/pharmacy/add-medicine`, medicineForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Medicine Added Successfully!");
      setShowAddMedicineModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error("Failed to add medicine");
    }
  };

  const handleEditClick = (med) => {
    setMedicineForm({
      id: med._id,
      name: med.name,
      genericName: med.genericName || "",
      company: med.company || "",
      mrp: med.mrp || "",
      price: med.price,
      discount: med.discount || 0,
      description: med.description || "",
      image: med.image || "",
      inStock: med.inStock
    });
    setShowEditMedicineModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/pharmacy/medicine/${medicineForm.id}`, medicineForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Medicine Updated!");
      setShowEditMedicineModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error("Failed to update medicine");
    }
  };

  const handleDeleteMedicine = async (id) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;
    try {
      await axios.delete(`${API_URL}/pharmacy/medicine/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Medicine Deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete medicine");
    }
  };


  // ================= PROFILE LOGIC =================
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    address: "",
    license_number: ""
  });

  // Load profile data on mount/tab change
  useEffect(() => {
    if (activeTab === "settings" && dashboardData) {
      // Since dashboard loads pharmacy data, currently dashboardData has .medicines. 
      // We might need to fetch profile explicitly or assume name is from user/dashboard
      // For now, let's use what we have, or re-fetch dashboard.
      // Actually dashboardData isn't the pharmacy PROFILE, it's stats.
      // But dashboard endpoint *creates* the profile if missing.
      // Let's assume the user knows their details. 
      // Ideally we fetch GET /pharmacy/profile but dashboard endpoint doesn't return address/license currently.
      // I'll stick to basic editing.
    }
  }, [activeTab]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/pharmacy/profile`, profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Profile Updated");
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };


  // ================= UTILS =================
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

  const stats = dashboardData?.stats || {
    medicines_count: 0,
    total_orders: 0,
    pending_orders: 0,
    total_revenue: 0,
  };


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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Store className="text-primary" />
              Pharmacy Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your pharmacy orders and inventory
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setActiveTab("settings")}>
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
          </div>
        </div>

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6 flex justify-between">
              <div>
                <p className="text-blue-100">Total Orders</p>
                <h2 className="text-3xl font-bold">{stats.total_orders}</h2>
              </div>
              <Package className="text-blue-200 w-8 h-8" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6 flex justify-between">
              <div>
                <p className="text-amber-100">Pending Orders</p>
                <h2 className="text-3xl font-bold">{stats.pending_orders}</h2>
              </div>
              <Clock className="text-amber-200 w-8 h-8" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6 flex justify-between">
              <div>
                <p className="text-emerald-100">Total Revenue</p>
                <h2 className="text-3xl font-bold">₹{stats.total_revenue.toFixed(0)}</h2>
              </div>
              <DollarSign className="text-emerald-200 w-8 h-8" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white">
            <CardContent className="p-6 flex justify-between">
              <div>
                <p className="text-violet-100">Medicines</p>
                <h2 className="text-3xl font-bold">{stats.medicines_count}</h2>
              </div>
              <TrendingUp className="text-violet-200 w-8 h-8" />
            </CardContent>
          </Card>
        </div>

        {/* ================= TABS ================= */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid w-full md:w-auto grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* ================= OVERVIEW ================= */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No recent activity</div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map(order => (
                        <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">New Order #{order.orderNumber ? order.orderNumber.split('-')[1] : order._id.slice(-6)}</p>
                              <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₹{order.total}</p>
                            <Badge className={getStatusBadge(order.order_status)} variant="secondary">{order.order_status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" onClick={() => setShowAddMedicineModal(true)}>
                    <Package className="mr-2 h-4 w-4" /> Add Medicine
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('orders')}>
                    <Clock className="mr-2 h-4 w-4" /> View Pending Orders
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('settings')}>
                    <User className="mr-2 h-4 w-4" /> Update Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ================= ORDERS ================= */}
          <TabsContent value="orders">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Orders Management</CardTitle>
                  <CardDescription>View and manage all your customer orders</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                          No orders found matching this filter.
                        </TableCell>
                      </TableRow>
                    ) : filteredOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-mono">{order.orderNumber || order._id.slice(0, 8)}</TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{order.address?.name || "Customer"}</span>
                            <span className="text-xs text-muted-foreground">{order.address?.phone || "No Phone"}</span>
                          </div>
                        </TableCell>

                        <TableCell>₹{order.total.toFixed(2)}</TableCell>

                        <TableCell>
                          <Badge variant="outline" className="uppercase text-[10px]">
                            {order.payment_method}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge className={getStatusBadge(order.order_status)}>
                            {order.order_status.replace("_", " ")}
                          </Badge>
                        </TableCell>

                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>

                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => openOrderDetails(order)}>
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
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
                <div>
                  <CardTitle>Inventory</CardTitle>
                  <CardDescription>Track stock, update prices, and manage medicines</CardDescription>
                </div>
                <Button onClick={() => { resetForm(); setShowAddMedicineModal(true); }}>
                  <Package className="h-4 w-4 mr-2" />
                  Add Medicine
                </Button>
              </CardHeader>
              <CardContent>
                {!dashboardData?.medicines || dashboardData.medicines.length === 0 ? (
                  <div className="text-center py-16">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold">Empty Inventory</h3>
                    <p className="text-muted-foreground mb-4">Start by adding medicines to your inventory.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Details</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.medicines.map((med) => (
                        <TableRow key={med._id}>
                          <TableCell>
                            <div className="flex gap-3">
                              {med.image ? (
                                <img src={med.image} alt={med.name} className="h-10 w-10 object-contain rounded border" />
                              ) : (
                                <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold">{med.name}</p>
                                <p className="text-xs text-muted-foreground">{med.company || "Generic"}</p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-emerald-600">₹{med.price}</span>
                              {med.mrp > med.price && <span className="text-xs line-through text-muted-foreground">₹{med.mrp}</span>}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant={med.inStock ? "outline" : "destructive"}>
                              {med.inStock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="icon" variant="ghost" onClick={() => handleEditClick(med)}>
                                <Edit className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteMedicine(med._id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= SETTINGS ================= */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Pharmacy Profile</CardTitle>
                <CardDescription>Manage your pharmacy details and visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-xl">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pharmacy Name</label>
                    <input
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location / Address</label>
                    <textarea
                      className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="Full Store Address..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">License Number</label>
                    <input
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={profileForm.license_number}
                      onChange={(e) => setProfileForm(p => ({ ...p, license_number: e.target.value }))}
                      placeholder="DL No. / Registration No."
                    />
                  </div>

                  <Button type="submit">
                    Save Changes
                  </Button>
                </form>

                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-3 flex items-center text-red-600">
                    <ShieldCheck className="mr-2" /> Security
                  </h3>
                  <Button variant="destructive" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout from Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>

      {/* ================= ORDER DETAILS MODAL ================= */}
      <Dialog open={showOrderDetailsModal} onOpenChange={setShowOrderDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details #{selectedOrder?.orderNumber || selectedOrder?._id?.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              Created on {selectedOrder && new Date(selectedOrder.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium mb-1">Current Status</p>
                  <Badge className={getStatusBadge(selectedOrder.order_status)}>{selectedOrder.order_status.replace('_', ' ')}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {selectedOrder.order_status === "pending" && (
                    <Button size="sm" onClick={() => handleUpdateOrderStatus(selectedOrder._id, "confirmed")}>Confirm Order</Button>
                  )}
                  {selectedOrder.order_status === "confirmed" && (
                    <Button size="sm" onClick={() => handleUpdateOrderStatus(selectedOrder._id, "out_for_delivery")}>Send for Delivery</Button>
                  )}
                  {selectedOrder.order_status === "out_for_delivery" && (
                    <Button size="sm" onClick={() => handleUpdateOrderStatus(selectedOrder._id, "delivered")}>Mark Delivered</Button>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center"><User className="w-4 h-4 mr-2" /> Customer</h3>
                  <div className="p-3 border rounded-md">
                    <p className="font-medium">{selectedOrder.address?.name || "Guest"}</p>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Phone className="w-3 h-3 mr-1" /> {selectedOrder.address?.phone || selectedOrder.address?.mobile || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center"><MapPin className="w-4 h-4 mr-2" /> Delivery Address</h3>
                  <div className="p-3 border rounded-md text-sm text-muted-foreground">
                    <p>{selectedOrder.address?.addressLine1}</p>
                    <p>{selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <Table>
                  <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Price</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>x{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.price * item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end mt-4">
                  <p className="text-xl font-bold">Total: ₹{selectedOrder.total}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= MEDICINE MODALS (Add/Edit) ================= */}
      {/* ADD/EDIT MODAL REUSED */}
      {(showAddMedicineModal || showEditMedicineModal) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-heading">{showEditMedicineModal ? "Edit Medicine" : "Add Medicine"}</h2>
              <Button variant="ghost" size="icon" onClick={() => { setShowAddMedicineModal(false); setShowEditMedicineModal(false); }}>X</Button>
            </div>

            <form onSubmit={showEditMedicineModal ? handleEditSubmit : handleAddSubmit} className="space-y-4">
              {/* NAME & GENERIC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Medicine Name *</label>
                  <input name="name" value={medicineForm.name} onChange={handleMedicineChange} className="w-full h-10 px-3 rounded-md border" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Generic Name</label>
                  <input name="genericName" value={medicineForm.genericName} onChange={handleMedicineChange} className="w-full h-10 px-3 rounded-md border" />
                </div>
              </div>

              {/* DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company</label>
                  <input name="company" value={medicineForm.company} onChange={handleMedicineChange} className="w-full h-10 px-3 rounded-md border" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">MRP</label>
                    <input name="mrp" type="number" value={medicineForm.mrp} onChange={handleMedicineChange} className="w-full h-10 px-3 rounded-md border" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price *</label>
                    <input name="price" type="number" value={medicineForm.price} onChange={handleMedicineChange} className="w-full h-10 px-3 rounded-md border" required />
                  </div>
                </div>
              </div>

              {/* TOGGLES */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="inStock" checked={medicineForm.inStock} onChange={handleMedicineChange} className="w-4 h-4" />
                  <span className="text-sm font-medium">In Stock</span>
                </label>
                <div className="flex-1 text-right text-sm font-bold text-emerald-600">
                  {medicineForm.discount}% Discount Apply
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea name="description" value={medicineForm.description} onChange={handleMedicineChange} className="w-full min-h-[80px] px-3 py-2 rounded-md border" />
              </div>

              {/* IMAGE */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Image</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer relative hover:bg-muted/50">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  {medicineForm.image ? (
                    <img src={medicineForm.image} alt="Preview" className="h-20 mx-auto object-contain" />
                  ) : (
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowAddMedicineModal(false); setShowEditMedicineModal(false); }}>Cancel</Button>
                <Button type="submit" className="flex-1">{showEditMedicineModal ? "Update" : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= IMAGE MODAL ================= */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent>
          {previewImage && <img src={previewImage} alt="Prescription" className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default PharmacyDashboardPage;
