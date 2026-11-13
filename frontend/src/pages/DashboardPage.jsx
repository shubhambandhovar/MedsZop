import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar.jsx";
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
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "../components/ui/dialog";
import {
  Package,
  ShoppingCart,
  FileText,
  TrendingUp,
  Clock,
  MessageSquare,
  Pill,
  ScanLine,
  Heart,
  Stethoscope,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  Plus,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  Zap,
  Building2,
  Home,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const DashboardPage = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { user, token } = useAuth();
  const [data, setData] = useState({
    orders: [],
    prescriptions: [],
    addresses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  // Add Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: user?.name || "",
    mobile: user?.phone || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    addressType: "Home",
  });
  const [viewingRxLoading, setViewingRxLoading] = useState(false);

  // Authenticated Blob Fetching for Prescriptions (Phase 9B.1 / SEC-04)
  // Prevents leaking ordinary JWT tokens in URLs, browser history, or server access logs
  const handleViewPrescription = async (fileUrl) => {
    if (!fileUrl || !token) return;
    try {
      setViewingRxLoading(true);
      const normalized = fileUrl.replace(/\\/g, "/");
      const url = normalized.startsWith("http") ? normalized : `${API_URL}/${normalized}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      });
      const blobUrl = URL.createObjectURL(res.data);
      const newTab = window.open(blobUrl, "_blank");
      if (!newTab) {
        toast.error("Please allow popups to view prescription files");
      }
      // Revoke blob URL after 2 minutes to free memory
      setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
    } catch (err) {
      console.error("Prescription fetch error:", err);
      toast.error(
        err.response?.status === 403
          ? "You are not authorized to view this prescription"
          : "Failed to load prescription file"
      );
    } finally {
      setViewingRxLoading(false);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const [ordersRes, prescriptionsRes, addressesRes] = await Promise.allSettled([
        axios.get(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/prescriptions`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/addresses`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setData({
        orders: ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value.data) ? ordersRes.value.data : [],
        prescriptions: prescriptionsRes.status === "fulfilled" && Array.isArray(prescriptionsRes.value.data) ? prescriptionsRes.value.data : [],
        addresses: addressesRes.status === "fulfilled" && Array.isArray(addressesRes.value.data) ? addressesRes.value.data : [],
      });
    } catch (err) {
      console.error("Dashboard API error:", err);
      setError("Unable to load all dashboard records. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedOrderId(id);
    toast.success("Order ID copied to clipboard!");
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.name.trim() || !addressForm.mobile.trim() || !addressForm.addressLine1.trim() || !addressForm.city.trim() || !addressForm.state.trim() || !addressForm.pincode.trim()) {
      toast.error("Please fill in all mandatory address fields");
      return;
    }

    setAddressLoading(true);
    try {
      const res = await axios.post(`${API_URL}/addresses`, addressForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Delivery address saved successfully!");
      setIsAddressModalOpen(false);
      setAddressForm({
        name: user?.name || "",
        mobile: user?.phone || "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        addressType: "Home",
      });
      // Refresh addresses
      const updated = await axios.get(`${API_URL}/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(updated.data)) {
        setData((prev) => ({ ...prev, addresses: updated.data }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save address");
    } finally {
      setAddressLoading(false);
    }
  };

  // Metrics calculation
  const totalOrders = data.orders.length;
  const activeOrders = data.orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.order_status)
  );
  const activeOrder = activeOrders[0] || null;
  const completedOrders = data.orders.filter((o) => o.order_status === "delivered");
  const totalSpent = data.orders.reduce(
    (sum, o) => sum + (o.payment_status === "paid" ? o.total : 0),
    0
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
      case "cod_confirmed":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 font-medium">Order Placed</Badge>;
      case "confirmed":
      case "accepted":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 font-medium">Confirmed</Badge>;
      case "processing":
      case "shipped":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/60 font-medium">Processing</Badge>;
      case "out_for_delivery":
      case "on_the_way":
        return <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60 font-medium animate-pulse">Out for Delivery</Badge>;
      case "delivered":
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 font-medium">Delivered</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 font-medium">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{status?.replace("_", " ")}</Badge>;
    }
  };

  const quickActions = [
    {
      icon: Pill,
      label: "Browse Medicines",
      desc: "Authentic OTC & Rx drugs",
      href: "/medicines",
      accent: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/60",
    },
    {
      icon: ScanLine,
      label: "Scan Prescription",
      desc: "Instant AI drug extraction",
      href: "/prescription-scan",
      accent: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200/60 dark:border-cyan-800/60",
    },
    {
      icon: MessageSquare,
      label: "AI Doctor Chat",
      desc: "24/7 clinical guidance",
      href: "/doctor-chat",
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/60",
    },
    {
      icon: Stethoscope,
      label: "Consult Specialist",
      desc: "Direct video appointments",
      href: "/consult-doctor",
      accent: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-800/60",
    },
  ];

  return (
    <div className="min-h-[100dvh] glass-ambient-mesh flex flex-col selection:bg-emerald-500/20">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ================= PATIENT HERO PROFILE ================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-800">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/20 blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" aria-hidden="true" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-semibold border border-cyan-500/25">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Verified Patient Account · Hyperlocal Express
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white" data-testid="dashboard-title">
                {t("dashboard:welcome", { name: user?.name ? user.name.split(" ")[0] : "Patient" })}! 👋
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
                Manage your digital prescriptions, active medicine shipments, and 24/7 licensed doctor consultations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link to="/prescription-scan">
                <Button className="rounded-xl h-11 px-5 font-semibold bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all active:scale-95">
                  <ScanLine className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t("common:nav.upload_rx")}
                </Button>
              </Link>
              <Link to="/orders">
                <Button variant="ghost" className="rounded-xl h-11 px-5 font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all active:scale-95">
                  <Package className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t("common:nav.my_orders")}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ================= ACTIVE ORDER RADAR (SPOTLIGHT) ================= */}
        {activeOrder && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-blue-50/80 via-background to-cyan-50/50 dark:from-blue-950/30 dark:via-background dark:to-cyan-950/20 p-5 sm:p-6 shadow-md"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase">
                    <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                    Live Shipment
                  </span>
                  {getStatusBadge(activeOrder.order_status)}
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    #{activeOrder._id?.slice(0, 8)}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Your order is currently {activeOrder.order_status?.replace(/_/g, " ")}.
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Dispatching {activeOrder.items?.length || 0} item(s) to{" "}
                  <span className="font-medium text-foreground">
                    {activeOrder.address?.addressLine1 || "saved address"}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                {activeOrder.delivery_otp && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-4 py-2 text-center">
                    <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                      Delivery OTP
                    </p>
                    <p className="font-mono text-xl font-black text-emerald-800 dark:text-emerald-300 tabular-nums">
                      {activeOrder.delivery_otp}
                    </p>
                  </div>
                )}
                <Link to={`/orders/${activeOrder._id}`}>
                  <Button className="rounded-xl h-11 px-5 font-semibold shadow-sm hover:shadow transition-all active:scale-95">
                    <Truck className="h-4 w-4 mr-2" aria-hidden="true" />
                    Live Tracking
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= CLINICAL METRICS BENTO ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Active Orders */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Orders
                </p>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Package className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-heading text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                  {activeOrders.length}
                </span>
                <span className="text-xs text-muted-foreground font-medium">in transit</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Prescriptions */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Digital Rx
                </p>
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-heading text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                  {data.prescriptions.length}
                </span>
                <span className="text-xs text-muted-foreground font-medium">verified</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Total Spent */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Health Spent
                </p>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-base font-semibold text-muted-foreground">₹</span>
                <span className="font-heading text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                  {totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Saved Locations */}
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Saved Hubs
                </p>
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-heading text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                  {data.addresses.length}
                </span>
                <span className="text-xs text-muted-foreground font-medium">addresses</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= CLINICAL SHORTCUT TILES ================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action, idx) => (
            <Link key={idx} to={action.href} className="group">
              <div className={`p-4 rounded-2xl border transition-all duration-200 hover:shadow-md active:scale-95 h-full flex flex-col justify-between ${action.accent}`}>
                <div className="flex items-center justify-between mb-3">
                  <action.icon className="h-5 w-5" aria-hidden="true" />
                  <ArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-foreground">
                    {action.label}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {action.desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ================= INTERACTIVE HUB TABS ================= */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-3">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {[
                { id: "overview", label: "Recent Orders", count: data.orders.length },
                { id: "prescriptions", label: "Digital Rx", count: data.prescriptions.length },
                { id: "addresses", label: "Saved Addresses", count: data.addresses.length },
                { id: "care", label: "Health Hub & AI Care" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap active:scale-95 ${
                    activeTab === tab.id
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        activeTab === tab.id
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-muted-foreground"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === "addresses" && (
              <Button
                onClick={() => setIsAddressModalOpen(true)}
                size="sm"
                className="rounded-xl font-semibold active:scale-95"
              >
                <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Add Address
              </Button>
            )}
            {activeTab === "overview" && data.orders.length > 0 && (
              <Link to="/orders">
                <Button variant="ghost" size="sm" className="font-semibold text-primary hover:text-primary">
                  View All Orders →
                </Button>
              </Link>
            )}
          </div>

          {/* TAB 1: RECENT ORDERS */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-28 rounded-2xl w-full" />
                  ))}
                </div>
              ) : error ? (
                <Card className="text-center py-10 border-destructive/20 bg-destructive/5">
                  <CardContent className="space-y-3">
                    <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
                    <p className="text-sm font-medium text-foreground">{error}</p>
                    <Button onClick={fetchDashboardData} size="sm" variant="outline" className="rounded-xl">
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : data.orders.length === 0 ? (
                <Card className="text-center py-12 rounded-3xl border-dashed">
                  <CardContent className="space-y-4 max-w-md mx-auto">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <ShoppingCart className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold">No orders placed yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Find medications, wellness essentials, and genuine generic drugs with instant 28-min dispatch.
                      </p>
                    </div>
                    <Link to="/medicines">
                      <Button className="rounded-xl px-6 font-semibold shadow-md active:scale-95">
                        Browse Medicine Catalog
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {data.orders.slice(0, 4).map((order) => (
                    <div
                      key={order._id}
                      className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-card hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {getStatusBadge(order.order_status)}
                          <span className="text-xs font-mono font-medium text-muted-foreground tabular-nums">
                            Order #{order._id?.slice(0, 8)}...
                          </span>
                          <button
                            onClick={() => copyToClipboard(order._id, order._id)}
                            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                            aria-label="Copy Order ID"
                          >
                            {copiedOrderId === order._id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <span className="text-xs text-muted-foreground">
                            • {new Date(order.createdAt || order.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                        </div>

                        {/* Items Preview */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {order.items?.slice(0, 3).map((item, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center text-xs bg-slate-100 dark:bg-slate-800 text-foreground px-2.5 py-1 rounded-lg"
                            >
                              {item.name} <span className="text-muted-foreground ml-1">×{item.quantity}</span>
                            </span>
                          ))}
                          {order.items?.length > 3 && (
                            <span className="text-xs text-muted-foreground self-center">
                              +{order.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="text-left sm:text-right">
                          <p className="font-heading text-xl font-bold tabular-nums text-foreground">
                            ₹{order.total?.toFixed(2)}
                          </p>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                            {order.payment_method?.toUpperCase()} · {order.payment_status}
                          </p>
                        </div>
                        <Link to={`/orders/${order._id}`}>
                          <Button variant="outline" size="sm" className="rounded-xl font-semibold active:scale-95">
                            Track Order
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIGITAL PRESCRIPTIONS */}
          {activeTab === "prescriptions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">Saved Prescriptions</h3>
                  <p className="text-xs text-muted-foreground">
                    Uploaded digital Rx scripts for quick re-ordering and chronic refills.
                  </p>
                </div>
                <Link to="/prescription-scan">
                  <Button size="sm" className="rounded-xl font-semibold active:scale-95">
                    <ScanLine className="h-4 w-4 mr-1.5" />
                    New Rx Scan
                  </Button>
                </Link>
              </div>

              {data.prescriptions.length === 0 ? (
                <Card className="text-center py-12 rounded-3xl border-dashed">
                  <CardContent className="space-y-4 max-w-md mx-auto">
                    <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
                      <ScanLine className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="font-heading text-lg font-bold">No prescriptions uploaded yet</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload your doctor&apos;s prescription to automatically identify medications and order refills.
                      </p>
                    </div>
                    <Link to="/prescription-scan">
                      <Button className="rounded-xl px-6 font-semibold shadow-md active:scale-95">
                        Scan Doctor&apos;s Prescription
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.prescriptions.map((rx, idx) => (
                    <Card key={rx._id || idx} className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 hover:shadow-md transition-shadow">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                            Digital Rx #{idx + 1}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(rx.createdAt || Date.now()).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {rx.doctor_name ? `Dr. ${rx.doctor_name}` : "Verified Prescription"}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {rx.notes || "Contains scheduled prescription medication verified for delivery."}
                          </p>
                        </div>
                        {rx.file_url && (
                          <button
                            type="button"
                            onClick={() => handleViewPrescription(rx.file_url)}
                            disabled={viewingRxLoading}
                            className="inline-flex items-center text-xs font-semibold text-primary hover:underline pt-1 disabled:opacity-50 cursor-pointer"
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            {viewingRxLoading ? "Loading Rx..." : "View Attached File"}
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">Delivery Locations</h3>
                  <p className="text-xs text-muted-foreground">
                    Addresses used for neighborhood pharmacy dispatch and cold-chain routing.
                  </p>
                </div>
              </div>

              {data.addresses.length === 0 ? (
                <Card className="text-center py-12 rounded-3xl border-dashed">
                  <CardContent className="space-y-4 max-w-md mx-auto">
                    <div className="h-14 w-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                      <MapPin className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="font-heading text-lg font-bold">No delivery addresses saved</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Save your home or workplace address for instantaneous 1-click medicine checkout.
                      </p>
                    </div>
                    <Button onClick={() => setIsAddressModalOpen(true)} className="rounded-xl px-6 font-semibold shadow-md active:scale-95">
                      Add New Delivery Address
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.addresses.map((addr, idx) => (
                    <Card key={addr._id || idx} className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 hover:shadow-md transition-shadow relative overflow-hidden">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-foreground text-xs font-semibold">
                            {addr.addressType === "Work" ? (
                              <Briefcase className="h-3 w-3 text-primary" />
                            ) : addr.addressType === "Home" ? (
                              <Home className="h-3 w-3 text-primary" />
                            ) : (
                              <Building2 className="h-3 w-3 text-primary" />
                            )}
                            {addr.addressType || "Delivery Hub"}
                          </div>
                          {idx === 0 && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                              Default
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-sm text-foreground">{addr.name}</p>
                          <p className="text-xs text-muted-foreground">{addr.mobile}</p>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
                          <p className="text-foreground font-medium">{addr.addressLine1}</p>
                          {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                          <p className="tabular-nums">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          {addr.landmark && (
                            <p className="italic text-[11px] text-muted-foreground/80">
                              Near: {addr.landmark}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HEALTH HUB & CARE */}
          {activeTab === "care" && (
            <div className="grid md:grid-cols-3 gap-5">
              <Card className="rounded-2xl border-cyan-200/60 dark:border-cyan-900/40 bg-gradient-to-br from-cyan-50/50 to-background dark:from-cyan-950/20 dark:to-background p-6 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <ScanLine className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-lg text-foreground">AI Prescription Scanner</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Instantly extract medicine salts, dosage frequencies, and safety interaction alerts with computer vision.
                  </p>
                </div>
                <Link to="/prescription-scan">
                  <Button variant="outline" className="w-full rounded-xl font-semibold active:scale-95">
                    Launch AI Scanner
                  </Button>
                </Link>
              </Card>

              <Card className="rounded-2xl border-emerald-200/60 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/50 to-background dark:from-emerald-950/20 dark:to-background p-6 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-lg text-foreground">AI Medical Assistant</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Ask questions regarding medication timing, contraindications, and preliminary symptom analysis.
                  </p>
                </div>
                <Link to="/doctor-chat">
                  <Button variant="outline" className="w-full rounded-xl font-semibold active:scale-95">
                    Chat with AI Doctor
                  </Button>
                </Link>
              </Card>

              <Card className="rounded-2xl border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/50 to-background dark:from-blue-950/20 dark:to-background p-6 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-lg text-foreground">Specialist Tele-Consult</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Connect via encrypted video consult with verified cardiologists, dermatologists, and pediatricians.
                  </p>
                </div>
                <Link to="/consult-doctor">
                  <Button variant="outline" className="w-full rounded-xl font-semibold active:scale-95">
                    Book Specialist
                  </Button>
                </Link>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* ================= ADD ADDRESS MODAL ================= */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Add Delivery Address
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Used for dispatching orders from your neighborhood licensed pharmacy.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAddress} className="space-y-3.5 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="addr-name" className="text-xs font-semibold">Contact Name</Label>
                <Input
                  id="addr-name"
                  value={addressForm.name}
                  onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="h-10 rounded-xl text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="addr-phone" className="text-xs font-semibold">Mobile Number</Label>
                <Input
                  id="addr-phone"
                  value={addressForm.mobile}
                  onChange={(e) => setAddressForm({ ...addressForm, mobile: e.target.value })}
                  placeholder="9876543210"
                  className="h-10 rounded-xl text-sm tabular-nums"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="addr-line1" className="text-xs font-semibold">Address Line 1 (Flat/House/Street)</Label>
              <Input
                id="addr-line1"
                value={addressForm.addressLine1}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                placeholder="Flat 402, Sunshine Heights, MG Road"
                className="h-10 rounded-xl text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="addr-city" className="text-xs font-semibold">City</Label>
                <Input
                  id="addr-city"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  placeholder="Bengaluru"
                  className="h-10 rounded-xl text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="addr-pincode" className="text-xs font-semibold">PIN Code</Label>
                <Input
                  id="addr-pincode"
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  placeholder="560001"
                  className="h-10 rounded-xl text-sm tabular-nums"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="addr-state" className="text-xs font-semibold">State</Label>
                <Input
                  id="addr-state"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  placeholder="Karnataka"
                  className="h-10 rounded-xl text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="addr-landmark" className="text-xs font-semibold">Landmark (Optional)</Label>
                <Input
                  id="addr-landmark"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  placeholder="Opp. Apollo Clinic"
                  className="h-10 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Location Type</Label>
              <div className="flex gap-2">
                {["Home", "Work", "Other"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddressForm({ ...addressForm, addressType: type })}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      addressForm.addressType === type
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900 text-muted-foreground border-slate-200 dark:border-slate-800 hover:text-foreground"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addressLoading}
                className="rounded-xl font-semibold active:scale-95"
              >
                {addressLoading ? "Saving..." : "Save Address"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default DashboardPage;
