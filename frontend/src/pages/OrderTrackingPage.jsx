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
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  ArrowLeft,
  Phone,
  Box
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
    }
  }, [id, token]);

  const orderSteps = [
    { status: "pending", label: "Order Placed", icon: Package },
    { status: "confirmed", label: "Confirmed", icon: CheckCircle },
    { status: "processing", label: "Processing", icon: Box },
    { status: "out_for_delivery", label: "Out for Delivery", icon: Truck },
    { status: "delivered", label: "Delivered", icon: CheckCircle }
  ];

  const getStepStatus = (stepStatus) => {
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

    if (order?.order_status === "cancelled") return "cancelled";
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
                  {orderSteps.map((step, index) => {
                    const status = getStepStatus(step.status);
                    const isLast = index === orderSteps.length - 1;

                    return (
                      <div key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
                        {/* Line */}
                        {!isLast && (
                          <div className={`absolute left-[19px] top-10 h-full w-0.5 ${status === "completed" ? "bg-primary" : "bg-muted"
                            }`} />
                        )}

                        {/* Icon */}
                        <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${status === "completed" ? "bg-primary text-white" :
                          status === "current" ? "bg-primary text-white animate-pulse" :
                            status === "cancelled" ? "bg-destructive text-white" :
                              "bg-muted text-muted-foreground"
                          }`}>
                          <step.icon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1.5">
                          <p className={`font-medium ${status === "completed" || status === "current" ? "text-foreground" : "text-muted-foreground"
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

            {/* Contact Support */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <Phone className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Contact our support team for any queries
                </p>
                <Button variant="outline">
                  Call Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderTrackingPage;
