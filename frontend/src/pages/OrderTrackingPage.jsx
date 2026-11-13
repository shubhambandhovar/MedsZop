import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  ArrowLeft,
  Phone,
  Box,
  AlertCircle,
  RefreshCcw,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Lock,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const API_URL = import.meta.env.VITE_API_URL;

const OrderTrackingPage = () => {
  const { t } = useTranslation(['orders', 'common']);
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const { token } = useAuth();
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Default Bengaluru

  // Modal states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [returnReason, setReturnReason] = useState("Damaged product");
  const [returnComments, setReturnComments] = useState("");

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(response.data);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && token) {
      fetchOrder();
      const interval = setInterval(fetchOrder, 8000); // Poll status every 8s
      return () => clearInterval(interval);
    }
  }, [id, token]);

  // Geocoding for delivery coordinates
  useEffect(() => {
    if (order?.address) {
      const fetchCoords = async () => {
        try {
          const query = `${order.address.addressLine1}, ${order.address.city}, ${order.address.pincode}, India`;
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
          const data = await res.json();
          if (data && data.length > 0) {
            setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          } else {
            // Fallback to city
            const cityRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(order.address.city + ", India")}&limit=1`);
            const cityData = await cityRes.json();
            if (cityData && cityData.length > 0) {
              setMapCenter([parseFloat(cityData[0].lat), parseFloat(cityData[0].lon)]);
            }
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        }
      };
      fetchCoords();
    }
  }, [order]);

  const copyToClipboard = (text, type = "id") => {
    navigator.clipboard.writeText(text);
    if (type === "otp") {
      setCopiedOtp(true);
      toast.success("Delivery OTP copied to clipboard!");
      setTimeout(() => setCopiedOtp(false), 2000);
    } else {
      setCopiedId(true);
      toast.success("Order ID copied to clipboard!");
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setActionLoading(true);
      await axios.post(
        `${API_URL}/orders/${id}/cancel`,
        { reason: "Cancelled by patient via portal" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Order cancelled successfully");
      setIsCancelModalOpen(false);
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnOrder = async () => {
    if (!returnComments.trim()) {
      toast.error("Please provide comments describing the issue.");
      return;
    }
    try {
      setActionLoading(true);
      await axios.post(
        `${API_URL}/orders/${id}/return`,
        {
          reason: returnReason,
          comments: returnComments,
          images: []
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Return request submitted for clinical review");
      setIsReturnModalOpen(false);
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit return request");
    } finally {
      setActionLoading(false);
    }
  };

  const isCancellable = ["pending", "pending_verification", "confirmed", "cod_confirmed", "payment_pending"].includes(order?.order_status);

  const isReturnable = () => {
    if (order?.order_status !== "delivered") return false;
    let deliveredEvent = order?.status_history?.find((h) => h.status === "delivered");
    let deliveredAt = deliveredEvent ? new Date(deliveredEvent.timestamp) : new Date(order.createdAt || order.created_at);
    return Date.now() - deliveredAt.getTime() <= 48 * 60 * 60 * 1000;
  };

  // Steps Configuration
  let displaySteps = [
    { status: "pending", label: "Order Placed", desc: "Order recorded in clinical queue", icon: Package },
    { status: "confirmed", label: "Pharmacist Verified", desc: "Batch & expiry verified by pharmacist", icon: ShieldCheck },
    { status: "processing", label: "Cold-Chain Packed", desc: "Sealed in tamper-evident packaging", icon: Box },
    { status: "out_for_delivery", label: "Out for Delivery", desc: "Agent en route with temperature insulation", icon: Truck },
    { status: "delivered", label: "Delivered", desc: "Securely handed over with OTP verification", icon: CheckCircle }
  ];

  if (order?.order_status === "cancelled") {
    const history = order?.status_history?.map((h) => h.status) || [];
    displaySteps = [
      { status: "pending", label: "Order Placed", desc: "Order recorded in clinical queue", icon: Package }
    ];
    if (history.includes("confirmed")) {
      displaySteps.push({ status: "confirmed", label: "Pharmacist Verified", desc: "Verified by licensed pharmacist", icon: ShieldCheck });
    }
    if (history.includes("processing") || history.includes("accepted")) {
      displaySteps.push({ status: "processing", label: "Processing", desc: "Order packed", icon: Box });
    }
    displaySteps.push({ status: "cancelled", label: "Cancelled", desc: "Order was cancelled", icon: XCircle });
  }

  const getStepStatus = (stepStatus) => {
    if (order?.order_status === "cancelled") {
      if (stepStatus === "cancelled") return "cancelled";
      return "completed_cancelled";
    }

    const statusWeight = {
      pending: 0,
      cod_confirmed: 0,
      confirmed: 1,
      accepted: 2,
      processing: 2,
      picked_up: 2,
      shipped: 2,
      on_the_way: 2,
      out_for_delivery: 3,
      delivered: 4
    };

    const uiStepWeight = {
      pending: 0,
      confirmed: 1,
      processing: 2,
      out_for_delivery: 3,
      delivered: 4
    };

    const currentWeight = statusWeight[order?.order_status] || 0;
    const stepWeight = uiStepWeight[stepStatus];

    if (currentWeight > stepWeight) return "completed";
    if (currentWeight === stepWeight) return "current";
    return "upcoming";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-50/50 dark:bg-slate-950 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <Skeleton className="h-[420px] rounded-3xl" />
              <Skeleton className="h-[280px] rounded-3xl" />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <Skeleton className="h-[320px] rounded-3xl" />
              <Skeleton className="h-[200px] rounded-3xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[100dvh] bg-slate-50/50 dark:bg-slate-950 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto px-4 py-20 text-center space-y-5">
          <div className="h-16 w-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl font-bold text-foreground">Order Not Found</h1>
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t retrieve details for the requested tracking ID. The order may have been archived or removed.
            </p>
          </div>
          <Link to="/orders">
            <Button className="rounded-xl px-6 font-semibold active:scale-95">
              Return to My Orders
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isDelivered = order.order_status === "delivered";
  const isCancelled = order.order_status === "cancelled";
  const isActive = !isDelivered && !isCancelled;

  return (
    <div className="min-h-[100dvh] glass-ambient-mesh flex flex-col selection:bg-emerald-500/20">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* ================= BREADCRUMB & HEADER ================= */}
        <div className="space-y-3">
          <Link to="/orders">
            <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground active-press">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Orders
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                  Live Dispatch
                </span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  Order #{order._id?.slice(0, 8)}...
                </span>
                <button
                  onClick={() => copyToClipboard(order._id, "id")}
                  className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                  aria-label="Copy Order ID"
                >
                  {copiedId ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <h1
                className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1"
                data-testid="order-tracking-title"
              >
                {t("orders:tracking.title")}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Placed on {formatDate(order.createdAt || order.created_at)} • Hyperlocal Cold-Chain Express
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isActive && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 text-xs font-bold">
                  <span className="h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                  28-Min Express Target
                </div>
              )}
              {isDelivered && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  Successfully Delivered
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= 2-COLUMN MAIN TRACKING GRID ================= */}
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* ================= LEFT COLUMN: TIMELINE & ITEMS ================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* SECURE DELIVERY OTP PASSCARD */}
            {order.delivery_otp && !isDelivered && !isCancelled && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-cyan-500/10 p-6 shadow-sm relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      <Lock className="h-3.5 w-3.5" />
                      Secure Handover Passcode
                    </div>
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      Share this OTP with your delivery agent
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Do not share this code over phone. Only provide upon physical receipt of your sealed medicine parcel.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-card border-2 border-emerald-500/30 rounded-2xl px-5 py-3 shadow-xs shrink-0">
                    <span className="font-mono text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-[0.25em] tabular-nums">
                      {order.delivery_otp}
                    </span>
                    <button
                      onClick={() => copyToClipboard(order.delivery_otp, "otp")}
                      className="p-2 text-muted-foreground hover:text-foreground transition-all rounded-lg active-press"
                      aria-label="Copy OTP"
                    >
                      {copiedOtp ? (
                        <Check className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CLINICAL ORDER TIMELINE */}
            <Card className="rounded-3xl border-border bg-card shadow-xs">
              <CardHeader className="p-4 sm:p-6 pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading text-xl font-bold flex items-center gap-2.5">
                    <Clock className="h-5 w-5 text-primary" />
                    Delivery Timeline
                  </CardTitle>
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Pharmacist Supervised
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="relative pl-2">
                  {displaySteps.map((step, index) => {
                    const status = getStepStatus(step.status);
                    const isLast = index === displaySteps.length - 1;
                    const nextIsCancelled = displaySteps[index + 1]?.status === "cancelled";
                    const historyEvent = order.status_history?.find((h) => h.status === step.status);

                    return (
                      <div key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
                        {/* Connecting Line */}
                        {!isLast && (
                          <div
                            className={`absolute left-[19px] top-10 h-full w-0.5 transition-colors ${
                              nextIsCancelled
                                ? "bg-destructive"
                                : status === "completed" || status === "completed_cancelled"
                                ? "bg-primary"
                                : "bg-slate-200 dark:bg-slate-800"
                            }`}
                          />
                        )}

                        {/* Step Icon Indicator */}
                        <div
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all ${
                            status === "completed" || status === "completed_cancelled"
                              ? "bg-primary text-white"
                              : status === "current"
                              ? "bg-primary text-white ring-4 ring-primary/20 animate-pulse"
                              : status === "cancelled"
                              ? "bg-destructive text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                          }`}
                        >
                          <step.icon className="h-5 w-5" aria-hidden="true" />
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 pt-1">
                          <div className="flex items-baseline justify-between gap-2 flex-wrap">
                            <p
                              className={`font-heading text-sm font-bold ${
                                status === "completed" || status === "completed_cancelled" || status === "current"
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {step.label}
                            </p>
                            {historyEvent && (
                              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                                {formatDate(historyEvent.timestamp)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ORDER ITEMS & MEDICINE DOSAGE TABLE */}
            <Card className="rounded-3xl border-border bg-card shadow-xs">
              <CardHeader className="p-4 sm:p-6 pb-3 border-b border-border/60">
                <CardTitle className="font-heading text-xl font-bold flex items-center gap-2.5">
                  <Package className="h-5 w-5 text-primary" />
                  Prescribed Medication ({order.items?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="divide-y divide-border/60">
                  {order.items?.map((item, index) => (
                    <div key={index} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-sm text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: <span className="font-medium text-foreground">{item.quantity}</span> • ₹{item.price?.toFixed(2)} each
                        </p>
                      </div>
                      <p className="font-heading font-bold text-sm text-foreground tabular-nums">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="my-3" />

                {/* Price Breakdown */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span className="font-medium tabular-nums text-foreground">₹{order.total?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cold-Chain Express Delivery (28m)</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Licensed Pharmacist Verification</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">INCLUDED</span>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-heading text-base font-bold text-foreground">Total Paid Amount</span>
                  <span className="font-heading text-2xl font-black text-primary tabular-nums">
                    ₹{order.total?.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ================= RIGHT COLUMN: MAP & DELIVERY INFO ================= */}
          <div className="lg:col-span-5 space-y-6">
            {/* LIVE LEAFLET ROUTING MAP */}
            <Card className="rounded-3xl border-border bg-card shadow-xs overflow-hidden">
              <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/40">
                <CardTitle className="font-heading text-base font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Delivery Destination Map
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[280px] w-full overflow-hidden relative">
                  <MapContainer
                    key={mapCenter.join(",")}
                    center={mapCenter}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />
                    <Marker position={mapCenter}>
                      <Popup>
                        <div className="text-xs font-semibold p-1">
                          Delivery: {order.address?.addressLine1}
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                  <div className="absolute bottom-3 left-3 z-[400] bg-background/90 backdrop-blur px-3 py-1.5 rounded-xl border border-border shadow-xs text-[11px] font-semibold text-foreground">
                    📍 Destination: {order.address?.city || "Customer Address"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DELIVERY ADDRESS DETAILS */}
            <Card className="rounded-3xl border-border bg-card shadow-xs">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="font-heading text-base font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Delivery Address & Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-2 space-y-3">
                <div>
                  <p className="font-semibold text-sm text-foreground">{order.address?.name || "Recipient"}</p>
                  {order.address?.mobile && (
                    <p className="text-xs text-muted-foreground font-mono tabular-nums">{order.address.mobile}</p>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p className="text-foreground font-medium">{order.address?.addressLine1}</p>
                  {order.address?.addressLine2 && <p>{order.address.addressLine2}</p>}
                  <p className="tabular-nums">
                    {order.address?.city}, {order.address?.state} - {order.address?.pincode}
                  </p>
                  {order.address?.landmark && (
                    <p className="italic text-muted-foreground/80 mt-1">
                      Near: {order.address.landmark}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* PAYMENT INFORMATION */}
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 shadow-md">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="font-heading text-base font-bold">
                  Payment Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Method</p>
                    <p className="font-semibold text-sm text-foreground capitalize mt-0.5">
                      {order.payment_method === "cod" ? "Cash on Delivery" : "Online (Razorpay / UPI)"}
                    </p>
                  </div>
                  <Badge
                    className={
                      order.payment_status === "paid"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200"
                    }
                  >
                    {order.payment_status === "paid" ? "Payment Completed" : "Payment Pending"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* ACTION CARD (CANCEL / RETURN STATUS) */}
            {(isCancellable ||
              isReturnable() ||
              order.order_status === "return_requested" ||
              order.order_status === "return_approved" ||
              order.order_status === "return_rejected") && (
              <Card className="rounded-3xl border-border bg-card shadow-xs">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  {order.order_status === "return_requested" && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 p-4 rounded-2xl flex items-start gap-3">
                      <Clock className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">Return Under Review</p>
                        <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                          Our clinical team is reviewing your return request. We will update you within 24 hours.
                        </p>
                      </div>
                    </div>
                  )}

                  {order.order_status === "return_approved" && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 p-4 rounded-2xl flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">Return Approved</p>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                          Refund is being credited back to your original payment method (3-5 business days).
                        </p>
                      </div>
                    </div>
                  )}

                  {order.order_status === "return_rejected" && (
                    <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 p-4 rounded-2xl flex items-start gap-3">
                      <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">Return Request Rejected</p>
                        <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
                          Prescription medicines with broken seals cannot be returned per Pharmacy Council regulations.
                        </p>
                      </div>
                    </div>
                  )}

                  {isCancellable && (
                    <Button
                      variant="destructive"
                      className="w-full h-11 rounded-xl text-xs sm:text-sm font-semibold active-press"
                      onClick={() => setIsCancelModalOpen(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </Button>
                  )}

                  {isReturnable() && (
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl text-xs sm:text-sm font-semibold text-primary border-primary/30 hover:bg-primary/5 active-press"
                      onClick={() => setIsReturnModalOpen(true)}
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Request 48-Hour Return
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 24/7 PATIENT SUPPORT HOTLINE */}
            <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-primary/5 to-cyan-500/5 p-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-foreground">Need Order Assistance?</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Speak directly with our clinical pharmacist helpline for order queries or prescription clarification.
                </p>
              </div>
              <a href="tel:+917354255105" className="inline-block w-full">
                <Button variant="outline" className="w-full rounded-xl font-semibold active:scale-95">
                  <Phone className="h-3.5 w-3.5 mr-2" />
                  Call Support (+91 73542 55105)
                </Button>
              </a>
            </Card>
          </div>
        </div>

        {/* ================= CANCELLATION DIALOG ================= */}
        <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl font-bold flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Cancel Order Confirmation
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Are you sure you want to cancel this order? If payment was completed, a full refund will be initiated instantly to your original payment source.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" className="h-11 rounded-xl text-xs sm:text-sm" onClick={() => setIsCancelModalOpen(false)}>
                Keep My Order
              </Button>
              <Button
                variant="destructive"
                className="h-11 rounded-xl text-xs sm:text-sm font-semibold active-press"
                onClick={handleCancelOrder}
                disabled={actionLoading}
              >
                {actionLoading ? "Cancelling..." : "Yes, Cancel Order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ================= RETURN DIALOG ================= */}
        <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl font-bold flex items-center gap-2 text-primary">
                <RefreshCcw className="h-5 w-5" />
                Request Return (48h Window)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Delivered medicines can be returned within 48 hours for damaged, incorrect, or expired items.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Reason for Return</label>
                <select
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                >
                  <option value="Wrong medicine delivered">Wrong medicine delivered</option>
                  <option value="Damaged product">Damaged product or broken tamper seal</option>
                  <option value="Expired product">Near expiry or expired product</option>
                  <option value="Other">Other clinical discrepancy</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Additional Comments</label>
                <textarea
                  className="flex min-h-[90px] w-full rounded-xl border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="Describe the issue with your medication package..."
                  value={returnComments}
                  onChange={(e) => setReturnComments(e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="h-11 rounded-xl text-xs sm:text-sm" onClick={() => setIsReturnModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReturnOrder}
                disabled={actionLoading || !returnComments.trim()}
                className="h-11 rounded-xl text-xs sm:text-sm font-semibold active-press"
              >
                {actionLoading ? "Submitting..." : "Submit Return Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
};

export default OrderTrackingPage;
