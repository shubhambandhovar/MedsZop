import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Truck,
  Package,
  MapPin,
  CheckCircle,
  Navigation,
  Clock,
  DollarSign,
  History,
  User,
  Phone,
  Info,
  ExternalLink,
  Eye,
  Store,
  Key
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "../components/ui/dialog";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
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

const DeliveryDashboardPage = () => {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [deliveryOTP, setDeliveryOTP] = useState("");
  const [orderToComplete, setOrderToComplete] = useState(null);

  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Default Bangalore
  const [userLocation, setUserLocation] = useState(null);

  // Get agent's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          // Only center on user if no orders have been loaded yet
          if (orders.length === 0) {
            setMapCenter(coords);
          }
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, []);

  const agentIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const orderIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Center on first active/available order when orders load
  useEffect(() => {
    const currentOrders = orders.filter(o => o.order_status !== "delivered");
    if (currentOrders.length > 0) {
      const firstWithCoords = currentOrders.find(o => o.address?.coordinates?.lat && o.address?.coordinates?.lon);
      if (firstWithCoords) {
        setMapCenter([firstWithCoords.address.coordinates.lat, firstWithCoords.address.coordinates.lon]);
      }
    } else if (userLocation) {
      // If no pending orders, center on user
      setMapCenter(userLocation);
    }
  }, [orders, userLocation]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/delivery/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleAcceptDelivery = async (orderId) => {
    try {
      await axios.post(`${API_URL}/delivery/accept/${orderId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Delivery accepted!");
      fetchOrders();
    } catch (error) {
      toast.error("Failed to accept delivery");
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await axios.post(`${API_URL}/delivery/status/${orderId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Status updated to ${status.replace(/_/g, ' ')}`);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const initiateCompletion = (orderId) => {
    setOrderToComplete(orderId);
    setDeliveryOTP("");
    setShowOTPDialog(true);
  };

  const handleCompleteDelivery = async () => {
    try {
      if (!deliveryOTP || deliveryOTP.length !== 4) {
        toast.error("Please enter a valid 4-digit OTP");
        return;
      }

      await axios.post(`${API_URL}/delivery/complete/${orderToComplete}`, { otp: deliveryOTP }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Delivery completed successfully!");
      setShowOTPDialog(false);
      setOrderToComplete(null);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete delivery. Check OTP.");
    }
  };

  const assignedOrders = orders.filter(o => o.delivery_agent_id === user?._id);
  const activeOrders = assignedOrders.filter(o => ["accepted", "picked_up", "shipped", "on_the_way", "out_for_delivery"].includes(o.order_status));

  const availableOrders = orders.filter(o =>
    !o.delivery_agent_id &&
    (
      ["confirmed", "processing"].includes(o.order_status) ||
      (o.order_status === "pending" && !o.pharmacy_id)
    )
  );
  const completedOrders = orders.filter(o => o.delivery_agent_id === user?._id && o.order_status === "delivered");

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/50",
      confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:border dark:border-blue-800/50",
      processing: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 dark:border dark:border-purple-800/50",
      out_for_delivery: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border dark:border-cyan-800/50",
      delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/50",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 dark:border dark:border-red-800/50"
    };
    return colors[status] || "bg-muted text-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
              <Truck className="h-3.5 w-3.5" />
              Agent Operations Hub
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3" data-testid="delivery-dashboard-title">
              Delivery Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage assigned pickups, live routes, and track your daily payouts</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/60 px-3 py-2 rounded-xl border border-border/50 self-start sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live GPS Tracking Active
          </div>
        </div>

        {/* Operational KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">
          <Card className="border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-card to-card shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Jobs</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{activeOrders.length}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Currently in transit</p>
            </CardContent>
          </Card>

          <Card className="border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-card shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Available</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{availableOrders.length}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Ready for pickup</p>
            </CardContent>
          </Card>

          <Card className="border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Delivered</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{completedOrders.length}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Completed today</p>
            </CardContent>
          </Card>

          <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Earned Today</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary mt-1">₹{(completedOrders.length * 50).toFixed(0)}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">₹50 base fee per drop</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Map */}
          <Card className="border border-border/70 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-lg sm:text-xl flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Live Route Map
                </CardTitle>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                  {orders.filter(o => o.order_status !== "delivered").length} Drops Marked
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="h-[280px] sm:h-[360px] lg:h-[480px] w-full overflow-hidden">
                <MapContainer
                  key={mapCenter.join(',')}
                  center={mapCenter}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  {/* Your Location */}
                  {userLocation && (
                    <Marker position={userLocation} icon={agentIcon}>
                      <Popup>Your Location (Agent)</Popup>
                    </Marker>
                  )}
                  {/* Order Locations */}
                  {orders.filter(o => o.order_status !== "delivered").map((order) => {
                    if (order.address?.coordinates?.lat && order.address?.coordinates?.lon) {
                      return (
                        <Marker
                          key={order._id}
                          position={[order.address.coordinates.lat, order.address.coordinates.lon]}
                          icon={orderIcon}
                        >
                          <Popup>
                            <div className="p-2 text-foreground">
                              <p className="font-bold text-sm">Order #{order._id.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">{order.address.addressLine1}</p>
                              <Badge className="mt-2 scale-75 origin-left">
                                {order.order_status}
                              </Badge>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    }
                    return null;
                  })}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Orders List / Tabs */}
          <div className="space-y-6">
            <Tabs defaultValue="available" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 h-12 p-1 bg-muted/60 rounded-xl">
                <TabsTrigger value="available" className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium rounded-lg">
                  <Package className="h-4 w-4 shrink-0" />
                  <span>Available</span>
                  <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 font-semibold">
                    {availableOrders.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="active" className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium rounded-lg">
                  <Navigation className="h-4 w-4 shrink-0" />
                  <span>Active</span>
                  <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-cyan-500/10 text-cyan-600 font-semibold">
                    {activeOrders.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium rounded-lg">
                  <History className="h-4 w-4 shrink-0" />
                  <span>History</span>
                  <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                    {completedOrders.length}
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Available Orders Tab */}
              <TabsContent value="available">
                <Card className="border border-border/70 shadow-sm">
                  <CardHeader className="p-4 sm:p-6 pb-2">
                    <CardTitle className="font-heading text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                      Available for Pickup
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Orders ready to be claimed by delivery partners</p>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-3">
                    {availableOrders.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-border/60 rounded-xl">
                        <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="font-medium text-sm text-foreground">No orders available right now</p>
                        <p className="text-xs text-muted-foreground mt-1">New orders from nearby pharmacies will appear here automatically</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {availableOrders.map((order) => (
                          <div key={order._id} className="p-4 bg-card border border-border/80 rounded-xl hover:border-primary/40 transition-all shadow-xs">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-base text-foreground">Order #{order._id.slice(-6).toUpperCase()}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {order.items.length} items • ₹{order.total.toFixed(2)}
                                </p>
                              </div>
                              <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                                +₹50 payout
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm mb-3.5 text-muted-foreground flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-primary shrink-0" />
                              <span className="truncate">{order.address?.city || 'Local area'}, {order.address?.pincode}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                              <Button
                                className="h-10 text-xs sm:text-sm font-medium"
                                variant="outline"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowDetails(true);
                                }}
                              >
                                <Info className="h-4 w-4 mr-1.5" />
                                Details
                              </Button>
                              <Button
                                className="h-10 text-xs sm:text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={() => handleAcceptDelivery(order._id)}
                              >
                                Accept Pickup
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Active Deliveries Tab */}
              <TabsContent value="active">
                <Card className="border border-border/70 shadow-sm">
                  <CardHeader className="p-4 sm:p-6 pb-2">
                    <CardTitle className="font-heading text-lg flex items-center gap-2">
                      <Truck className="h-5 w-5 text-cyan-500" />
                      En-route Deliveries
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Deliveries currently in progress under your supervision</p>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-3">
                    {activeOrders.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-border/60 rounded-xl">
                        <Truck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="font-medium text-sm text-foreground">No active deliveries</p>
                        <p className="text-xs text-muted-foreground mt-1">Accept an available order to begin route navigation</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeOrders.map((order) => (
                          <div key={order._id} className="p-4 sm:p-5 bg-card border-2 border-primary/20 dark:border-primary/30 rounded-xl shadow-xs">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-base text-foreground">Order #{order._id.slice(-6).toUpperCase()}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {order.address?.addressLine1}
                                </p>
                              </div>
                              <Badge className={getStatusBadge(order.order_status)}>
                                {order.order_status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex flex-col gap-2.5 mt-4">
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  className="h-10 text-xs sm:text-sm font-medium"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                    setShowDetails(true);
                                  }}
                                >
                                  <Info className="h-4 w-4 mr-1.5" />
                                  Details
                                </Button>
                                <Button
                                  className="h-10 text-xs sm:text-sm font-medium bg-cyan-600 hover:bg-cyan-700 text-white border-none"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("Map button clicked for order:", order._id);
                                    if (order.address?.coordinates?.lat) {
                                      setMapCenter([order.address.coordinates.lat, order.address.coordinates.lon]);
                                      toast.info("Map focused on delivery location");
                                    } else {
                                      toast.error("No coordinates found for this order");
                                    }
                                  }}
                                >
                                  <Navigation className="h-4 w-4 mr-1.5" />
                                  Focus Map
                                </Button>
                              </div>

                              {/* Dynamic Status Progression Buttons */}
                              {order.order_status === "accepted" && (
                                <Button className="w-full h-11 text-xs sm:text-sm font-semibold" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order._id, "picked_up"); }}>
                                  <Package className="h-4 w-4 mr-2" /> Mark Picked Up
                                </Button>
                              )}
                              {order.order_status === "picked_up" && (
                                <Button className="w-full h-11 text-xs sm:text-sm font-semibold" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order._id, "shipped"); }}>
                                  <Truck className="h-4 w-4 mr-2" /> Mark Shipped
                                </Button>
                              )}
                              {order.order_status === "shipped" && (
                                <Button className="w-full h-11 text-xs sm:text-sm font-semibold" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order._id, "on_the_way"); }}>
                                  <Navigation className="h-4 w-4 mr-2" /> Mark On The Way
                                </Button>
                              )}
                              {order.order_status === "on_the_way" && (
                                <Button className="w-full h-11 text-xs sm:text-sm font-semibold" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order._id, "out_for_delivery"); }}>
                                  <Truck className="h-4 w-4 mr-2" /> Mark Out For Delivery
                                </Button>
                              )}
                              {order.order_status === "out_for_delivery" && (
                                <Button
                                  className="w-full h-11 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    initiateCompletion(order._id);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" /> Mark Delivered (Enter OTP)
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Completed Deliveries Tab */}
              <TabsContent value="completed">
                <Card className="border border-border/70 shadow-sm">
                  <CardHeader className="p-4 sm:p-6 pb-2">
                    <CardTitle className="font-heading text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      Completed Deliveries
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Successful drops and verified deliveries history</p>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-3">
                    {completedOrders.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-border/60 rounded-xl">
                        <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="font-medium text-sm text-foreground">No completed deliveries yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Completed drops will show here with verified earnings</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {completedOrders.map((order) => (
                          <div key={order._id} className="p-3.5 sm:p-4 border border-border/60 bg-muted/20 rounded-xl hover:bg-muted/40 transition-colors">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-sm text-foreground">Order #{order._id.slice(-6).toUpperCase()}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Delivered at {new Date(order.status_history?.find(h => h.status === 'delivered')?.timestamp || order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2.5 text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 rounded-lg"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowDetails(true);
                                  }}
                                  aria-label="View order details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <div>
                                  <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">₹50.00</p>
                                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-none">Paid out</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />

      {/* Order Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-heading">
              <Package className="h-5 w-5 text-primary" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              Order ID: #{selectedOrder?._id?.slice(-8)?.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5 pt-3">
              {/* Pharmacy Info (Pickup) */}
              {selectedOrder.pharmacy && (
                <div className="bg-amber-500/10 dark:bg-amber-950/30 p-4 rounded-xl space-y-2.5 border border-amber-500/20 dark:border-amber-800/40">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 dark:bg-amber-900/40 p-2 rounded-lg text-amber-700 dark:text-amber-300">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 uppercase font-bold tracking-wider">Pickup Pharmacy</p>
                      <p className="font-semibold text-foreground text-sm sm:text-base">{selectedOrder.pharmacy.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 pl-1 text-xs sm:text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p>{selectedOrder.pharmacy.address}</p>
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="bg-muted/50 p-4 rounded-xl space-y-3 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Customer Name</p>
                    <p className="font-semibold text-foreground text-sm sm:text-base">{selectedOrder.address?.name || 'Customer'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Mobile Number</p>
                    <p className="font-semibold text-foreground text-sm sm:text-base">{selectedOrder.address?.mobile}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <MapPin className="h-3.5 w-3.5" />
                  Delivery Destination
                </div>
                <div className="p-3.5 border border-border/70 rounded-xl bg-card text-sm">
                  <p className="font-medium text-foreground">{selectedOrder.address?.addressLine1}</p>
                  {selectedOrder.address?.addressLine2 && (
                    <p className="text-muted-foreground mt-0.5">{selectedOrder.address.addressLine2}</p>
                  )}
                  <p className="text-muted-foreground mt-0.5">
                    {selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}
                  </p>
                  {selectedOrder.address?.landmark && (
                    <div className="mt-2 pt-2 border-t border-border/50 text-xs">
                      <span className="font-bold text-primary">Landmark:</span> {selectedOrder.address.landmark}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <Package className="h-3.5 w-3.5" />
                  Package Contents ({selectedOrder.items?.length || 0} items)
                </div>
                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 border border-border/50 rounded-xl p-2.5 bg-muted/20">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs sm:text-sm p-1.5 hover:bg-muted/50 rounded-lg transition-colors">
                      <span className="font-medium text-foreground">{item.name} × {item.quantity}</span>
                      <span className="font-semibold text-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2.5 border-t flex justify-between items-center">
                  <span className="font-semibold text-sm text-foreground">Collect COD / Order Total</span>
                  <span className="text-lg font-bold text-primary">₹{selectedOrder.total?.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <Button className="flex-1 h-11 text-sm font-medium rounded-xl" variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
                {selectedOrder.order_status !== 'delivered' && (
                  <Button
                    className="h-11 w-11 rounded-xl flex items-center justify-center p-0 border-primary text-primary"
                    variant="outline"
                    asChild
                  >
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.address?.coordinates?.lat},${selectedOrder.address?.coordinates?.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in Google Maps"
                    >
                      <Navigation className="h-5 w-5" />
                    </a>
                  </Button>
                )}
                {selectedOrder.order_status === 'out_for_delivery' && (
                  <Button className="h-11 w-11 rounded-xl flex items-center justify-center p-0 bg-emerald-600 hover:bg-emerald-700 text-white" variant="default" asChild>
                    <a href={`tel:${selectedOrder.address?.mobile}`} title="Call customer">
                      <Phone className="h-5 w-5" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* OTP Dialog */}
      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent className="max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-heading">
              <Key className="h-5 w-5 text-emerald-600" />
              Verify Delivery OTP
            </DialogTitle>
            <DialogDescription>
              Ask the customer for the 4-digit code displayed in their active order tracker.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              className="w-full h-14 text-center text-3xl tracking-[0.5em] sm:tracking-[0.8em] font-mono font-bold bg-background border-2 border-border text-foreground rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="••••"
              value={deliveryOTP}
              onChange={(e) => setDeliveryOTP(e.target.value.replace(/[^0-9]/g, ''))}
              autoFocus
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="h-11 text-sm font-medium w-full sm:w-auto" onClick={() => setShowOTPDialog(false)}>
              Cancel
            </Button>
            <Button
              className="h-11 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
              disabled={deliveryOTP.length !== 4}
              onClick={handleCompleteDelivery}
            >
              Verify & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default DeliveryDashboardPage;
