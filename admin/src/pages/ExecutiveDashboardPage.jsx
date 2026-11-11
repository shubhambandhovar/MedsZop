import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  DollarSign,
  Users,
  Store,
  Stethoscope,
  Truck,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Eye
} from "lucide-react";
import { adminApi } from "@/lib/api";
import KpiCard from "@/components/KpiCard";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const STATUS_COLORS = {
  delivered: "#10b981",
  out_for_delivery: "#a855f7",
  packed: "#6366f1",
  confirmed: "#3b82f6",
  placed: "#06b6d4",
  pending: "#f59e0b",
  cancelled: "#ef4444"
};

export default function ExecutiveDashboardPage() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, analyticsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getAnalytics("7d")
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Dashboard error:", err);
      toast.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const pieData = (analytics?.status_distribution || []).map(item => ({
    name: item.name.replace(/_/g, " ").toUpperCase(),
    value: item.value,
    color: STATUS_COLORS[item.name.toLowerCase()] || "#94a3b8"
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Executive Command Center
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time healthcare marketplace operations and clinical oversight.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            Sync Metrics
          </Button>

          <Button asChild size="sm" className="h-9 gap-1.5 text-xs font-medium">
            <Link to="/orders">
              <ShoppingBag className="h-3.5 w-3.5" />
              Manage Orders
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Gross Order Value"
          value={stats ? `₹${stats.total_revenue.toLocaleString("en-IN")}` : "—"}
          subtext="Delivered & active orders"
          icon={DollarSign}
          accent="emerald"
          trend="+8.4%"
          trendType="up"
        />

        <KpiCard
          title="Total Orders"
          value={stats ? stats.orders_count.toLocaleString("en-IN") : "—"}
          subtext={`${stats?.pending_orders_count || 0} in active fulfillment`}
          icon={ShoppingBag}
          accent="cyan"
        />

        <KpiCard
          title="Active Pharmacies"
          value={stats ? `${stats.verified_pharmacies_count} / ${stats.pharmacies_count}` : "—"}
          subtext="Verified partner dispensaries"
          icon={Store}
          accent="indigo"
        />

        <KpiCard
          title="Pending Applications"
          value={stats ? stats.pending_applications : "—"}
          subtext={`${stats?.pending_prescriptions || 0} prescriptions pending`}
          icon={AlertTriangle}
          accent="amber"
          trend={stats?.pending_applications > 0 ? "Review Required" : "Cleared"}
          trendType={stats?.pending_applications > 0 ? "down" : "neutral"}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg border bg-card/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Patients</p>
            <p className="text-lg font-bold tabular-nums text-foreground mt-0.5">{stats?.customers_count ?? "—"}</p>
          </div>
          <Users className="h-5 w-5 text-muted-foreground/60" />
        </div>

        <div className="p-3.5 rounded-lg border bg-card/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Doctors</p>
            <p className="text-lg font-bold tabular-nums text-foreground mt-0.5">{stats?.doctors_count ?? "—"}</p>
          </div>
          <Stethoscope className="h-5 w-5 text-cyan-600/60 dark:text-cyan-400/60" />
        </div>

        <div className="p-3.5 rounded-lg border bg-card/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Couriers</p>
            <p className="text-lg font-bold tabular-nums text-foreground mt-0.5">{stats?.delivery_count ?? "—"}</p>
          </div>
          <Truck className="h-5 w-5 text-amber-600/60 dark:text-amber-400/60" />
        </div>

        <div className="p-3.5 rounded-lg border bg-card/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Delivered Rate</p>
            <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats && stats.orders_count > 0
                ? `${Math.round((stats.delivered_orders_count / stats.orders_count) * 100)}%`
                : "100%"}
            </p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-600/60 dark:text-emerald-400/60" />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue & Volume Chart */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                7-Day Revenue & Volume Trajectory
              </h3>
              <p className="text-xs text-muted-foreground">Aggregated order values and order volume</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
              Past 7 Days
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground animate-pulse">
                Loading trajectory data...
              </div>
            ) : analytics?.revenue_trend && analytics.revenue_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenue_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="displayDate"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                    formatter={(val, name) => [name === "revenue" ? `₹${val.toLocaleString("en-IN")}` : val, name === "revenue" ? "Revenue" : "Orders"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0891b2"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No transaction data recorded in this period.
              </div>
            )}
          </div>
        </div>

        {/* Order Status Distribution Donut Chart */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Order Fulfillment Breakdown
            </h3>
            <p className="text-xs text-muted-foreground">Pipeline stage proportions</p>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "12px"
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-muted-foreground">No orders in database.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Stream */}
      <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Recent Marketplace Orders
            </h3>
            <p className="text-xs text-muted-foreground">Latest transaction activity across all partner stores</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs text-primary hover:text-primary">
            <Link to="/orders">
              View All Orders
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="py-2.5 font-semibold">Order ID</th>
                <th className="py-2.5 font-semibold">Customer / Destination</th>
                <th className="py-2.5 font-semibold">Items</th>
                <th className="py-2.5 font-semibold">Amount</th>
                <th className="py-2.5 font-semibold">Payment</th>
                <th className="py-2.5 font-semibold">Status</th>
                <th className="py-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats?.recent_orders && stats.recent_orders.length > 0 ? (
                stats.recent_orders.map((order) => (
                  <tr key={order._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-mono font-medium text-foreground">
                      {order.orderNumber || order._id.slice(-8)}
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-foreground">{order.address?.name || "Customer"}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                        {order.address?.city || "Registered Address"}
                      </div>
                    </td>
                    <td className="py-3 tabular-nums text-muted-foreground">
                      {order.items?.length || 0} {order.items?.length === 1 ? "item" : "items"}
                    </td>
                    <td className="py-3 font-semibold text-foreground tabular-nums">
                      ₹{order.total?.toFixed(2) || "0.00"}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={order.payment_status || "pending"} />
                    </td>
                    <td className="py-3">
                      <StatusBadge status={order.order_status || "pending"} />
                    </td>
                    <td className="py-3 text-right">
                      <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                        <Link to={`/orders?id=${order._id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          Inspect
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

