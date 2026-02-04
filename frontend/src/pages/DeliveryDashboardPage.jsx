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
  DollarSign
} from "lucide-react";
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

  // Demo coordinates (Bangalore)
  const centerLocation = [12.9716, 77.5946];

  useEffect(() => {
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

    fetchOrders();
  }, [token]);

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

  const assignedOrders = orders.filter(o => o.delivery_agent_id === user?.id);
  const availableOrders = orders.filter(o => !o.delivery_agent_id && o.order_status === "processing");
  const completedOrders = orders.filter(o => o.delivery_agent_id === user?.id && o.order_status === "delivered");

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
                  <p className="text-3xl font-bold">{assignedOrders.filter(o => o.order_status === "out_for_delivery").length}</p>
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
                  center={centerLocation}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={centerLocation}>
                    <Popup>Your Location</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <div className="space-y-6">
            {/* Active Deliveries */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Truck className="h-5 w-5 text-cyan-500" />
                  Active Deliveries
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignedOrders.filter(o => o.order_status === "out_for_delivery").length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No active deliveries</p>
                ) : (
                  <div className="space-y-3">
                    {assignedOrders.filter(o => o.order_status === "out_for_delivery").map((order) => (
                      <div key={order.id} className="p-4 bg-muted/50 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.address?.street}, {order.address?.city}
                            </p>
                          </div>
                          <Badge className={getStatusBadge(order.order_status)}>
                            {order.order_status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Navigation className="h-4 w-4 mr-1" />
                            Navigate
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleCompleteDelivery(order.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Available Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No orders available</p>
                ) : (
                  <div className="space-y-3">
                    {availableOrders.map((order) => (
                      <div key={order.id} className="p-4 bg-muted/50 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.items.length} items • ₹{order.total.toFixed(2)}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-emerald-600">
                            +₹50 earning
                          </span>
                        </div>
                        <Button
                          className="w-full mt-2"
                          size="sm"
                          onClick={() => handleAcceptDelivery(order.id)}
                        >
                          Accept Delivery
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DeliveryDashboardPage;
