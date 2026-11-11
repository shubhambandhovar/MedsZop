import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShoppingBag,
  Eye,
  CheckCircle,
  Truck,
  XCircle,
  Clock,
  MapPin,
  Phone,
  User,
  CreditCard,
  Package,
  Calendar,
  RefreshCw
} from "lucide-react";
import { adminApi } from "@/lib/api";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

const ORDER_STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packed", label: "Packed" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" }
];

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderId = searchParams.get("id");

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Detail state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getOrders({
        page,
        limit: 10,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: searchQuery || undefined
      });
      setOrders(res.orders || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);

      // Auto-open modal if initial order ID passed in URL
      if (initialOrderId && !selectedOrder) {
        const found = (res.orders || []).find((o) => o._id === initialOrderId);
        if (found) {
          openOrderDetail(found);
        }
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, searchQuery]);

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.order_status || "pending");
    setStatusReason("");
    setModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    try {
      setUpdating(true);
      await adminApi.updateOrderStatus(selectedOrder._id, {
        order_status: newStatus,
        reason: statusReason || `Administrative status change to ${newStatus}`
      });
      toast.success(`Order status updated to ${newStatus}`);
      setModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Order ID",
        accessorKey: "orderNumber",
        cell: ({ row }) => (
          <div className="font-mono text-xs font-semibold text-foreground">
            {row.original.orderNumber || row.original._id.slice(-8)}
          </div>
        )
      },
      {
        header: "Date",
        accessorKey: "createdAt",
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return (
            <div className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {date.toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
              <div className="text-[10px] opacity-70">
                {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          );
        }
      },
      {
        header: "Customer / City",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-xs text-foreground truncate max-w-[140px]">
              {row.original.address?.name || "Customer"}
            </div>
            <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
              {row.original.address?.city || row.original.address?.pincode || "—"}
            </div>
          </div>
        )
      },
      {
        header: "Items",
        cell: ({ row }) => {
          const count = row.original.items?.length || 0;
          return (
            <div className="text-xs tabular-nums text-muted-foreground">
              {count} {count === 1 ? "item" : "items"}
            </div>
          );
        }
      },
      {
        header: "Total",
        accessorKey: "total",
        cell: ({ row }) => (
          <div className="font-bold text-xs text-foreground tabular-nums">
            ₹{row.original.total ? row.original.total.toFixed(2) : "0.00"}
          </div>
        )
      },
      {
        header: "Payment",
        accessorKey: "payment_status",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <StatusBadge status={row.original.payment_status || "pending"} />
            <div className="text-[10px] text-muted-foreground uppercase font-mono">
              {row.original.payment_method || "COD"}
            </div>
          </div>
        )
      },
      {
        header: "Order Status",
        accessorKey: "order_status",
        cell: ({ row }) => (
          <StatusBadge status={row.original.order_status || "pending"} />
        )
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openOrderDetail(row.original)}
            className="h-7 px-2.5 text-xs gap-1"
          >
            <Eye className="h-3 w-3" />
            Manage
          </Button>
        )
      }
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Marketplace Orders
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage end-to-end customer orders, inspect items, and update fulfillment states.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
          className="h-8 px-2.5 text-xs gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border text-xs">
        {ORDER_STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setStatusFilter(opt.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === opt.value
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* TanStack Orders Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        page={page}
        pageCount={totalPages}
        onPageChange={setPage}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchPlaceholder="Search order ID, customer name, city..."
        exportFileName="medszop_orders.csv"
      />

      {/* Order Detail & Management Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between pr-4">
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Order #{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}
                  </DialogTitle>
                  <StatusBadge status={selectedOrder.order_status} />
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                </DialogDescription>
              </DialogHeader>

              {/* Customer & Delivery Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 rounded-xl border bg-muted/20 text-xs">
                <div className="space-y-1.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Customer Details
                  </div>
                  <p className="text-foreground font-medium">{selectedOrder.address?.name || "N/A"}</p>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedOrder.address?.phone || "No phone provided"}
                  </p>
                  <p className="text-muted-foreground">User ID: <span className="font-mono">{selectedOrder.user_id}</span></p>
                </div>

                <div className="space-y-1.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Delivery Destination
                  </div>
                  <p className="text-foreground">
                    {selectedOrder.address?.street || selectedOrder.address?.addressLine1 || "Street address"}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}
                  </p>
                </div>
              </div>

              {/* Itemized Medicines List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Order Items ({selectedOrder.items?.length || 0})
                </h4>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 text-muted-foreground">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Medicine</th>
                        <th className="py-2 px-3 font-semibold text-center">Qty</th>
                        <th className="py-2 px-3 font-semibold text-right">Price</th>
                        <th className="py-2 px-3 font-semibold text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="py-2 px-3 font-medium text-foreground">{item.name}</td>
                          <td className="py-2 px-3 text-center tabular-nums">{item.quantity}</td>
                          <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">₹{item.price?.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right tabular-nums font-semibold text-foreground">
                            ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t bg-muted/30 font-bold text-foreground">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 text-right">Total Amount:</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-primary font-bold">
                          ₹{selectedOrder.total?.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Status Update Control Section */}
              <div className="p-4 rounded-xl border bg-card space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Fulfillment State Transition
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      New Status
                    </label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="packed">Packed</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Audit Reason / Note (Optional)
                    </label>
                    <Input
                      placeholder="e.g. Courier assigned, patient verified"
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpdateStatus}
                  disabled={updating || newStatus === selectedOrder.order_status}
                  className="gap-1.5"
                >
                  {updating ? "Saving..." : "Save State Update"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

