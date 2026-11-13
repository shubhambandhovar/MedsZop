import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import PharmacyNavbar from "../components/PharmacyNavbar";
import PharmacyFooter from "../components/PharmacyFooter";
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
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Loader2,
  Search,
  Building2,
  ThermometerSnowflake,
  FileCheck,
  Truck,
  ArrowUpDown,
  Plus,
  Boxes,
  ReceiptText,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Printer,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldAlert
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

  // Filter & Search States
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("all");
  const [inventoryStockFilter, setInventoryStockFilter] = useState("all");

  // Modals
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [showEditMedicineModal, setShowEditMedicineModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [showPackingChallanModal, setShowPackingChallanModal] = useState(false);

  const [showImageModal, setShowImageModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  // Selection States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [rxImageRotation, setRxImageRotation] = useState(0);
  const [rxImageZoom, setRxImageZoom] = useState(1);

  // Authenticated Blob State for Prescriptions
  const [rxBlobUrl, setRxBlobUrl] = useState(null);
  const [loadingRxBlob, setLoadingRxBlob] = useState(false);
  const [rxBlobError, setRxBlobError] = useState(false);
  const [isPdf, setIsPdf] = useState(false);

  // Pick checklist state for order packing
  const [packedItems, setPackedItems] = useState({});

  // Authenticated Blob Fetching for Prescription Preview
  useEffect(() => {
    let objectUrl = null;
    let isCancelled = false;

    if (selectedOrder?.prescription_url && token) {
      setLoadingRxBlob(true);
      setRxBlobError(false);
      setRxImageRotation(0);
      setRxImageZoom(1);

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
      toast.error("Failed to refresh pharmacy fulfillment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      const interval = setInterval(fetchData, 8000); // Poll every 8 seconds for live queue
      return () => clearInterval(interval);
    }
  }, [token]);

  // ================= COMPUTED OPERATIONAL METRICS =================
  const stats = useMemo(() => {
    const medicines = dashboardData?.medicines || [];
    const now = new Date();
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const lowStockCount = medicines.filter(m => (m.stock !== undefined ? m.stock <= 10 : !m.inStock)).length;
    const expiringSoonCount = medicines.filter(m => {
      if (!m.expiryDate) return false;
      const exp = new Date(m.expiryDate);
      return exp > now && exp <= sixtyDaysFromNow;
    }).length;
    const expiredCount = medicines.filter(m => {
      if (!m.expiryDate) return false;
      return new Date(m.expiryDate) <= now;
    }).length;

    const pendingVerificationCount = orders.filter(
      o => o.order_status === "pending_verification" || (o.requires_prescription && o.order_status === "pending")
    ).length;

    const readyToPackCount = orders.filter(
      o => o.order_status === "confirmed" || o.order_status === "processing"
    ).length;

    const totalRevenue = orders
      .filter(o => o.order_status === "delivered" || o.order_status === "confirmed" || o.order_status === "out_for_delivery")
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      medicines_count: medicines.length,
      total_orders: orders.length,
      pending_orders: orders.filter(o => o.order_status === "pending" || o.order_status === "cod_confirmed").length,
      pending_verification: pendingVerificationCount,
      ready_to_pack: readyToPackCount,
      total_revenue: totalRevenue,
      low_stock_count: lowStockCount,
      expiring_soon_count: expiringSoonCount,
      expired_count: expiredCount
    };
  }, [dashboardData, orders]);

  // ================= ORDERS LOGIC =================
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success(`Order marked as ${status.replace(/_/g, " ").toUpperCase()}`);
      fetchData();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, order_status: status }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update order status");
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status Filter
      if (statusFilter === "pending") {
        if (order.order_status !== "pending" && order.order_status !== "cod_confirmed") return false;
      } else if (statusFilter === "needs_verification") {
        if (order.order_status !== "pending_verification" && !(order.requires_prescription && order.order_status === "pending")) return false;
      } else if (statusFilter === "packing") {
        if (order.order_status !== "confirmed" && order.order_status !== "processing") return false;
      } else if (statusFilter !== "all" && order.order_status !== statusFilter) {
        return false;
      }

      // Search Query
      if (orderSearchQuery.trim()) {
        const query = orderSearchQuery.toLowerCase();
        const orderId = (order.orderNumber || order._id || "").toLowerCase();
        const customerName = (order.address?.name || "").toLowerCase();
        const phone = (order.address?.mobile || order.address?.phone || "").toLowerCase();
        const pincode = (order.address?.pincode || "").toLowerCase();
        return orderId.includes(query) || customerName.includes(query) || phone.includes(query) || pincode.includes(query);
      }

      return true;
    });
  }, [orders, statusFilter, orderSearchQuery]);

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
    // Initialize pack checklist
    const initialPacked = {};
    if (order.items) {
      order.items.forEach((item, idx) => {
        initialPacked[idx] = false;
      });
    }
    setPackedItems(initialPacked);
  };

  const togglePackedItem = (idx) => {
    setPackedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ================= MEDICINE FORM STATE & LOGIC =================
  const [medicineForm, setMedicineForm] = useState({
    id: "",
    name: "",
    genericName: "",
    category: "General",
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
      category: "General",
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
      toast.success("Medicine catalog entry added with batch & expiry tracking!");
      setShowAddMedicineModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to add medicine");
    }
  };

  const handleEditClick = (med) => {
    setMedicineForm({
      id: med._id,
      name: med.name,
      genericName: med.genericName || "",
      category: med.category || "General",
      company: med.company || "",
      manufacturer: med.manufacturer || "",
      mrp: med.mrp || "",
      price: med.price,
      stock: med.stock !== undefined ? med.stock : "",
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
      toast.success("Medicine inventory entry updated!");
      setShowEditMedicineModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update medicine");
    }
  };

  const handleDeleteMedicine = async (id) => {
    if (!window.confirm("Are you sure you want to remove this medicine from active inventory?")) return;
    try {
      await axios.delete(`${API_URL}/pharmacy/medicine/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Medicine deleted from inventory");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete medicine");
    }
  };

  // ================= BULK CSV IMPORT & EXPORT =================
  const handleDownloadTemplate = () => {
    const headers = "medicine_name,brand_name,composition,category,mrp,selling_price,stock_quantity,expiry_date,batch_number,manufacturer,prescription_required";
    const sample = "Paracetamol 650,Dolo,Paracetamol,Fever,30,25,100,2026-12-31,BATCH-D650,Micro Labs,No";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sample;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "medszop_inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportInventoryCsv = () => {
    const medicines = dashboardData?.medicines || [];
    if (medicines.length === 0) {
      return toast.error("No medicines to export in inventory");
    }

    const headers = ["Medicine Name", "Generic Salt", "Category", "Brand / Manufacturer", "MRP (INR)", "Selling Price (INR)", "Stock Qty", "Batch Number", "Expiry Date", "Prescription Required"];
    const rows = medicines.map(m => [
      `"${(m.name || "").replace(/"/g, '""')}"`,
      `"${(m.genericName || "").replace(/"/g, '""')}"`,
      `"${(m.category || "").replace(/"/g, '""')}"`,
      `"${(m.company || m.manufacturer || "").replace(/"/g, '""')}"`,
      m.mrp || m.price || 0,
      m.price || 0,
      m.stock || 0,
      `"${(m.batchNumber || "UNASSIGNED").replace(/"/g, '""')}"`,
      m.expiryDate ? new Date(m.expiryDate).toISOString().split('T')[0] : "N/A",
      m.requiresPrescription ? "Yes" : "No"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `medszop_inventory_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${medicines.length} medicines to CSV`);
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
      toast.success("Bulk inventory upload processed successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      setUploadStatus("error");
      toast.error(err.response?.data?.message || "Bulk upload failed");
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadStatus(null);
    setUploadResult(null);
  };

  // ================= PROFILE & LICENSE LOGIC =================
  const [profileForm, setProfileForm] = useState({
    store_name: "",
    pharmacist_name: "",
    address: "",
    license_number: ""
  });

  useEffect(() => {
    if (dashboardData?.pharmacy) {
      setProfileForm({
        store_name: dashboardData.pharmacy.name || user?.name || "",
        pharmacist_name: dashboardData.pharmacy.pharmacist_name || "",
        address: dashboardData.pharmacy.address || "",
        license_number: dashboardData.pharmacy.license_number || ""
      });
    }
  }, [dashboardData, user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/pharmacy/profile`, profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Pharmacy license & profile details saved");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    }
  };

  // ================= INVENTORY FILTERING =================
  const filteredMedicines = useMemo(() => {
    const list = dashboardData?.medicines || [];
    const now = new Date();
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    return list.filter(med => {
      // Search
      if (inventorySearchQuery.trim()) {
        const q = inventorySearchQuery.toLowerCase();
        const matchesName = (med.name || "").toLowerCase().includes(q);
        const matchesGeneric = (med.genericName || "").toLowerCase().includes(q);
        const matchesBatch = (med.batchNumber || "").toLowerCase().includes(q);
        const matchesCompany = (med.company || "").toLowerCase().includes(q);
        if (!matchesName && !matchesGeneric && !matchesBatch && !matchesCompany) return false;
      }

      // Category
      if (inventoryCategoryFilter !== "all") {
        if ((med.category || "").toLowerCase() !== inventoryCategoryFilter.toLowerCase()) return false;
      }

      // Stock & Expiry filter
      if (inventoryStockFilter === "low_stock") {
        if (med.stock !== undefined ? med.stock > 10 : med.inStock) return false;
      } else if (inventoryStockFilter === "expiring_soon") {
        if (!med.expiryDate) return false;
        const exp = new Date(med.expiryDate);
        if (exp <= now || exp > sixtyDaysFromNow) return false;
      } else if (inventoryStockFilter === "expired") {
        if (!med.expiryDate) return false;
        if (new Date(med.expiryDate) > now) return false;
      } else if (inventoryStockFilter === "prescription_only") {
        if (!med.requiresPrescription) return false;
      }

      return true;
    });
  }, [dashboardData, inventorySearchQuery, inventoryCategoryFilter, inventoryStockFilter]);

  // Status helper badges
  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-amber-100/80 text-amber-800 border-amber-300",
      cod_confirmed: "bg-amber-100/80 text-amber-800 border-amber-300",
      pending_verification: "bg-purple-100 text-purple-800 border-purple-300 font-semibold",
      confirmed: "bg-blue-100 text-blue-800 border-blue-300",
      processing: "bg-indigo-100 text-indigo-800 border-indigo-300",
      out_for_delivery: "bg-cyan-100 text-cyan-800 border-cyan-300",
      delivered: "bg-emerald-100 text-emerald-800 border-emerald-300",
      cancelled: "bg-rose-100 text-rose-800 border-rose-300",
    };
    return styles[status] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getExpiryBadge = (expiryDate) => {
    if (!expiryDate) {
      return (
        <span className="text-[11px] font-mono text-slate-400">Not Recorded</span>
      );
    }
    const exp = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <Badge variant="destructive" className="text-[10px] font-mono font-bold bg-red-100 text-red-700 border-red-300">
          EXPIRED ({Math.abs(diffDays)}d ago)
        </Badge>
      );
    }
    if (diffDays <= 60) {
      return (
        <Badge className="text-[10px] font-mono font-semibold bg-amber-100 text-amber-800 border-amber-300">
          EXPIRING ({diffDays}d)
        </Badge>
      );
    }
    return (
      <span className="text-[11px] font-mono text-emerald-700 font-medium">
        {exp.toISOString().split('T')[0]} ({diffDays}d)
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="text-sm font-semibold text-slate-700 font-heading">
          Connecting to MedsZop Retail Fulfillment Hub...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PharmacyNavbar
        verified={dashboardData?.pharmacy?.verified}
        pharmacyName={dashboardData?.pharmacy?.name}
        pharmacistName={dashboardData?.pharmacy?.pharmacist_name}
        licenseNumber={dashboardData?.pharmacy?.license_number}
        lowStockCount={stats.low_stock_count}
        pendingRxCount={stats.pending_verification}
      />

      <main className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* ================= CONSOLE HEADER & SHIFT TELEMETRY ================= */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                <Boxes className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-heading" data-testid="pharmacy-dashboard-title">
                  Retail Fulfillment Console
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Real-time prescription dispensing, batch inventory tracking, and carrier dispatch dispatch desk.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Rail */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportInventoryCsv}
              className="h-10 px-3.5 text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100 bg-white"
            >
              <Download className="h-3.5 w-3.5" />
              Export Inventory CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadModal(true)}
              className="h-10 px-3.5 text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100 bg-white"
            >
              <Upload className="h-3.5 w-3.5" />
              Bulk Upload CSV
            </Button>
            <Button
              size="sm"
              onClick={() => { resetForm(); setShowAddMedicineModal(true); }}
              className="h-10 px-4 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Medicine
            </Button>
          </div>
        </div>

        {/* ================= OPERATIONAL ALERTS BANNER ================= */}
        {(stats.low_stock_count > 0 || stats.expiring_soon_count > 0 || stats.expired_count > 0) && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-900 font-heading">
                  Compliance & Safety Inventory Alerts Requiring Attention
                </h4>
                <p className="text-xs text-amber-700">
                  {stats.expired_count > 0 && <span className="font-semibold text-red-700 mr-2">⛔ {stats.expired_count} expired medicines (quarantine required).</span>}
                  {stats.expiring_soon_count > 0 && <span className="mr-2">⚠️ {stats.expiring_soon_count} items expiring within 60 days.</span>}
                  {stats.low_stock_count > 0 && <span>📦 {stats.low_stock_count} SKUs critically low (&le; 10 units).</span>}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setActiveTab("inventory");
                setInventoryStockFilter(stats.expired_count > 0 ? "expired" : "low_stock");
              }}
              className="h-8 px-3 text-xs font-semibold bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              Review Flagged SKUs
            </Button>
          </div>
        )}

        {/* ================= 5-COLUMN OPERATIONAL KPI CARDS ================= */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-7">
          <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Orders Queue</p>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tabular-nums mt-0.5">
                  {stats.total_orders}
                </h2>
                <span className="text-[10px] text-slate-400 font-medium">All assigned orders</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Package className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Rx Pending Audit</p>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-amber-600 tabular-nums mt-0.5">
                  {stats.pending_verification}
                </h2>
                <span className="text-[10px] text-amber-700 font-medium">Awaiting R.Ph. Sign-off</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <FileCheck className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ready to Pack</p>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-indigo-600 tabular-nums mt-0.5">
                  {stats.ready_to_pack}
                </h2>
                <span className="text-[10px] text-indigo-600 font-medium">Confirmed for dispatch</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Boxes className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Catalog</p>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tabular-nums mt-0.5">
                  {stats.medicines_count}
                </h2>
                <span className="text-[10px] text-slate-400 font-medium">Form 20/21 Formulary</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <TrendingUp className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs col-span-2 md:col-span-1">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gross Fulfilled</p>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading font-mono text-emerald-700 tabular-nums mt-0.5">
                  ₹{stats.total_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </h2>
                <span className="text-[10px] text-emerald-600 font-medium">Settlement eligible</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <DollarSign className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= WORKSPACE TABS ================= */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
            <TabsList className="grid grid-cols-5 w-full sm:w-[620px] h-11 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <TabsTrigger value="overview" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                Fulfillment Rail ({orders.length})
              </TabsTrigger>
              <TabsTrigger value="rx_desk" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                Rx Audit Desk ({stats.pending_verification})
              </TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                Inventory ({stats.medicines_count})
              </TabsTrigger>
              <TabsTrigger value="profile" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                Form 20/21
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Telemetry: WebSocket/Polling 8s Sync Active</span>
            </div>
          </div>

          {/* ================= TAB 1: OVERVIEW ================= */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Live Action Orders */}
              <Card className="lg:col-span-2 rounded-xl border-slate-200/90 bg-white shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 font-heading">
                      Live Dispensing Queue
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Recent orders requiring verification, packing, or carrier handover.
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("orders")}
                    className="text-xs text-emerald-700 hover:text-emerald-800"
                  >
                    View All &rarr;
                  </Button>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Package className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-semibold">No active dispensing orders</p>
                      <p className="text-xs">New orders assigned to this pharmacy will appear here instantly.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 6).map((order) => (
                        <div
                          key={order._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-slate-200/80 rounded-xl hover:bg-slate-50/80 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-mono text-xs font-bold border border-slate-200">
                              #{order.orderNumber ? order.orderNumber.split('-')[1] || order.orderNumber.slice(-4) : order._id.slice(-4)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">
                                  {order.address?.name || "Customer Order"}
                                </span>
                                {order.prescription_url && (
                                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] py-0">
                                    Rx Attached
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-mono">
                                {order.items?.length || 0} item(s) • Pincode: {order.address?.pincode || "N/A"} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3">
                            <div className="text-right">
                              <p className="font-bold font-mono text-sm text-slate-900">₹{(order.total || 0).toFixed(0)}</p>
                              <Badge className={`text-[10px] ${getStatusBadge(order.order_status)}`}>
                                {order.order_status.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openOrderDetails(order)}
                              className="h-8 px-2.5 text-xs font-semibold border-slate-200"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                              Inspect
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Column: Shift Status & Quick Tools */}
              <div className="space-y-6">
                <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold text-slate-900 font-heading">
                      Dispensing Station Controls
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Standard operating checklist under Schedule M & Pharmacy Act.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3.5">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ThermometerSnowflake className="h-4 w-4 text-cyan-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Cold Chain Refrigerator</p>
                          <p className="text-[11px] text-slate-500">Logged at 4.2°C (Acceptable 2°–8°C)</p>
                        </div>
                      </div>
                      <Badge className="bg-cyan-50 text-cyan-800 border-cyan-200 text-[10px]">Optimal</Badge>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Form 20/21 Audit Log</p>
                          <p className="text-[11px] text-slate-500">Scheduled dispensing records in sync</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">Active</Badge>
                    </div>

                    <div className="pt-2 space-y-2">
                      <Button
                        className="w-full justify-start h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => { resetForm(); setShowAddMedicineModal(true); }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add New Medicine to Inventory
                      </Button>
                      <Button
                        className="w-full justify-start h-10 text-xs font-semibold"
                        variant="outline"
                        onClick={() => {
                          setActiveTab("orders");
                          setStatusFilter("needs_verification");
                        }}
                      >
                        <FileCheck className="mr-2 h-4 w-4 text-amber-600" />
                        Audit Pending Prescriptions ({stats.pending_verification})
                      </Button>
                      <Button
                        className="w-full justify-start h-10 text-xs font-semibold"
                        variant="outline"
                        onClick={() => {
                          setActiveTab("inventory");
                          setInventoryStockFilter("low_stock");
                        }}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                        Check Low Stock Alerts ({stats.low_stock_count})
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Regulatory Statement */}
                <Card className="rounded-xl border-slate-200/90 bg-emerald-50/40 shadow-xs">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs font-heading">
                      <ShieldCheck className="h-4 w-4 text-emerald-700" />
                      <span>Form 20 / 21 Dispensing Mandate</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      All Schedule H and H1 medications must be audited by a registered pharmacist with recorded batch numbers and doctor registration verification prior to dispatch.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ================= TAB 2: FULFILLMENT RAIL (ORDERS) ================= */}
          <TabsContent value="orders" className="space-y-4">
            <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
              <CardHeader className="p-4 sm:p-5 border-b border-slate-200/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                      Prescription Fulfillment Rail
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Manage real-time incoming orders, verify prescriptions, pack items, and dispatch with carriers.
                    </CardDescription>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search Order #, customer, mobile..."
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <select
                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses ({orders.length})</option>
                      <option value="needs_verification">⚠️ Needs Rx Verification ({stats.pending_verification})</option>
                      <option value="pending">Pending Acceptance</option>
                      <option value="packing">Ready to Pack ({stats.ready_to_pack})</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered / Settled</option>
                      <option value="cancelled">Cancelled / Rejected</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="font-bold text-xs text-slate-700 font-mono">Order ID</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700">Customer & Destination</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700">Items & Rx</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700">Billing</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700">Fulfillment Status</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700 font-mono">Timestamp</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700 text-right">Workflow Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                            <Package className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-sm font-semibold">No orders match the selected filters</p>
                            <p className="text-xs text-slate-400 mt-1">Try resetting the status filter or search query.</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => {
                          const isRxRequired = order.prescription_url || order.requires_prescription;
                          const isPendingRx = order.order_status === "pending_verification" || (isRxRequired && order.order_status === "pending");

                          return (
                            <TableRow key={order._id} className="hover:bg-slate-50/60 border-b border-slate-200/70 transition-colors">
                              <TableCell className="font-mono text-xs font-bold text-slate-900">
                                {order.orderNumber || order._id.slice(0, 8)}
                              </TableCell>

                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-xs text-slate-900">
                                    {order.address?.name || "Customer"}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                    <Phone className="h-3 w-3 text-slate-400" />
                                    {order.address?.mobile || order.address?.phone || "No Phone"} • PIN: {order.address?.pincode || "N/A"}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs font-medium text-slate-800">
                                    {order.items?.length || 0} item(s)
                                  </span>
                                  {isRxRequired ? (
                                    <Badge className="w-fit bg-amber-100 text-amber-800 border-amber-300 text-[10px] py-0 font-semibold gap-1">
                                      <FileText className="h-2.5 w-2.5" />
                                      Rx Required
                                    </Badge>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">OTC Item</span>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-bold font-mono text-xs text-slate-900">
                                    ₹{(order.total || 0).toFixed(2)}
                                  </span>
                                  <span className="text-[10px] uppercase font-mono text-slate-500">
                                    {order.payment_method === "cod" ? "COD" : "Prepaid"}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell>
                                <Badge className={`text-[10px] font-semibold ${getStatusBadge(order.order_status)}`}>
                                  {order.order_status.replace(/_/g, " ")}
                                </Badge>
                              </TableCell>

                              <TableCell className="font-mono text-xs text-slate-500">
                                {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{" "}
                                <span className="text-[10px] text-slate-400">
                                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </TableCell>

                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isPendingRx ? (
                                    <Button
                                      size="sm"
                                      onClick={() => openOrderDetails(order)}
                                      className="h-8 px-2.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1"
                                    >
                                      <FileCheck className="h-3.5 w-3.5" />
                                      Audit Rx
                                    </Button>
                                  ) : order.order_status === "confirmed" ? (
                                    <Button
                                      size="sm"
                                      onClick={() => openOrderDetails(order)}
                                      className="h-8 px-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                                    >
                                      <Boxes className="h-3.5 w-3.5" />
                                      Pack & Dispatch
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openOrderDetails(order)}
                                      className="h-8 px-2.5 text-xs font-semibold border-slate-200"
                                    >
                                      <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
                                      Inspect
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= TAB 3: PRESCRIPTION AUDIT DESK ================= */}
          <TabsContent value="rx_desk" className="space-y-4">
            <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
              <CardHeader className="p-4 sm:p-5 border-b border-slate-200/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-amber-600" />
                      Pharmacist Prescription Audit Station
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Mandatory pharmacist sign-off queue for Schedule H/H1 medications pursuant to Rule 65 of Drugs and Cosmetics Rules.
                    </CardDescription>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-mono text-xs py-1 px-3 w-fit">
                    {stats.pending_verification} Rx In Verification Queue
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5">
                {orders.filter(o => o.prescription_url).length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-700">All Prescriptions Audited</h3>
                    <p className="text-xs text-slate-400 mt-1">There are no outstanding prescription orders waiting for verification.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders
                      .filter(o => o.prescription_url)
                      .map((order) => (
                        <div
                          key={order._id}
                          className="border border-slate-200 rounded-xl p-4 hover:border-emerald-300 transition-all bg-white flex flex-col justify-between gap-3 shadow-2xs"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {order.orderNumber || order._id.slice(0, 8)}
                              </span>
                              <Badge className={`text-[10px] ${getStatusBadge(order.order_status)}`}>
                                {order.order_status.replace(/_/g, " ")}
                              </Badge>
                            </div>

                            <p className="text-xs font-semibold text-slate-900">{order.address?.name || "Patient Order"}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              Items: {order.items?.map(i => i.name).join(", ") || "Prescription order"}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-800">₹{(order.total || 0).toFixed(0)}</span>
                            <Button
                              size="sm"
                              onClick={() => openOrderDetails(order)}
                              className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Launch Rx Audit &rarr;
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= TAB 4: MEDICINE INVENTORY & BATCH MANAGEMENT ================= */}
          <TabsContent value="inventory" className="space-y-4">
            <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
              <CardHeader className="p-4 sm:p-5 border-b border-slate-200/80">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                      Batch & Expiry Medicine Catalog
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Manage formulation batches, rack locators, stock levels, Schedule H designations, and cold-chain tags.
                    </CardDescription>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search Brand, Generic, Batch..."
                        value={inventorySearchQuery}
                        onChange={(e) => setInventorySearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <select
                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none"
                      value={inventoryStockFilter}
                      onChange={(e) => setInventoryStockFilter(e.target.value)}
                    >
                      <option value="all">All Stock Statuses</option>
                      <option value="low_stock">⚠️ Low Stock (&le; 10 units)</option>
                      <option value="expiring_soon">⏳ Expiring Soon (&le; 60 days)</option>
                      <option value="expired">⛔ Expired Batches</option>
                      <option value="prescription_only">📋 Prescription Only</option>
                    </select>

                    <Button
                      size="sm"
                      onClick={() => { resetForm(); setShowAddMedicineModal(true); }}
                      className="h-9 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add SKU
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="font-bold text-xs text-slate-700">Medicine & Chemical Formulation</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700 font-mono">Batch / Lot No.</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700">Classification</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700">Expiry Date</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700">Stock Level</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700">Pricing (MRP/Sale)</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredMedicines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                            <Package className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-sm font-semibold">No medicines in current filter view</p>
                            <p className="text-xs text-slate-400 mt-1">Add a medicine or change your filter selection.</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMedicines.map((med) => {
                          const isLowStock = med.stock !== undefined ? med.stock <= 10 : !med.inStock;
                          const isOutOfStock = med.stock !== undefined ? med.stock === 0 : !med.inStock;

                          return (
                            <TableRow key={med._id} className="hover:bg-slate-50/60 border-b border-slate-200/70 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {med.image ? (
                                    <img
                                      src={med.image}
                                      alt={med.name}
                                      className="h-10 w-10 object-contain rounded-lg border border-slate-200 bg-white p-0.5 shrink-0"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                                      <Package className="h-5 w-5" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-xs text-slate-900">{med.name}</span>
                                      {med.isAutoImage && (
                                        <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[9px] py-0">
                                          Auto-Image
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-mono">
                                      {med.genericName ? `${med.genericName} • ` : ""}
                                      {med.company || med.manufacturer || "Generic"}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="font-mono text-xs font-semibold text-slate-700">
                                {med.batchNumber || "BATCH-DEFAULT"}
                              </TableCell>

                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {med.requiresPrescription ? (
                                    <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] py-0">
                                      Schedule H
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-slate-600 border-slate-200 text-[10px] py-0">
                                      OTC
                                    </Badge>
                                  )}
                                  {med.category && (
                                    <Badge variant="outline" className="text-slate-600 border-slate-200 text-[10px] py-0">
                                      {med.category}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell>
                                {getExpiryBadge(med.expiryDate)}
                              </TableCell>

                              <TableCell>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`font-bold font-mono text-xs ${isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-slate-900"}`}>
                                      {med.stock !== undefined ? `${med.stock} units` : med.inStock ? "Available" : "0 units"}
                                    </span>
                                  </div>
                                  {isLowStock && (
                                    <span className="text-[10px] text-red-600 font-semibold">Low Stock Alert</span>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-bold font-mono text-xs text-emerald-700">
                                    ₹{med.price}
                                  </span>
                                  {med.mrp > med.price && (
                                    <span className="text-[10px] font-mono text-slate-400 line-through">
                                      ₹{med.mrp} ({med.discount || Math.round(((med.mrp - med.price) / med.mrp) * 100)}% off)
                                    </span>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label="Edit medicine"
                                    onClick={() => handleEditClick(med)}
                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label="Delete medicine"
                                    onClick={() => handleDeleteMedicine(med._id)}
                                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= TAB 5: PHARMACY PROFILE & FORM 20/21 COMPLIANCE ================= */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 rounded-xl border-slate-200/90 bg-white shadow-xs">
                <CardHeader className="border-b border-slate-200/80 pb-4">
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    Pharmacy Regulatory & License Profile
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Official registration data under the Drugs and Cosmetics Act 1940 (Form 20, 21, and 21B Chemist Licensure).
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Retail Pharmacy Store Name *</label>
                        <input
                          type="text"
                          value={profileForm.store_name}
                          onChange={(e) => setProfileForm(p => ({ ...p, store_name: e.target.value }))}
                          required
                          className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Registered Pharmacist (R.Ph.) *</label>
                        <input
                          type="text"
                          value={profileForm.pharmacist_name}
                          onChange={(e) => setProfileForm(p => ({ ...p, pharmacist_name: e.target.value }))}
                          placeholder="e.g. Rahul Sharma, B.Pharm (Reg. 48291)"
                          required
                          className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Drug License Numbers (Form 20 & 21) *</label>
                      <input
                        type="text"
                        value={profileForm.license_number}
                        onChange={(e) => setProfileForm(p => ({ ...p, license_number: e.target.value }))}
                        placeholder="e.g. 20-DL-MH-19284 / 21-DL-MH-19285"
                        required
                        className="w-full h-10 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                      />
                      <p className="text-[11px] text-slate-400">Issued by State Drugs Control Administration.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Physical Store Address *</label>
                      <textarea
                        value={profileForm.address}
                        onChange={(e) => setProfileForm(p => ({ ...p, address: e.target.value }))}
                        rows={3}
                        required
                        placeholder="Complete street address, landmark, city, state, and 6-digit pincode"
                        className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        type="submit"
                        className="h-10 px-5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Save Profile & License Credentials
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Compliance Badges Panel */}
              <div className="space-y-4">
                <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-slate-900 font-heading">
                      Compliance Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="font-semibold">Form 20 (Allopathic Retail)</span>
                      </div>
                      <Badge className="bg-emerald-600 text-white text-[10px]">Verified</Badge>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="font-semibold">Form 21 (Biologicals / Schedule C)</span>
                      </div>
                      <Badge className="bg-emerald-600 text-white text-[10px]">Verified</Badge>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-cyan-50/80 border border-cyan-200 text-cyan-900">
                      <div className="flex items-center gap-2">
                        <ThermometerSnowflake className="h-4 w-4 text-cyan-600" />
                        <span className="font-semibold">Cold Storage Standard</span>
                      </div>
                      <Badge className="bg-cyan-600 text-white text-[10px]">2°C - 8°C Logged</Badge>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-slate-500" />
                        <span className="font-semibold">Schedule X Dispensing</span>
                      </div>
                      <Badge variant="outline" className="text-slate-500 text-[10px]">Prohibited / Off</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
                  <CardContent className="p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 font-heading">
                      Financial Settlement Policy
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Settlements for fulfilled orders are audited against digital delivery signatures and processed on a weekly cycle directly to the registered pharmacy bank account.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ================= ORDER DETAILS & PRESCRIPTION AUDIT MODAL ================= */}
      <Dialog open={showOrderDetailsModal} onOpenChange={setShowOrderDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <DialogTitle className="text-lg font-bold font-heading text-slate-900">
                  Fulfillment Order #{selectedOrder?.orderNumber || selectedOrder?._id?.slice(0, 8)}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-mono">
                  Booked on {selectedOrder && new Date(selectedOrder.createdAt).toLocaleString()}
                </DialogDescription>
              </div>
              <Badge className={`text-xs ${selectedOrder && getStatusBadge(selectedOrder.order_status)}`}>
                {selectedOrder?.order_status.replace(/_/g, " ")}
              </Badge>
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 pt-3">
              {/* Prescription Verification Split Workstation */}
              {selectedOrder.prescription_url && (
                <div className="bg-amber-50/60 rounded-xl p-4 sm:p-5 border border-amber-200/90">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-amber-950 flex items-center text-sm font-heading">
                      <FileCheck className="h-4 w-4 mr-2 text-amber-700" />
                      Prescription Audit & Medical Practitioner Verification
                    </h3>
                    <Badge variant="outline" className="border-amber-300 text-amber-800 text-[10px] font-mono">
                      Rule 65 Compliance
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* Prescription Document Preview with Zoom/Rotate Controls */}
                    <div className="space-y-2">
                      <div className="relative border border-amber-200 rounded-lg overflow-hidden bg-white h-60 flex items-center justify-center">
                        {loadingRxBlob ? (
                          <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                            <span className="text-xs">Decrypting Rx Blob...</span>
                          </div>
                        ) : rxBlobError ? (
                          <div className="text-center p-4 text-red-600 text-xs">
                            <AlertCircle className="h-6 w-6 mx-auto mb-1 text-red-500" />
                            Prescription blob could not be loaded. Please re-authenticate.
                          </div>
                        ) : isPdf ? (
                          <div className="flex flex-col items-center justify-center p-4">
                            <FileText className="h-10 w-10 text-red-500 mb-2" />
                            <span className="text-xs font-bold text-slate-800">PDF Document</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowImageModal(true)}
                              className="mt-2 text-xs h-7"
                            >
                              Launch PDF Viewer
                            </Button>
                          </div>
                        ) : rxBlobUrl ? (
                          <div className="w-full h-full overflow-hidden flex items-center justify-center">
                            <img
                              src={rxBlobUrl}
                              alt="Prescription"
                              style={{
                                transform: `rotate(${rxImageRotation}deg) scale(${rxImageZoom})`,
                                transition: "transform 0.2s ease"
                              }}
                              className="max-h-full max-w-full object-contain cursor-pointer"
                              onClick={() => setShowImageModal(true)}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No prescription binary available</span>
                        )}
                      </div>

                      {/* Image inspection controls */}
                      {!isPdf && rxBlobUrl && (
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => setRxImageZoom(z => Math.min(z + 0.2, 2.5))}
                              title="Zoom In"
                            >
                              <ZoomIn className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => setRxImageZoom(z => Math.max(z - 0.2, 0.6))}
                              title="Zoom Out"
                            >
                              <ZoomOut className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => setRxImageRotation(r => (r + 90) % 360)}
                              title="Rotate 90°"
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowImageModal(true)}
                            className="text-xs h-7 text-amber-800 hover:text-amber-900"
                          >
                            Fullscreen Preview &rarr;
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Pharmacist Verification Checklist */}
                    <div className="space-y-3 bg-white p-3.5 rounded-lg border border-amber-200">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Mandatory Dispensing Checks
                      </h4>
                      <ul className="text-xs space-y-2 text-slate-600">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Prescription is valid and issued within acceptable legal window.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Prescribed medicines match the quantities and potencies in this order.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>RMP doctor credentials and registration state verified.</span>
                        </li>
                      </ul>

                      {/* Approval Actions */}
                      <div className="pt-2 flex flex-col gap-2">
                        {["pending", "pending_verification", "cod_confirmed"].includes(selectedOrder.order_status) && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 gap-1.5"
                              onClick={() => handleUpdateOrderStatus(selectedOrder._id, "confirmed")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Approve & Confirm Order
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-9 text-xs font-semibold px-3"
                              onClick={() => handleUpdateOrderStatus(selectedOrder._id, "cancelled")}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {selectedOrder.order_status === "confirmed" && (
                          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Prescription Verified & Approved for Dispensing
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer & Address Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center mb-1.5">
                    <User className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Customer Details
                  </h4>
                  <p className="text-xs font-semibold text-slate-900">{selectedOrder.address?.name || "Customer"}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center">
                    <Phone className="h-3 w-3 mr-1 text-slate-400" />
                    {selectedOrder.address?.mobile || selectedOrder.address?.phone || "No phone provided"}
                  </p>
                </div>

                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center mb-1.5">
                    <MapPin className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Delivery Address
                  </h4>
                  <p className="text-xs text-slate-700">{selectedOrder.address?.addressLine1 || "Address on file"}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}
                  </p>
                </div>
              </div>

              {/* Order Packing & Picking Rail */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 font-heading">
                    Item Picking & Pack Checklist ({selectedOrder.items?.length || 0} SKUs)
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Verify batch numbers on physical packaging
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-10 text-center">Pick</TableHead>
                        <TableHead className="text-xs font-bold">Item Description</TableHead>
                        <TableHead className="text-xs font-bold text-center">Rack / Shelf</TableHead>
                        <TableHead className="text-xs font-bold text-center">Qty</TableHead>
                        <TableHead className="text-xs font-bold text-right">Unit Price</TableHead>
                        <TableHead className="text-xs font-bold text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item, idx) => (
                        <TableRow key={idx} className={packedItems[idx] ? "bg-emerald-50/40" : ""}>
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={!!packedItems[idx]}
                              onChange={() => togglePackedItem(idx)}
                              className="h-4 w-4 rounded text-emerald-600 cursor-pointer"
                            />
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-900">
                            {item.name}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-center text-slate-600">
                            Rack A-{((idx % 4) + 1).toString().padStart(2, '0')}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-center font-bold text-slate-800">
                            x{item.quantity}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-right text-slate-600">
                            ₹{item.price}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-right font-bold text-slate-900">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      Payment: {selectedOrder.payment_method?.toUpperCase()} • {selectedOrder.payment_status?.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 mr-2">Total Invoice Value:</span>
                    <span className="text-lg font-bold font-mono text-emerald-700">₹{(selectedOrder.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status Advancement Workstation */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Fulfillment Progression:</span>
                  <span className="text-[11px] text-slate-500">Advance status as medicines move through physical workflow</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedOrder.order_status === "confirmed" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(selectedOrder._id, "out_for_delivery")}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-9 font-semibold gap-1.5"
                    >
                      <Truck className="h-4 w-4" />
                      Handover to Delivery Fleet
                    </Button>
                  )}

                  {selectedOrder.order_status === "out_for_delivery" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(selectedOrder._id, "delivered")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Delivered (Settlement Ready)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= FULLSCREEN RX IMAGE MODAL ================= */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-5xl h-[92vh] flex items-center justify-center bg-zinc-950 p-2 overflow-hidden relative">
          <Button
            className="absolute top-4 right-4 z-50 rounded-full bg-black/60 hover:bg-black/90 text-white border-none"
            size="icon"
            onClick={() => setShowImageModal(false)}
          >
            <XCircle className="h-6 w-6" />
          </Button>

          {rxBlobUrl ? (
            isPdf ? (
              <iframe src={rxBlobUrl} className="w-full h-full rounded" title="Prescription PDF" />
            ) : (
              <img
                src={rxBlobUrl}
                alt="Prescription Fullscreen"
                style={{
                  transform: `rotate(${rxImageRotation}deg) scale(${rxImageZoom})`
                }}
                className="max-w-full max-h-full object-contain"
              />
            )
          ) : (
            <div className="text-white text-sm">No preview available</div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= ADD / EDIT MEDICINE MODAL ================= */}
      {(showAddMedicineModal || showEditMedicineModal) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs z-50 p-3 sm:p-4">
          <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-heading text-slate-900">
                  {showEditMedicineModal ? "Update Form 20/21 Medicine Entry" : "Register New Formulation in Inventory"}
                </h2>
                <p className="text-xs text-slate-500">Record batch, expiry date, chemical salt, and pricing</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => { setShowAddMedicineModal(false); setShowEditMedicineModal(false); }}
              >
                ✕
              </Button>
            </div>

            <form onSubmit={showEditMedicineModal ? handleEditSubmit : handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Brand Name *</label>
                  <input
                    name="name"
                    value={medicineForm.name}
                    onChange={handleMedicineChange}
                    required
                    placeholder="e.g. Dolo 650"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Generic / Salt Composition *</label>
                  <input
                    name="genericName"
                    value={medicineForm.genericName}
                    onChange={handleMedicineChange}
                    required
                    placeholder="e.g. Paracetamol 650mg"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Category</label>
                  <input
                    name="category"
                    value={medicineForm.category}
                    onChange={handleMedicineChange}
                    placeholder="e.g. Analgesic, Antibiotic"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Company / Marketer</label>
                  <input
                    name="company"
                    value={medicineForm.company}
                    onChange={handleMedicineChange}
                    placeholder="e.g. Micro Labs"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Manufacturer</label>
                  <input
                    name="manufacturer"
                    value={medicineForm.manufacturer}
                    onChange={handleMedicineChange}
                    placeholder="e.g. Cipla Ltd."
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">MRP (₹)</label>
                  <input
                    name="mrp"
                    type="number"
                    value={medicineForm.mrp}
                    onChange={handleMedicineChange}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-mono bg-slate-50 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Sale Price (₹) *</label>
                  <input
                    name="price"
                    type="number"
                    value={medicineForm.price}
                    onChange={handleMedicineChange}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-mono bg-slate-50 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Stock Count *</label>
                  <input
                    name="stock"
                    type="number"
                    value={medicineForm.stock}
                    onChange={handleMedicineChange}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-mono bg-slate-50 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Batch Number *</label>
                  <input
                    name="batchNumber"
                    value={medicineForm.batchNumber}
                    onChange={handleMedicineChange}
                    placeholder="e.g. B24089"
                    required
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-mono bg-slate-50 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Expiry Date *</label>
                  <input
                    name="expiryDate"
                    type="date"
                    value={medicineForm.expiryDate}
                    onChange={handleMedicineChange}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-mono bg-slate-50 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-6 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      name="inStock"
                      checked={medicineForm.inStock}
                      onChange={handleMedicineChange}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <span>Available in Stock</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-800">
                    <input
                      type="checkbox"
                      name="requiresPrescription"
                      checked={medicineForm.requiresPrescription}
                      onChange={handleMedicineChange}
                      className="w-4 h-4 rounded text-amber-600"
                    />
                    <span>Schedule H (Requires Rx)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Clinical Description / Storage Advisory</label>
                <textarea
                  name="description"
                  value={medicineForm.description}
                  onChange={handleMedicineChange}
                  rows={2}
                  placeholder="e.g. Store below 25°C in a dry place. Protect from direct sunlight."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10 text-xs font-semibold"
                  onClick={() => { setShowAddMedicineModal(false); setShowEditMedicineModal(false); }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {showEditMedicineModal ? "Update Inventory Record" : "Save to Inventory"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= BULK CSV IMPORT MODAL ================= */}
      <Dialog open={showUploadModal} onOpenChange={(open) => !open && closeUploadModal()}>
        <DialogContent className="max-w-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-heading text-slate-900">
              Bulk CSV Inventory Import
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Upload multiple medicine records with batch numbers and expiration dates in a single operation.
            </DialogDescription>
          </DialogHeader>

          {!uploadStatus || uploadStatus === 'uploading' || uploadStatus === 'error' ? (
            <div className="space-y-5 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs text-slate-800">CSV Template Format</h4>
                  <p className="text-[11px] text-slate-500">Includes medicine name, composition, batch, and expiry columns.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download Template
                </Button>
              </div>

              <form onSubmit={handleBulkUpload} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
                  <FileSpreadsheet className="h-10 w-10 mx-auto text-emerald-600 mb-2" />
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Select .CSV Inventory File
                  </label>
                  <input
                    type="file"
                    name="file"
                    accept=".csv"
                    required
                    className="block w-full text-xs text-slate-500 mx-auto max-w-xs
                      file:mr-3 file:py-1.5 file:px-3
                      file:rounded-lg file:border-0
                      file:text-xs file:font-semibold
                      file:bg-emerald-50 file:text-emerald-700
                      hover:file:bg-emerald-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={closeUploadModal} className="h-9 text-xs">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploadStatus === 'uploading'}
                    className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {uploadStatus === 'uploading' ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Validating Records...
                      </span>
                    ) : 'Upload & Reconcile'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-5 pt-3">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-slate-900 font-heading">Reconciliation Complete</h3>
                <p className="text-xs text-slate-500">Summary of imported medicines and batch records.</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-2xl font-bold font-mono text-emerald-700">{uploadResult.added}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Added</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-2xl font-bold font-mono text-blue-700">{uploadResult.updated}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Updated</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-2xl font-bold font-mono text-amber-700">{uploadResult.skipped}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Skipped</p>
                </div>
              </div>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 max-h-36 overflow-y-auto text-xs text-red-800 space-y-1">
                  <span className="font-bold block">Validation Notes:</span>
                  {uploadResult.errors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}

              <Button className="w-full h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white" onClick={closeUploadModal}>
                Complete & Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PharmacyFooter />
    </div>
  );
};

export default PharmacyDashboardPage;
