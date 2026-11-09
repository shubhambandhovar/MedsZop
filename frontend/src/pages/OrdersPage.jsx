import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Eye,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  ScanLine,
  Pill,
  ArrowRight,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);
  const { token } = useAuth();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(
        err.response?.data?.message ||
        "Unable to load your orders right now. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Order ID copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status Filter Counts
  const counts = useMemo(() => {
    const c = { all: orders.length, active: 0, delivered: 0, cancelled: 0 };
    orders.forEach((o) => {
      if (o.order_status === "delivered") c.delivered += 1;
      else if (o.order_status === "cancelled") c.cancelled += 1;
      else c.active += 1;
    });
    return c;
  }, [orders]);

  // Filtered orders computation
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (statusFilter === "active") {
        if (["delivered", "cancelled"].includes(order.order_status)) return false;
      } else if (statusFilter === "delivered") {
        if (order.order_status !== "delivered") return false;
      } else if (statusFilter === "cancelled") {
        if (order.order_status !== "cancelled") return false;
      }

      // 2. Search Filter (Medicine name or Order ID)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = order._id?.toLowerCase().includes(query);
        const matchesItem = order.items?.some((item) =>
          item.name?.toLowerCase().includes(query)
        );
        return matchesId || matchesItem;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
      case "cod_confirmed":
        return <Clock className="h-3.5 w-3.5" aria-hidden="true" />;
      case "confirmed":
      case "accepted":
        return <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />;
      case "processing":
      case "shipped":
        return <Package className="h-3.5 w-3.5" aria-hidden="true" />;
      case "out_for_delivery":
      case "on_the_way":
        return <Truck className="h-3.5 w-3.5" aria-hidden="true" />;
      case "delivered":
        return <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />;
      case "cancelled":
        return <XCircle className="h-3.5 w-3.5" aria-hidden="true" />;
      default:
        return <Clock className="h-3.5 w-3.5" aria-hidden="true" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
      case "cod_confirmed":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60";
      case "confirmed":
      case "accepted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60";
      case "processing":
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60";
      case "out_for_delivery":
      case "on_the_way":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 animate-pulse";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800/60";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recent";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wider uppercase mb-2">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Patient Care Journey
            </div>
            <h1
              className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3"
              data-testid="orders-title"
            >
              <Package className="h-7 w-7 text-primary" aria-hidden="true" />
              My Orders & Refills
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Track live deliveries, review digital prescriptions, and re-order verified medications.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/prescription-scan">
              <Button variant="outline" className="rounded-xl font-semibold active-press text-xs sm:text-sm h-10 px-4">
                <ScanLine className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Scan Rx
              </Button>
            </Link>
            <Link to="/medicines">
              <Button className="rounded-xl font-semibold shadow-xs hover:shadow transition-all active-press text-xs sm:text-sm h-10 px-4">
                <Pill className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Browse Medicines
              </Button>
            </Link>
          </div>
        </div>

        {/* ================= SEARCH & STATUS FILTER BAR ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-border shadow-xs">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: "all", label: "All Orders", count: counts.all },
              { id: "active", label: "In Transit", count: counts.active },
              { id: "delivered", label: "Delivered", count: counts.delivered },
              { id: "cancelled", label: "Cancelled", count: counts.cancelled },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap active-press ${
                  statusFilter === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 text-xs px-2 py-0.5 rounded-full ${
                    statusFilter === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Search by medicine or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl text-xs sm:text-sm bg-muted/40 border-border"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ================= CONTENT STATES ================= */}
        {loading ? (
          <div className="space-y-4" role="status" aria-label="Loading orders">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl w-full" />
            ))}
          </div>
        ) : error ? (
          <Card className="text-center py-12 border-destructive/20 bg-destructive/5 dark:bg-destructive/10" role="alert">
            <CardContent className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertCircle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-1 text-foreground">
                  Failed to Load Orders
                </h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">{error}</p>
              </div>
              <Button
                onClick={fetchOrders}
                className="rounded-xl px-6 shadow-sm hover:shadow transition-all active:scale-95"
                data-testid="retry-orders-btn"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          /* Entirely Empty Orders State */
          <Card className="text-center py-16 rounded-3xl border-dashed">
            <CardContent className="max-w-lg mx-auto space-y-6">
              <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Package className="h-8 w-8" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading text-2xl font-bold text-foreground">No orders yet</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Experience cold-chain express medicine delivery straight from certified neighborhood pharmacies in 28 minutes.
                </p>
              </div>

              {/* Quick Therapeutic Discovery */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Common Patient Essentials:
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Fever & Pain", "Cold & Cough", "Diabetes Care", "Vitamins & Minerals", "First Aid Kit"].map(
                    (cat) => (
                      <Link key={cat} to={`/medicines?search=${encodeURIComponent(cat)}`}>
                        <span className="text-xs bg-card hover:bg-primary hover:text-white border px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer inline-flex items-center gap-1">
                          <Pill className="h-3 w-3" />
                          {cat}
                        </span>
                      </Link>
                    )
                  )}
                </div>
              </div>

              <Link to="/medicines">
                <Button className="rounded-xl px-8 h-12 font-semibold shadow-md hover:shadow-lg transition-all active:scale-95">
                  Browse Full Catalog
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          /* Filtered No-Results State */
          <Card className="text-center py-12 rounded-3xl">
            <CardContent className="space-y-4 max-w-md mx-auto">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Search className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-heading text-lg font-bold">No orders match your filter</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  We couldn&apos;t find any records matching &quot;{searchQuery}&quot; under &quot;{statusFilter}&quot;.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="rounded-xl active:scale-95"
              >
                Reset All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Filtered Orders List */
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card
                key={order._id}
                className="overflow-hidden rounded-2xl border-border bg-card hover:border-primary/40 hover:shadow-md transition-all"
                data-testid={`order-${order._id}`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
                    {/* Left Info Column */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getStatusColor(order.order_status)} px-2.5 py-1 text-xs font-semibold`}>
                          {getStatusIcon(order.order_status)}
                          <span className="ml-1.5 capitalize">{order.order_status?.replace(/_/g, " ")}</span>
                        </Badge>
                        <Badge variant="outline" className="border-border text-xs font-mono">
                          {order.payment_method?.toUpperCase()}
                        </Badge>
                        {order.payment_status === "paid" && (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium">
                            Paid
                          </Badge>
                        )}
                        {order.delivery_otp && order.order_status !== "delivered" && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                            OTP: {order.delivery_otp}
                          </span>
                        )}
                      </div>

                      {/* Order ID & Timestamp */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="font-mono font-medium text-foreground">
                          Order #{order._id?.slice(0, 8)}...
                        </span>
                        <button
                          onClick={() => copyToClipboard(order._id, order._id)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
                          aria-label="Copy Order ID"
                        >
                          {copiedId === order._id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <span>• Placed on {formatDate(order.createdAt || order.created_at)}</span>
                      </div>

                      {/* Items Pill Summary */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {order.items?.map((item, index) => (
                          <span
                            key={index}
                            className="text-xs bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border/50"
                          >
                            {item.name} <span className="text-muted-foreground ml-1">×{item.quantity}</span>
                          </span>
                        ))}
                      </div>

                      {/* Destination Note */}
                      {order.address?.city && (
                        <p className="text-[11px] text-muted-foreground">
                          Delivering to: {order.address.addressLine1}, {order.address.city} ({order.address.pincode})
                        </p>
                      )}
                    </div>

                    {/* Right Actions & Price Column */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-border shrink-0">
                      <div className="text-left lg:text-right">
                        <p className="font-heading text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                          ₹{order.total?.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.length || 0} item(s) total
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/orders/${order._id}`}>
                          <Button
                            className="rounded-xl px-4 sm:px-5 h-11 text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all active-press"
                            data-testid={`view-order-${order._id}`}
                          >
                            <Eye className="h-4 w-4 mr-1.5" aria-hidden="true" />
                            Track Order
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default OrdersPage;
