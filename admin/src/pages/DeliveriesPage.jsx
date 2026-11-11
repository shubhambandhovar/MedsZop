import React, { useState, useEffect } from "react";
import {
  Truck,
  Package,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  RefreshCw,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DeliveriesPage() {
  const [agents, setAgents] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDeliveries();
      setAgents(res.agents || []);
      setActiveOrders(res.activeOrders || []);
    } catch (err) {
      console.error("Fetch deliveries error:", err);
      toast.error("Failed to load delivery logistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Delivery & Courier Logistics
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Active dispatch orders, fleet distribution, and delivery fulfillment monitoring.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchDeliveries}
          disabled={loading}
          className="h-8 px-2.5 text-xs gap-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Active Couriers</p>
            <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{agents.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">In Dispatch Pipeline</p>
            <p className="text-2xl font-bold tabular-nums text-primary mt-1">{activeOrders.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">OTP Handshake Protection</p>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" />
              End-to-End Encrypted
            </p>
          </div>
        </div>
      </div>

      {/* Active Orders in Pipeline */}
      <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Active Dispatch Queue ({activeOrders.length})
          </h3>
          <p className="text-xs text-muted-foreground">Orders confirmed, packed, or currently on the road</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="py-2.5 font-semibold">Order ID</th>
                <th className="py-2.5 font-semibold">Customer / Destination</th>
                <th className="py-2.5 font-semibold">Fulfillment Stage</th>
                <th className="py-2.5 font-semibold">Amount</th>
                <th className="py-2.5 font-semibold">Placed At</th>
                <th className="py-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeOrders.length > 0 ? (
                activeOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-mono font-medium text-foreground">
                      {order.orderNumber || order._id.slice(-8)}
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-foreground">{order.address?.name || "Customer"}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {order.address?.city || "Registered City"}
                      </div>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={order.order_status} />
                    </td>
                    <td className="py-3 font-bold text-foreground tabular-nums">
                      ₹{order.total?.toFixed(2)}
                    </td>
                    <td className="py-3 text-muted-foreground tabular-nums">
                      {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 text-right">
                      <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                        <Link to={`/orders?id=${order._id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          View Order
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    All delivery queues currently clear.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courier Fleet Directory */}
      <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Registered Courier Partners ({agents.length})
          </h3>
          <p className="text-xs text-muted-foreground">Verified delivery personnel authorized to fulfill orders</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.length > 0 ? (
            agents.map((agent) => (
              <div key={agent._id} className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">{agent.name}</span>
                  <StatusBadge status="verified" customLabel="Authorized" />
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    <span>{agent.email}</span>
                  </div>
                  {agent.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      <span>{agent.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground col-span-3 py-4 text-center">
              No delivery agents registered yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

