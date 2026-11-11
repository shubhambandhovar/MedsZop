import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search
} from "lucide-react";
import { adminApi } from "@/lib/api";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState("payments"); // "payments" | "refunds"

  // Payments State
  const [payments, setPayments] = useState([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [paymentSearch, setPaymentSearch] = useState("");

  // Refunds State
  const [refunds, setRefunds] = useState([]);
  const [totalRefunds, setTotalRefunds] = useState(0);
  const [refundPage, setRefundPage] = useState(1);
  const [refundTotalPages, setRefundTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPayments({
        page: paymentPage,
        limit: 10,
        status: paymentStatusFilter !== "ALL" ? paymentStatusFilter : undefined,
        search: paymentSearch || undefined
      });
      setPayments(res.payments || []);
      setTotalPayments(res.total || 0);
      setPaymentTotalPages(res.totalPages || 1);
      if (res.totalVolume !== undefined) setTotalVolume(res.totalVolume);
    } catch (err) {
      console.error("Fetch payments error:", err);
      toast.error("Failed to load payment transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getRefunds({
        page: refundPage,
        limit: 10
      });
      setRefunds(res.refunds || []);
      setTotalRefunds(res.total || 0);
      setRefundTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Fetch refunds error:", err);
      toast.error("Failed to load refund transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPayments();
    } else {
      fetchRefunds();
    }
  }, [activeTab, paymentPage, paymentStatusFilter, paymentSearch, refundPage]);

  const paymentColumns = useMemo(
    () => [
      {
        header: "Payment ID",
        cell: ({ row }) => (
          <div className="font-mono text-xs font-semibold text-foreground">
            {row.original.pg_payment_id || row.original._id.slice(-8)}
          </div>
        )
      },
      {
        header: "Order Reference",
        cell: ({ row }) => (
          <div className="font-mono text-xs text-muted-foreground">
            {row.original.pg_order_id || (row.original.order_id ? String(row.original.order_id).slice(-8) : "—")}
          </div>
        )
      },
      {
        header: "Amount (INR)",
        accessorKey: "amount",
        cell: ({ row }) => (
          <div className="font-bold text-xs text-foreground tabular-nums">
            ₹{row.original.amount ? row.original.amount.toFixed(2) : "0.00"}
          </div>
        )
      },
      {
        header: "Method",
        accessorKey: "method",
        cell: ({ row }) => (
          <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
            {row.original.method || "ONLINE"}
          </span>
        )
      },
      {
        header: "Gateway Status",
        accessorKey: "status",
        cell: ({ row }) => <StatusBadge status={row.original.status || "INITIALIZED"} />
      },
      {
        header: "Timestamp",
        accessorKey: "created_at",
        cell: ({ row }) => {
          const d = new Date(row.original.created_at);
          return (
            <div className="text-xs text-muted-foreground tabular-nums">
              {d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
              <span className="ml-1 text-[10px] opacity-70">
                {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        }
      }
    ],
    []
  );

  const refundColumns = useMemo(
    () => [
      {
        header: "Refund ID",
        cell: ({ row }) => (
          <div className="font-mono text-xs font-semibold text-foreground">
            {row.original.pg_refund_id || row.original._id.slice(-8)}
          </div>
        )
      },
      {
        header: "Order Ref",
        cell: ({ row }) => (
          <div className="font-mono text-xs text-muted-foreground">
            {row.original.order_id ? String(row.original.order_id).slice(-8) : "—"}
          </div>
        )
      },
      {
        header: "Refund Amount",
        accessorKey: "amount",
        cell: ({ row }) => (
          <div className="font-bold text-xs text-rose-600 dark:text-rose-400 tabular-nums">
            -₹{row.original.amount ? row.original.amount.toFixed(2) : "0.00"}
          </div>
        )
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => <StatusBadge status={row.original.status || "INITIATED"} />
      },
      {
        header: "Reason",
        accessorKey: "reason",
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground max-w-[200px] truncate">
            {row.original.reason || "Customer cancellation"}
          </div>
        )
      },
      {
        header: "Processed At",
        accessorKey: "created_at",
        cell: ({ row }) => {
          const d = new Date(row.original.created_at);
          return (
            <div className="text-xs text-muted-foreground tabular-nums">
              {d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
            </div>
          );
        }
      }
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Payments & Financial Ledger
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Razorpay transaction settlement logs, refund requests, and marketplace gross volume.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={activeTab === "payments" ? fetchPayments : fetchRefunds}
          disabled={loading}
          className="h-8 px-2.5 text-xs gap-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Volume Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Captured Online Volume</p>
            <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
              ₹{totalVolume.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Gateway Provider</p>
            <p className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Razorpay API v1
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Refund Requests</p>
            <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{totalRefunds}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "payments"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Payment Transactions ({totalPayments})
        </button>
        <button
          onClick={() => setActiveTab("refunds")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "refunds"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Refund Records ({totalRefunds})
        </button>
      </div>

      {activeTab === "payments" ? (
        <DataTable
          columns={paymentColumns}
          data={payments}
          loading={loading}
          page={paymentPage}
          pageCount={paymentTotalPages}
          onPageChange={setPaymentPage}
          searchQuery={paymentSearch}
          onSearchChange={(q) => {
            setPaymentSearch(q);
            setPaymentPage(1);
          }}
          searchPlaceholder="Search payment ID or order ID..."
          exportFileName="medszop_payments.csv"
        />
      ) : (
        <DataTable
          columns={refundColumns}
          data={refunds}
          loading={loading}
          page={refundPage}
          pageCount={refundTotalPages}
          onPageChange={setRefundPage}
          exportFileName="medszop_refunds.csv"
        />
      )}
    </div>
  );
}

