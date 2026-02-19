import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
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
  XCircle
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_URL = import.meta.env.VITE_API_URL;

const OrderTrackingPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Default Bangalore

  useEffect(() => {
    if (order?.address) {
      const fetchCoords = async () => {
        try {
          const query = `${order.address.addressLine1}, ${order.address.city}, ${order.address.pincode}, India`;
          const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
          if (res.data && res.data.length > 0) {
            setMapCenter([parseFloat(res.data[0].lat), parseFloat(res.data[0].lon)]);
          } else {
            // Fallback to City level if full address fails
            const cityRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(order.address.city + ", India")}&limit=1`);
            if (cityRes.data && cityRes.data.length > 0) {
              setMapCenter([parseFloat(cityRes.data[0].lat), parseFloat(cityRes.data[0].lon)]);
            }
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        }
      };
      fetchCoords();
    }
  }, [order]);

  // Modals state
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

  const handleCancelOrder = async () => {
    try {
      setActionLoading(true);
      await axios.post(`${API_URL}/orders/${id}/cancel`, {
        reason: "Cancelled by User via App"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsCancelModalOpen(false);
      fetchOrder();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to cancel order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnOrder = async () => {
    if (!returnComments.trim()) {
      alert("Please provide comments describing the issue.");
      return;
    }
    try {
      setActionLoading(true);
      await axios.post(`${API_URL}/orders/${id}/return`, {
        reason: returnReason,
        comments: returnComments,
        images: []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsReturnModalOpen(false);
      fetchOrder();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit return request");
    } finally {
      setActionLoading(false);
    }
  };

  const isCancellable = ["pending", "pending_verification", "confirmed"].includes(order?.order_status);

  const isReturnable = () => {
    if (order?.order_status !== "delivered") return false;
    let deliveredEvent = order?.status_history?.find(h => h.status === "delivered");
    let deliveredAt = deliveredEvent ? new Date(deliveredEvent.timestamp) : new Date(order.createdAt);
    return (Date.now() - deliveredAt.getTime()) <= (48 * 60 * 60 * 1000);
  };

  useEffect(() => {
    if (id && token) {
      fetchOrder();
      const interval = setInterval(fetchOrder, 5000); // Poll status every 5s
      return () => clearInterval(interval);
    }
  }, [id, token]);

  let displaySteps = [
    { status: "pending", label: "Order Placed", icon: Package },
    { status: "confirmed", label: "Confirmed", icon: CheckCircle },
    { status: "processing", label: "Processing", icon: Box },
    { status: "out_for_delivery", label: "Out for Delivery", icon: Truck },
    { status: "delivered", label: "Delivered", icon: CheckCircle }
  ];

  if (order?.order_status === "cancelled") {
    const history = order?.status_history?.map(h => h.status) || [];
    displaySteps = [{ status: "pending", label: "Order Placed", icon: Package }];
    if (history.includes("confirmed")) {
      displaySteps.push({ status: "confirmed", label: "Confirmed", icon: CheckCircle });
    }
    if (history.includes("processing") || history.includes("accepted")) {
      displaySteps.push({ status: "processing", label: "Processing", icon: Box });
    }
    displaySteps.push({ status: "cancelled", label: "Cancelled", icon: XCircle });
  }

  const getStepStatus = (stepStatus) => {
    if (order?.order_status === "cancelled") {
      if (stepStatus === "cancelled") return "cancelled";
      return "completed_cancelled";
    }

    const statusWeight = {
      "pending": 0,
      "confirmed": 1,
      "accepted": 2,
      "processing": 2,
      "picked_up": 2,
      "shipped": 2,
      "on_the_way": 2,
      "out_for_delivery": 3,
      "delivered": 4
    };

    const uiStepWeight = {
      "pending": 0,
      "confirmed": 1,
      "processing": 2,
      "out_for_delivery": 3,
      "delivered": 4
    };

    const currentWeight = statusWeight[order?.order_status] || 0;
    const stepWeight = uiStepWeight[stepStatus];

    if (currentWeight > stepWeight) return "completed";
    if (currentWeight === stepWeight) return "current";
    return "upcoming";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <Link to="/orders">
            <Button>View All Orders</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link to="/orders">
            <Button variant="ghost" className="pl-0 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <h1 className="font-heading text-3xl font-bold" data-testid="order-tracking-title">
            Track Order
          </h1>
          <p className="text-muted-foreground">Order ID: {order._id.slice(0, 8)}...</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Tracking Progress */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {displaySteps.map((step, index) => {
                    const status = getStepStatus(step.status);
                    const isLast = index === displaySteps.length - 1;
                    const nextIsCancelled = displaySteps[index + 1]?.status === "cancelled";

                    return (
                      <div key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
                        {/* Line */}
                        {!isLast && (
                          <div className={`absolute left-[19px] top-10 h-full w-0.5 ${nextIsCancelled ? "bg-destructive" :
                              (status === "completed" || status === "completed_cancelled") ? "bg-primary" : "bg-muted"
                            }`} />
                        )}

                        {/* Icon */}
                        <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${(status === "completed" || status === "completed_cancelled") ? "bg-primary text-white" :
                            status === "current" ? "bg-primary text-white animate-pulse" :
                              status === "cancelled" ? "bg-destructive text-white" :
                                "bg-muted text-muted-foreground"
                          }`}>
                          <step.icon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1.5">
                          <p className={`font-medium ${(status === "completed" || status === "completed_cancelled" || status === "current" || status === "cancelled") ? "text-foreground" : "text-muted-foreground"
                            }`}>
                            {step.label}
                          </p>
                          {order.status_history?.find(h => h.status === step.status) && (
                            <p className="text-sm text-muted-foreground">
                              {formatDate(order.status_history.find(h => h.status === step.status).timestamp)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* OTP Display for Customer */}
                {order.delivery_otp && order.order_status !== "delivered" && (
                  <div className="mt-8 bg-emerald-100 border-2 border-emerald-500 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-emerald-800 text-sm font-bold uppercase tracking-widest mb-1">
                      Share this OTP with Delivery Agent
                    </p>
                    <div className="text-4xl font-mono font-black text-emerald-700 tracking-[0.2em]">
                      {order.delivery_otp}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">₹{order.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map and Delivery Info */}
          <div className="space-y-6">
            {/* Map */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Delivery Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px] rounded-b-xl overflow-hidden">
                  <MapContainer
                    key={mapCenter.join(',')}
                    center={mapCenter}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />
                    <Marker position={mapCenter}>
                      <Popup>Delivery Location</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Delivery Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.address.addressLine1}</p>
                {order.address.addressLine2 && <p className="text-sm">{order.address.addressLine2}</p>}
                <p className="text-muted-foreground">
                  {order.address.city}, {order.address.state} - {order.address.pincode}
                </p>
                {order.address.landmark && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Near: {order.address.landmark}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium capitalize">{order.payment_method === "cod" ? "Cash on Delivery" : "Razorpay"}</p>
                    <Badge className={order.payment_status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800"}>
                      {order.payment_status}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-primary">₹{order.total.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {(isCancellable || isReturnable() || order.order_status === "return_requested" || order.order_status === "return_approved" || order.order_status === "return_rejected") && (
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  {order.order_status === "return_requested" && (
                    <div className="bg-amber-100 text-amber-800 p-4 rounded-xl flex items-center gap-3">
                      <Clock className="h-6 w-6" />
                      <div>
                        <p className="font-bold">Return Requested</p>
                        <p className="text-sm">We are reviewing your return request.</p>
                      </div>
                    </div>
                  )}
                  {order.order_status === "return_approved" && (
                    <div className="bg-emerald-100 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
                      <CheckCircle className="h-6 w-6" />
                      <div>
                        <p className="font-bold">Return Approved</p>
                        <p className="text-sm">Refund is being processed (3-5 days).</p>
                      </div>
                    </div>
                  )}
                  {order.order_status === "return_rejected" && (
                    <div className="bg-red-100 text-red-800 p-4 rounded-xl flex items-center gap-3">
                      <XCircle className="h-6 w-6" />
                      <div>
                        <p className="font-bold">Return Rejected</p>
                        <p className="text-sm">Your return request was not approved.</p>
                      </div>
                    </div>
                  )}

                  {isCancellable && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setIsCancelModalOpen(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </Button>
                  )}

                  {isReturnable() && (
                    <Button
                      variant="outline"
                      className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 mt-2"
                      onClick={() => setIsReturnModalOpen(true)}
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Request Return
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Support */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <Phone className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Contact our support team for any queries
                </p>
                <a href="tel:+917354255105">
                  <Button variant="outline">
                    Call Support
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cancellation Modal */}
        <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Cancel Order
              </DialogTitle>
              <DialogDescription>
                Are you absolutely sure you want to cancel this order? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>No, keep order</Button>
              <Button variant="destructive" onClick={handleCancelOrder} disabled={actionLoading}>
                {actionLoading ? "Cancelling..." : "Yes, Cancel Order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Return Modal */}
        <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCcw className="h-5 w-5 text-blue-500" />
                Request Return
              </DialogTitle>
              <DialogDescription>
                You can return delivered orders within 48 hours for valid reasons.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for return</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                >
                  <option value="Wrong medicine delivered">Wrong medicine delivered</option>
                  <option value="Damaged product">Damaged product</option>
                  <option value="Expired product">Expired product</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Comments</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Please describe the issue in detail..."
                  value={returnComments}
                  onChange={(e) => setReturnComments(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
              <Button onClick={handleReturnOrder} disabled={actionLoading || !returnComments.trim()}>
                {actionLoading ? "Submitting..." : "Submit Request"}
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
