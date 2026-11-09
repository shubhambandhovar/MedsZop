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
  LogOut,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Loader2
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

  const [showImageModal, setShowImageModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'uploading', 'success', 'error'
  const [uploadResult, setUploadResult] = useState(null); // { added, updated, skipped, errors }

  // Selection States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

  // Authenticated Blob State for Prescriptions (Phase 9B.1 / SEC-04)
  const [rxBlobUrl, setRxBlobUrl] = useState(null);
  const [loadingRxBlob, setLoadingRxBlob] = useState(false);
  const [rxBlobError, setRxBlobError] = useState(false);
  const [isPdf, setIsPdf] = useState(false);

  // Authenticated Blob Fetching for Prescription Preview
  // Uses Authorization header to fetch file binary, avoiding any token exposure in URLs.
  useEffect(() => {
    let objectUrl = null;
    let isCancelled = false;

    if (selectedOrder?.prescription_url && token) {
      setLoadingRxBlob(true);
      setRxBlobError(false);

      const normalized = selectedOrder.prescription_url.replace(/\\/g, "/");
      const url = normalized.startsWith("http") ? normalized : `${API_URL}/${normalized}`;
      const isPdfFile = normalized.toLowerCase().endsWith(".pdf");
      setIsPdf(isPdfFile);

      axios
        .get(url, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob"
        })
        .then((res) => {
          if (!isCancelled) {
            objectUrl = URL.createObjectURL(res.data);
            setRxBlobUrl(objectUrl);
          } else {
            URL.revokeObjectURL(URL.createObjectURL(res.data));
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            console.error("Prescription preview fetch error:", err);
            setRxBlobError(true);
            setRxBlobUrl(null);
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setLoadingRxBlob(false);
          }
        });
    } else {
      setRxBlobUrl(null);
      setIsPdf(false);
    }

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedOrder?.prescription_url, token]);

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
      const interval = setInterval(fetchData, 5000); // Auto-refresh every 5 seconds
      return () => clearInterval(interval);
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
    if (statusFilter === "pending") return order.order_status === "pending" || order.order_status === "cod_confirmed";
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
    category: "",
    company: "",
    manufacturer: "",
    mrp: "",
    price: "",
    stock: "",
    expiryDate: "",
    batchNumber: "",
    discount: 0,
    description: "",
    image: "",
    inStock: true,
    requiresPrescription: false
  });

  const resetForm = () => {
    setMedicineForm({
      id: "",
      name: "",
      genericName: "",
      category: "",
      company: "",
      manufacturer: "",
      mrp: "",
      price: "",
      stock: "",
      expiryDate: "",
      batchNumber: "",
      discount: 0,
      description: "",
      image: "",
      inStock: true,
      requiresPrescription: false
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
        setMedicineForm((prev) => ({ ...prev, image: reader.result, isAutoImage: false }));
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
      category: med.category || "",
      company: med.company || "",
      manufacturer: med.manufacturer || "",
      mrp: med.mrp || "",
      price: med.price,
      stock: med.stock || "",
      expiryDate: med.expiryDate ? new Date(med.expiryDate).toISOString().split('T')[0] : "",
      batchNumber: med.batchNumber || "",
      discount: med.discount || 0,
      description: med.description || "",
      image: med.image || "",
      inStock: med.inStock,
      requiresPrescription: med.requiresPrescription || false,
      isAutoImage: med.isAutoImage || false
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

  // ================= BULK UPLOAD LOGIC =================
  const handleDownloadTemplate = () => {
    const headers = "medicine_name,brand_name,composition,category,mrp,selling_price,stock_quantity,expiry_date,batch_number,manufacturer,prescription_required";
    const sample = "Paracetamol 650,Dolo,Paracetamol,Fever,30,25,100,2025-12-31,BATCH123,Micro Labs,No";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sample;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "medszop_medicine_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    if (!file) return toast.error("Please select a CSV file");

    const formData = new FormData();
    formData.append("file", file);

    setUploadStatus("uploading");
    setUploadResult(null);

    try {
      const res = await axios.post(`${API_URL}/pharmacy/medicines/bulk-upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setUploadResult(res.data.summary);
      setUploadStatus("success");
      toast.success("Bulk upload processed!");
      fetchData(); // Refresh inventory
    } catch (err) {
      console.error(err);
      setUploadStatus("error");
      toast.error(err.response?.data?.message || "Upload failed");
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadStatus(null);
    setUploadResult(null);
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-3 text-foreground tracking-tight" data-testid="pharmacy-dashboard-title">
              <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary">
                <Store className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              Pharmacy Dashboard
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Manage incoming pharmacy orders, medicine catalog, and dispensing status.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              size="sm"
              onClick={() => setShowAddMedicineModal(true)}
              className="rounded-xl h-9 px-3.5 text-xs font-semibold gap-1.5 shadow-xs active-press"
            >
              <Package className="h-3.5 w-3.5" />
              Add Medicine
            </Button>
          </div>
        </div>

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 mb-8">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Orders</p>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tabular-nums mt-0.5">
                  {stats.total_orders}
                </h2>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Package className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Pending Orders</p>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
                  {stats.pending_orders}
                </h2>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Revenue</p>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                  ₹{stats.total_revenue.toFixed(0)}
                </h2>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Active Medicines</p>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tabular-nums mt-0.5">
                  {stats.medicines_count}
                </h2>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= TABS ================= */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid w-full sm:w-[380px] grid-cols-3 h-11 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
            <TabsTrigger value="overview" className="rounded-xl text-xs sm:text-sm font-semibold">Overview</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl text-xs sm:text-sm font-semibold">Orders</TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-xl text-xs sm:text-sm font-semibold">Inventory</TabsTrigger>
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
                              <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
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
                            <span className="text-xs text-muted-foreground">{order.address?.mobile || order.address?.phone || "No Phone"}</span>
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

                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>

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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowUploadModal(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Button>
                  <Button onClick={() => { resetForm(); setShowAddMedicineModal(true); }}>
                    <Package className="h-4 w-4 mr-2" />
                    Add Medicine
                  </Button>
                </div>
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
                              <Button size="icon" variant="ghost" aria-label="Edit medicine" onClick={() => handleEditClick(med)}>
                                <Edit className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button size="icon" variant="ghost" aria-label="Delete medicine" onClick={() => handleDeleteMedicine(med._id)}>
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


        </Tabs>
      </main>

      {/* ================= ORDER DETAILS MODAL ================= */}
      <Dialog open={showOrderDetailsModal} onOpenChange={setShowOrderDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details #{selectedOrder?.orderNumber || selectedOrder?._id?.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              Created on {selectedOrder && new Date(selectedOrder.createdAt).toLocaleString()}
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
                  {["pending", "cod_confirmed"].includes(selectedOrder.order_status) && (
                    <>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleUpdateOrderStatus(selectedOrder._id, "confirmed")}>Confirm Order</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleUpdateOrderStatus(selectedOrder._id, "cancelled")}>Cancel Order</Button>
                    </>
                  )}



                </div>
              </div>

              {/* Prescription Verification Section */}
              {selectedOrder.prescription_url && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h3 className="font-semibold text-amber-900 flex items-center mb-3">
                    <FileText className="h-5 w-5 mr-2" />
                    Prescription Verification Required
                  </h3>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => {
                        if (rxBlobUrl) {
                          setShowImageModal(true);
                        }
                      }}
                    >
                      {loadingRxBlob ? (
                        <div className="h-32 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg border flex flex-col items-center justify-center text-muted-foreground shadow-sm animate-pulse">
                          <Loader2 className="h-6 w-6 animate-spin mb-1 text-primary" />
                          <span className="text-[11px] font-medium">Loading Rx...</span>
                        </div>
                      ) : rxBlobError ? (
                        <div className="h-32 w-32 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 flex flex-col items-center justify-center text-red-600 dark:text-red-400 p-2 text-center shadow-sm">
                          <AlertTriangle className="h-6 w-6 mb-1" />
                          <span className="text-[10px] font-semibold leading-tight">Access Denied or Not Found</span>
                        </div>
                      ) : isPdf ? (
                        <div className="h-32 w-32 bg-white dark:bg-slate-900 rounded-lg border flex flex-col items-center justify-center text-red-500 shadow-sm hover:shadow-md transition-shadow">
                          <FileText className="h-12 w-12 mb-2" />
                          <span className="text-xs font-bold uppercase">View PDF</span>
                        </div>
                      ) : (
                        <div className="relative overflow-hidden rounded-lg border shadow-sm h-32 w-32 bg-slate-100 dark:bg-slate-800">
                          {rxBlobUrl && (
                            <img
                              src={rxBlobUrl}
                              alt="Prescription"
                              className="h-32 w-32 object-cover transition-transform group-hover:scale-105"
                              onError={(e) => { e.target.src = "https://placehold.co/400?text=Error+Loading"; }}
                            />
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Eye className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 text-center font-medium">
                        {loadingRxBlob ? "Fetching Rx..." : rxBlobError ? "Failed" : "Click to Enlarge"}
                      </p>
                    </div>

                    <div className="flex-1 space-y-3">
                      <p className="text-sm text-amber-800">
                        Please verify that the prescription matches the ordered medicines and is valid.
                      </p>

                      {selectedOrder.order_status === "pending_verification" && (
                        <div className="flex gap-3 pt-2">
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            onClick={() => handleUpdateOrderStatus(selectedOrder._id, "confirmed")}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve & Confirm
                          </Button>
                          <Button
                            variant="destructive"
                            className="gap-2"
                            onClick={() => handleUpdateOrderStatus(selectedOrder._id, "cancelled")} // Using cancelled to trigger email
                          >
                            <XCircle className="h-4 w-4" />
                            Reject Order
                          </Button>
                        </div>
                      )}
                      {selectedOrder.order_status === "confirmed" && (
                        <p className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Prescription Verified & Accepted
                        </p>
                      )}
                      {selectedOrder.order_status === "cancelled" && (
                        <p className="text-sm font-bold text-red-600 flex items-center gap-2">
                          <XCircle className="h-4 w-4" /> Order Rejected
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}


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
      {
        (showAddMedicineModal || showEditMedicineModal) && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-3 sm:p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-foreground">{showEditMedicineModal ? "Edit Medicine" : "Add New Medicine"}</h2>
                <Button variant="ghost" size="icon" aria-label="Close modal" className="h-8 w-8 rounded-full" onClick={() => { setShowAddMedicineModal(false); setShowEditMedicineModal(false); }}>✕</Button>
              </div>

              <form onSubmit={showEditMedicineModal ? handleEditSubmit : handleAddSubmit} className="space-y-4">
                {/* NAME & GENERIC */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Medicine Name *</label>
                    <input name="name" value={medicineForm.name} onChange={handleMedicineChange} className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Generic Name</label>
                    <input name="genericName" value={medicineForm.genericName} onChange={handleMedicineChange} className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm" />
                  </div>
                </div>

                {/* DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Company</label>
                    <input name="company" value={medicineForm.company} onChange={handleMedicineChange} className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">MRP (₹)</label>
                      <input name="mrp" type="number" value={medicineForm.mrp} onChange={handleMedicineChange} className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Price (₹) *</label>
                      <input name="price" type="number" value={medicineForm.price} onChange={handleMedicineChange} className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm" required />
                    </div>
                  </div>
                </div>

                {/* EXTRA DETAILS 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Category</label>
                    <input name="category" value={medicineForm.category} onChange={handleMedicineChange} className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm" placeholder="e.g. tablet, syrup" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Manufacturer</label>
                    <input name="manufacturer" value={medicineForm.manufacturer} onChange={handleMedicineChange} className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm" />
                  </div>
                </div>

                {/* EXTRA DETAILS 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Stock Qty *</label>
                    <input name="stock" type="number" value={medicineForm.stock} onChange={handleMedicineChange} className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Batch No.</label>
                    <input name="batchNumber" value={medicineForm.batchNumber} onChange={handleMedicineChange} className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Expiry Date</label>
                    <input name="expiryDate" type="date" value={medicineForm.expiryDate} onChange={handleMedicineChange} className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-foreground text-sm" />
                  </div>
                </div>

                {/* TOGGLES */}
                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-foreground">
                    <input type="checkbox" name="inStock" checked={medicineForm.inStock} onChange={handleMedicineChange} className="w-4 h-4 rounded text-primary" />
                    <span className="text-xs sm:text-sm font-semibold">In Stock</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-foreground">
                    <input type="checkbox" name="requiresPrescription" checked={medicineForm.requiresPrescription} onChange={handleMedicineChange} className="w-4 h-4 rounded text-primary" />
                    <span className="text-xs sm:text-sm font-semibold">Requires Prescription</span>
                  </label>

                  <div className="flex-1 text-right text-xs sm:text-sm font-bold text-emerald-600">
                    {medicineForm.discount}% Calculated Discount
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Description</label>
                  <textarea name="description" value={medicineForm.description} onChange={handleMedicineChange} className="w-full min-h-[80px] p-3 rounded-xl border border-input bg-background text-foreground text-sm" />
                </div>

                {/* IMAGE */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex justify-between">
                    Image
                    {medicineForm.isAutoImage && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-[10px] ml-2">
                        ✨ Auto-added image
                      </Badge>
                    )}
                  </label>
                  <p className="text-[11px] text-muted-foreground mb-1">
                    If left empty, system auto-assigns relevant image.
                  </p>
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center cursor-pointer relative hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    {medicineForm.image ? (
                      <div className="relative inline-block">
                        <img src={medicineForm.image} alt="Preview" className="h-20 mx-auto object-contain rounded-lg" />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Click to upload medicine image</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <Button type="button" variant="outline" className="flex-1 rounded-xl h-11 text-xs sm:text-sm" onClick={() => { setShowAddMedicineModal(false); setShowEditMedicineModal(false); }}>Cancel</Button>
                  <Button type="submit" className="flex-1 rounded-xl h-11 text-xs sm:text-sm font-bold active-press">{showEditMedicineModal ? "Update Medicine" : "Save Medicine"}</Button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* ================= IMAGE MODAL ================= */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl h-[90vh] flex items-center justify-center bg-zinc-950/90 border-zinc-800 p-0 overflow-hidden relative">
          <Button
            className="absolute top-4 right-4 z-50 rounded-full bg-black/50 hover:bg-black/80 text-white border-none"
            size="icon"
            aria-label="Close image preview"
            onClick={() => setShowImageModal(false)}
          >
            <XCircle className="h-6 w-6" />
          </Button>
          {rxBlobUrl ? (
            isPdf ? (
              <iframe src={rxBlobUrl} className="w-full h-full" title="Prescription PDF" />
            ) : (
              <img src={rxBlobUrl} alt="Prescription" className="max-w-full max-h-full object-contain" />
            )
          ) : (
            <div className="text-white text-sm">No preview available</div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= BULK UPLOAD MODAL ================= */}
      <Dialog open={showUploadModal} onOpenChange={(open) => !open && closeUploadModal()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Medicines</DialogTitle>
            <DialogDescription>
              Add multiple medicines at once using a CSV file. <br />
              <span className="text-purple-600 font-medium text-xs">✨ Images will be auto-fetched for medicines without images!</span>
            </DialogDescription>
          </DialogHeader>

          {!uploadStatus || uploadStatus === 'uploading' || uploadStatus === 'error' ? (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-sm">Download Template</h3>
                  <p className="text-xs text-muted-foreground">Use this template to format your CSV correctly.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" /> Download CSV
                </Button>
              </div>

              <form onSubmit={handleBulkUpload} className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                  <FileSpreadsheet className="h-10 w-10 mx-auto text-green-500 mb-3" />
                  <label className="block text-sm font-medium mb-1">Upload CSV File</label>
                  <input type="file" name="file" accept=".csv" required className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-violet-50 file:text-violet-700
                      hover:file:bg-violet-100
                    "/>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={closeUploadModal}>Cancel</Button>
                  <Button type="submit" disabled={uploadStatus === 'uploading'}>
                    {uploadStatus === 'uploading' ? 'Processing...' : 'Upload & Process'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <h2 className="text-xl font-bold">Upload Complete</h2>
                <p className="text-muted-foreground">Here is the summary of your upload.</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{uploadResult.added}</p>
                  <p className="text-xs font-semibold uppercase text-green-700">Added</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{uploadResult.updated}</p>
                  <p className="text-xs font-semibold uppercase text-blue-700">Updated</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{uploadResult.skipped}</p>
                  <p className="text-xs font-semibold uppercase text-yellow-700">Skipped</p>
                </div>
              </div>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2 text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Errors / Skipped Rows
                  </h4>
                  <div className="bg-red-50 p-3 rounded-lg max-h-40 overflow-y-auto text-sm space-y-1">
                    {uploadResult.errors.map((err, i) => (
                      <p key={i} className="text-red-700 flex items-start gap-2">
                        <span className="mt-1">•</span> {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={closeUploadModal}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog >

      <Footer />
    </div >
  );
};

export default PharmacyDashboardPage;
