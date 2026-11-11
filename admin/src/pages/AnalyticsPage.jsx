import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Percent,
  Calendar,
  CreditCard,
  RefreshCw
} from "lucide-react";
import { adminApi } from "@/lib/api";
import KpiCard from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const PAYMENT_COLORS = ["#0891b2", "#10b981", "#f59e0b", "#6366f1"];

export default function AnalyticsPage() {
  const [range, setRange] = useState("7d");
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, statsData] = await Promise.all([
        adminApi.getAnalytics(range),
        adminApi.getStats()
      ]);
      setAnalytics(analyticsData);
      setStats(statsData);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const avgOrderValue = stats?.orders_count && stats.orders_count > 0
    ? Math.round(stats.total_revenue / stats.orders_count)
    : 0;

  const paymentData = (analytics?.payment_distribution || []).map((item, idx) => ({
    name: item.name,
    value: item.value,
    color: PAYMENT_COLORS[idx % PAYMENT_COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Top Bar with Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Marketplace Analytics & Trends
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Financial performance, order velocity, and payment distribution metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Range Buttons */}
          <div className="flex items-center rounded-lg border bg-muted/30 p-1">
            <button
              onClick={() => setRange("7d")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                range === "7d"
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange("30d")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                range === "30d"
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setRange("90d")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                range === "90d"
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              90 Days
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loading}
            className="h-8 px-2.5 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Gross Revenue"
          value={stats ? `₹${stats.total_revenue.toLocaleString("en-IN")}` : "—"}
          subtext="Non-cancelled marketplace orders"
          icon={DollarSign}
          accent="emerald"
        />

        <KpiCard
          title="Average Order Value"
          value={`₹${avgOrderValue.toLocaleString("en-IN")}`}
          subtext="Revenue per order placed"
          icon={TrendingUp}
          accent="cyan"
        />

        <KpiCard
          title="Orders Processed"
          value={stats ? stats.orders_count.toLocaleString("en-IN") : "—"}
          subtext={`${stats?.delivered_orders_count || 0} successfully delivered`}
          icon={ShoppingBag}
          accent="indigo"
        />

        <KpiCard
          title="Cancellation Rate"
          value={
            stats && stats.orders_count > 0
              ? `${((stats.cancelled_orders_count / stats.orders_count) * 100).toFixed(1)}%`
              : "0.0%"
          }
          subtext={`${stats?.cancelled_orders_count || 0} cancelled orders`}
          icon={Percent}
          accent="rose"
        />
      </div>

      {/* Revenue Trend Area Chart */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Revenue Trajectory ({range.toUpperCase()})
            </h3>
            <p className="text-xs text-muted-foreground">Daily gross order values captured by platform</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
            {range === "7d" ? "Past 7 Days" : range === "30d" ? "Past 30 Days" : "Past 90 Days"}
          </span>
        </div>

        <div className="h-80 w-full pt-2">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground animate-pulse">
              Computing trend data...
            </div>
          ) : analytics?.revenue_trend && analytics.revenue_trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.revenue_trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaRev" x1="0" y1="0" x2="0" y2="1">
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
                    fontSize: "12px"
                  }}
                  formatter={(val) => [`₹${val.toLocaleString("en-IN")}`, "Gross Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0891b2"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#areaRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              No revenue recorded in this period.
            </div>
          )}
        </div>
      </div>

      {/* Orders Volume & Payment Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Order Volume Bar Chart */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Order Volume Velocity
            </h3>
            <p className="text-xs text-muted-foreground">Number of individual checkout orders placed per day</p>
          </div>

          <div className="h-64 w-full">
            {analytics?.revenue_trend && analytics.revenue_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.revenue_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "12px"
                    }}
                    formatter={(val) => [val, "Orders Placed"]}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No orders recorded.
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Split */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Payment Method Adoption
            </h3>
            <p className="text-xs text-muted-foreground">Cash On Delivery vs Razorpay Online Gateway</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`pay-cell-${index}`} fill={entry.color} />
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
              <div className="text-xs text-muted-foreground">No payment records found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

