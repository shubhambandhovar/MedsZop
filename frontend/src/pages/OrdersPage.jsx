import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Package, Clock, CheckCircle, Truck, XCircle, Eye, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
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
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" aria-hidden="true" />;
      case "confirmed": return <CheckCircle className="h-4 w-4" aria-hidden="true" />;
      case "processing": return <Package className="h-4 w-4" aria-hidden="true" />;
      case "out_for_delivery": return <Truck className="h-4 w-4" aria-hidden="true" />;
      case "delivered": return <CheckCircle className="h-4 w-4" aria-hidden="true" />;
      case "cancelled": return <XCircle className="h-4 w-4" aria-hidden="true" />;
      default: return <Clock className="h-4 w-4" aria-hidden="true" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/60";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60";
      case "processing":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60";
      case "out_for_delivery":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800/60";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3" data-testid="orders-title">
            <Package className="h-8 w-8 text-primary" aria-hidden="true" />
            My Orders
          </h1>
          <p className="text-muted-foreground mt-1">Track and manage your medicine orders</p>
        </div>

        {loading ? (
          <div className="space-y-4" role="status" aria-label="Loading orders">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <Card className="text-center py-12 border-destructive/20 bg-destructive/5 dark:bg-destructive/10" role="alert">
            <CardContent className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertCircle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-1 text-foreground">Failed to Load Orders</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">{error}</p>
              </div>
              <Button
                onClick={fetchOrders}
                className="rounded-full px-6 shadow-sm hover:shadow transition-all"
                data-testid="retry-orders-btn"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <h3 className="font-heading text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
              <Link to="/medicines">
                <Button className="rounded-full px-6 shadow-md hover:shadow-lg transition-all">Browse Medicines</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`order-${order._id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Badge className={getStatusColor(order.order_status)}>
                          {getStatusIcon(order.order_status)}
                          <span className="ml-1 capitalize">{order.order_status.replace('_', ' ')}</span>
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 dark:border-slate-700">
                          {order.payment_method?.toUpperCase()}
                        </Badge>
                        {order.payment_status === "paid" && (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            Paid
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Order ID: {order._id?.slice(0, 8)}... • {formatDate(order.createdAt)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <span key={index} className="text-sm bg-muted px-2 py-1 rounded">
                            {item.name} x{item.quantity}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-sm text-muted-foreground">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{order.total.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{order.items.length} items</p>
                      </div>
                      <Link to={`/orders/${order._id}`}>
                        <Button variant="outline" className="rounded-full px-5" data-testid={`view-order-${order._id}`}>
                          <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                          Track
                        </Button>
                      </Link>
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
