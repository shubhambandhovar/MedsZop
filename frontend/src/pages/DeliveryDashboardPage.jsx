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
  Eye
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
    if (token) fetchOrders();
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

  const handleCompleteDelivery = async (orderId) => {
    try {
      await axios.post(`${API_URL}/delivery/complete/${orderId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Delivery completed!");
      fetchOrders();
    } catch (error) {
      toast.error("Failed to complete delivery");
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
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      out_for_delivery: "bg-cyan-100 text-cyan-800",
      delivered: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold flex items-center gap-3" data-testid="delivery-dashboard-title">
            <Truck className="h-8 w-8 text-primary" />
            Delivery Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage your deliveries and track earnings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 text-sm">Active Deliveries</p>
                  <p className="text-3xl font-bold">{activeOrders.length}</p>
                </div>
                <Truck className="h-10 w-10 text-cyan-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Available</p>
                  <p className="text-3xl font-bold">{availableOrders.length}</p>
                </div>
                <Package className="h-10 w-10 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Completed Today</p>
                  <p className="text-3xl font-bold">{completedOrders.length}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-violet-100 text-sm">Earnings</p>
                  <p className="text-3xl font-bold">₹{(completedOrders.length * 50).toFixed(0)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-violet-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Delivery Map
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[400px] rounded-b-xl overflow-hidden">
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
                            <div className="p-2">
                              <p className="font-bold">Order #{order._id.slice(0, 8)}</p>
                              <p className="text-xs">{order.address.addressLine1}</p>
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
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="available" className="flex gap-2">
                  <Package className="h-4 w-4" />
                  Available ({availableOrders.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="flex gap-2">
                  <Navigation className="h-4 w-4" />
                  Active ({activeOrders.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex gap-2">
                  <History className="h-4 w-4" />
                  History ({completedOrders.length})
                </TabsTrigger>
              </TabsList>

              {/* Available Orders Tab */}
              <TabsContent value="available">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                      Available for Pickup
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {availableOrders.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No orders available</p>
                    ) : (
                      <div className="space-y-3">
                        {availableOrders.map((order) => (
                          <div key={order._id} className="p-4 bg-muted/50 border border-border/50 rounded-xl hover:bg-muted transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-lg">Order #{order._id.slice(-6).toUpperCase()}</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.items.length} items • ₹{order.total.toFixed(2)}
                                </p>
                              </div>
                              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                +₹50 earning
                              </span>
                            </div>
                            <div className="text-sm mb-3 text-muted-foreground flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {order.address?.city}, {order.address?.pincode}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                className="flex-1"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowDetails(true);
                                }}
                              >
                                <Info className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                              <Button
                                className="flex-1"
                                size="sm"
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
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <Truck className="h-5 w-5 text-cyan-500" />
                      En-route Deliveries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeOrders.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No active deliveries</p>
                    ) : (
                      <div className="space-y-3">
                        {activeOrders.map((order) => (
                          <div key={order._id} className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-lg">Order #{order._id.slice(-6).toUpperCase()}</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.address?.addressLine1}
                                </p>
                              </div>
                              <Badge className={getStatusBadge(order.order_status)}>
                                {order.order_status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex flex-col gap-2 mt-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 bg-white hover:bg-muted"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                    setShowDetails(true);
                                  }}
                                >
                                  <Info className="h-4 w-4 mr-2" />
                                  Details
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white border-none"
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
                                  <Navigation className="h-4 w-4 mr-2" />
                                  Map
                                </Button>
                              </div>

                              {/* Dynamic Status Buttons */}
                              {order.order_status === "accepted" && (
                                <Button size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order._id, "picked_up"); }}>
                                  <Package className="h-4 w-4 mr-2" /> Mark Picked Up
                                </Button>
                              )}
                              {order.order_status === "picked_up" && (
                                <Button size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order._id, "shipped"); }}>
                                  <Truck className="h-4 w-4 mr-2" /> Mark Shipped
                                </Button>
                              )}
                              {order.order_status === "shipped" && (
                                <Button size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order._id, "on_the_way"); }}>
                                  <Navigation className="h-4 w-4 mr-2" /> Mark On The Way
                                </Button>
                              )}
                              {order.order_status === "on_the_way" && (
                                <Button size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order._id, "out_for_delivery"); }}>
                                  <Truck className="h-4 w-4 mr-2" /> Mark Out For Delivery
                                </Button>
                              )}
                              {order.order_status === "out_for_delivery" && (
                                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={(e) => { e.stopPropagation(); handleCompleteDelivery(order._id); }}>
                                  <CheckCircle className="h-4 w-4 mr-2" /> Mark Delivered
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
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      Completed Deliveries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {completedOrders.length === 0 ? (
                      <div className="text-center py-12">
                        <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">No completed deliveries yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {completedOrders.map((order) => (
                          <div key={order._id} className="p-4 border border-border/50 rounded-xl opacity-80">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">Order #{order._id.slice(-6).toUpperCase()}</p>
                                <p className="text-xs text-muted-foreground">
                                  Delivered on {new Date(order.status_history?.find(h => h.status === 'delivered')?.timestamp || order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowDetails(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <div>
                                  <p className="font-bold text-emerald-600">₹50.00</p>
                                  <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100">Paid out</Badge>
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
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-heading">
              <Package className="h-5 w-5 text-primary" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              Order ID: {selectedOrder?._id.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 pt-4">
              {/* Customer Info */}
              <div className="bg-muted/50 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Customer Name</p>
                    <p className="font-medium">{selectedOrder.address?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Mobile Number</p>
                    <p className="font-medium">{selectedOrder.address?.mobile}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  <MapPin className="h-4 w-4" />
                  Delivery Address
                </div>
                <div className="p-4 border rounded-xl bg-card">
                  <p className="font-medium">{selectedOrder.address?.addressLine1}</p>
                  {selectedOrder.address?.addressLine2 && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.address.addressLine2}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}
                  </p>
                  {selectedOrder.address?.landmark && (
                    <div className="mt-2 pt-2 border-t text-sm">
                      <span className="font-bold text-primary">Landmark:</span> {selectedOrder.address.landmark}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  <Package className="h-4 w-4" />
                  Order Summary
                </div>
                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-muted/50 rounded-lg transition-colors">
                      <span className="font-medium">{item.name} × {item.quantity}</span>
                      <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="font-bold">Total Amount</span>
                  <span className="text-xl font-bold text-primary italic">₹{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <Button className="flex-1 h-12 rounded-xl" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
                {selectedOrder.order_status !== 'delivered' && (
                  <Button
                    className="h-12 w-12 rounded-xl flex items-center justify-center p-0 border-primary text-primary"
                    variant="outline"
                    asChild
                  >
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.address?.coordinates?.lat},${selectedOrder.address?.coordinates?.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="h-5 w-5" />
                    </a>
                  </Button>
                )}
                {selectedOrder.order_status === 'out_for_delivery' && (
                  <Button className="h-12 w-12 rounded-xl flex items-center justify-center p-0" variant="secondary" asChild>
                    <a href={`tel:${selectedOrder.address?.mobile}`}>
                      <Phone className="h-5 w-5" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryDashboardPage;
