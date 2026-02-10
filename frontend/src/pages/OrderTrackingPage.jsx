import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
      const interval = setInterval(fetchOrder, 5000); // Poll status every 5s
      return () => clearInterval(interval);
    }
  }, [id, token]);

  const orderSteps = [
    { status: "pending", labelKey: "order_tracking.steps.placed", icon: Package },
    { status: "confirmed", labelKey: "order_tracking.steps.confirmed", icon: CheckCircle },
    { status: "processing", labelKey: "order_tracking.steps.processing", icon: Box },
    { status: "out_for_delivery", labelKey: "order_tracking.steps.out_for_delivery", icon: Truck },
    { status: "delivered", labelKey: "order_tracking.steps.delivered", icon: CheckCircle }
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

  const { t } = useTranslation();
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
          <h1 className="text-2xl font-bold mb-4">{t("order_tracking.not_found")}</h1>
          <Link to="/orders">
            <Button>{t("order_tracking.view_all_orders")}</Button>
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
              {t("order_tracking.back_to_orders")}
            </Button>
          </Link>
          <h1 className="font-heading text-3xl font-bold" data-testid="order-tracking-title">
            {t("order_tracking.title")}
          </h1>
          <p className="text-muted-foreground">{t("order_tracking.order_id", { id: order._id.slice(0, 8) })}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Tracking Progress */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {t("order_tracking.status")}
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
                            {t(step.labelKey)}
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
                      {t("order_tracking.share_otp")}
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
                  {t("order_tracking.items")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{t("order_tracking.quantity", { quantity: item.quantity })}</p>
                      </div>
                      <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>{t("order_tracking.total")}</span>
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
                  {t("order_tracking.delivery_location")}
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
                      <Popup>{t("order_tracking.delivery_location_popup")}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">{t("order_tracking.delivery_address")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.address.addressLine1}</p>
                {order.address.addressLine2 && <p className="text-sm">{order.address.addressLine2}</p>}
                <p className="text-muted-foreground">
                  {order.address.city}, {order.address.state} - {order.address.pincode}
                </p>
                {order.address.landmark && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("order_tracking.near_landmark", { landmark: order.address.landmark })}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">{t("order_tracking.payment_details")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium capitalize">{order.payment_method === "cod" ? t("order_tracking.cash_on_delivery") : t("order_tracking.razorpay")}</p>
                    <Badge className={order.payment_status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800"}>
                      {t(`order_tracking.payment_status.${order.payment_status}`)}
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
                <h3 className="font-semibold mb-1">{t("order_tracking.need_help")}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("order_tracking.contact_support")}
                </p>
                <Button variant="outline">
                  {t("order_tracking.call_support")}
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
