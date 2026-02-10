import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const DashboardPage = () => {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    orders: [],
    prescriptions: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [ordersRes, prescriptionsRes] = await Promise.all([
        axios.get(`${API_URL}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/prescriptions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setStats({
        orders: ordersRes.data,
        prescriptions: prescriptionsRes.data,
      });
    } catch (error) {
      console.error("Dashboard API error:", error);

      setStats({
        orders: [],
        prescriptions: [],
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, fetchDashboardData]);

  const quickActions = [
    {
      icon: Pill,
      label: "Browse Medicines",
      href: "/medicines",
      color: "bg-blue-500",
    },
    {
      icon: ScanLine,
      label: "Scan Prescription",
      href: "/prescription-scan",
      color: "bg-cyan-500",
    },
    {
      icon: MessageSquare,
      label: "AI Doctor Chat",
      href: "/doctor-chat",
      color: "bg-emerald-500",
    },
    {
      icon: Package,
      label: "Track Orders",
      href: "/orders",
      color: "bg-violet-500",
    },
  ];

  const recentOrders = stats.orders.slice(0, 3);
  const totalSpent = stats.orders.reduce(
    (sum, o) => sum + (o.payment_status === "paid" ? o.total : 0),
    0,
  );

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-lg text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1
            className="font-heading text-3xl font-bold mb-2"
            data-testid="dashboard-title"
          >
            {t("dashboard.welcome", { name: user.name?.split(" ")[0] })}
          </h1>
          <p className="text-muted-foreground">
            {t("dashboard.overview")}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">{t("dashboard.total_orders")}</p>
                  <p className="text-3xl font-bold">{stats.orders.length}</p>
                </div>
                <Package className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">{t("dashboard.total_spent")}</p>
                  <p className="text-3xl font-bold">₹{totalSpent.toFixed(0)}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-violet-100 text-sm">{t("dashboard.prescriptions")}</p>
                  <p className="text-3xl font-bold">
                    {stats.prescriptions.length}
                  </p>
                </div>
                <FileText className="h-10 w-10 text-violet-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">{t("dashboard.active_orders")}</p>
                  <p className="text-3xl font-bold">
                    {
                      stats.orders.filter(
                        (o) =>
                          !["delivered", "cancelled"].includes(o.order_status),
                      ).length
                    }
                  </p>
                </div>
                <Clock className="h-10 w-10 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4">
            {t("dashboard.quick_actions")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.href}>
                <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`h-12 w-12 rounded-2xl ${action.color} flex items-center justify-center mx-auto mb-3`}
                    >
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-medium text-sm">{t(action.label)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading">{t("dashboard.recent_orders")}</CardTitle>
              <Link to="/orders">
                <Button variant="ghost" size="sm">
                  {t("dashboard.view_all")}
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">{t("dashboard.no_orders")}</p>
                  <Link to="/medicines">
                    <Button className="mt-4" size="sm">
                      {t("dashboard.start_shopping")}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <Link key={order._id} to={`/orders/${order._id}`}>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                        <div>
                          <p className="font-medium">
                            {t("dashboard.items_count", { count: order.items.length })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("dashboard.order_date", { date: new Date(order.created_at).toLocaleDateString() })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {t("dashboard.order_total", { total: order.total.toFixed(2) })}
                          </p>
                          <Badge variant="outline" className="capitalize">
                            {t(`order.status.${order.order_status}`)}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Tips / AI Features */}
          <Card className="bg-gradient-to-br from-primary/5 to-cyan-500/5 border-primary/20">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                {t("dashboard.health_hub")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Link to="/prescription-scan">
                  <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl hover:shadow-md transition-all cursor-pointer">
                    <div className="h-12 w-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                      <ScanLine className="h-6 w-6 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{t("dashboard.ai_prescription_scanner")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("dashboard.upload_extract")}
                      </p>
                    </div>
                  </div>
                </Link>

                <Link to="/doctor-chat">
                  <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl hover:shadow-md transition-all cursor-pointer">
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{t("dashboard.ai_doctor_chat")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("dashboard.instant_guidance")}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl">
                  <p className="font-semibold text-primary mb-2">
                    {t("dashboard.health_tip_title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.health_tip_body")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardPage;
