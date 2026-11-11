import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  Search,
  Eye,
  Calendar,
  User,
  Activity,
  RefreshCw
} from "lucide-react";
import { adminApi } from "@/lib/api";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
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

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAuditLogs({
        page,
        limit: 15,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        search: searchQuery || undefined
      });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      if (res.actions) setActions(res.actions);
    } catch (err) {
      console.error("Fetch audit logs error:", err);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionFilter, searchQuery]);

  const columns = useMemo(
    () => [
      {
        header: "Action",
        accessorKey: "action",
        cell: ({ row }) => (
          <div className="font-mono text-xs font-semibold text-primary">
            {row.original.action}
          </div>
        )
      },
      {
        header: "Admin User",
        accessorKey: "admin_email",
        cell: ({ row }) => (
          <div className="text-xs text-foreground font-medium truncate max-w-[160px]">
            {row.original.admin_email}
          </div>
        )
      },
      {
        header: "Target Resource",
        cell: ({ row }) => (
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-muted-foreground uppercase text-[10px] px-1.5 py-0.5 rounded bg-muted">
              {row.original.target_type}
            </span>
            <div className="font-mono text-[11px] text-muted-foreground truncate max-w-[120px]">
              {row.original.target_id || "—"}
            </div>
          </div>
        )
      },
      {
        header: "IP Address",
        accessorKey: "ip_address",
        cell: ({ row }) => (
          <div className="font-mono text-[11px] text-muted-foreground">
            {row.original.ip_address || "127.0.0.1"}
          </div>
        )
      },
      {
        header: "Timestamp",
        accessorKey: "createdAt",
        cell: ({ row }) => {
          const d = new Date(row.original.createdAt);
          return (
            <div className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
              <span className="ml-1 text-[10px] opacity-70">
                {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          );
        }
      },
      {
        id: "details",
        header: "Payload",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedLog(row.original);
              setDetailOpen(true);
            }}
            className="h-7 px-2 text-xs gap-1"
          >
            <Eye className="h-3 w-3" />
            Inspect
          </Button>
        )
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
            System Audit Trail
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Immutable log of state mutations, access control modifications, and compliance actions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAuditLogs}
          disabled={loading}
          className="h-8 px-2.5 text-xs gap-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2">
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Actions ({total})</SelectItem>
            {actions.map((act) => (
              <SelectItem key={act} value={act}>{act}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audit DataTable */}
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        page={page}
        pageCount={totalPages}
        onPageChange={setPage}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchPlaceholder="Search admin email, action name, resource ID..."
        exportFileName="medszop_audit_logs.csv"
      />

      {/* Payload Inspection Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          {selectedLog && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Audit Event Details
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Action: <span className="font-mono font-semibold text-foreground">{selectedLog.action}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="p-3 rounded-lg border bg-muted/20 space-y-1 text-xs">
                <div><span className="text-muted-foreground">Performed by:</span> <span className="font-medium text-foreground">{selectedLog.admin_email}</span></div>
                <div><span className="text-muted-foreground">Resource Type:</span> <span className="font-medium text-foreground">{selectedLog.target_type}</span></div>
                <div><span className="text-muted-foreground">Resource ID:</span> <span className="font-mono text-foreground">{selectedLog.target_id || "N/A"}</span></div>
                <div><span className="text-muted-foreground">IP Origin:</span> <span className="font-mono text-foreground">{selectedLog.ip_address || "127.0.0.1"}</span></div>
                <div><span className="text-muted-foreground">Time:</span> <span className="text-foreground">{new Date(selectedLog.createdAt).toLocaleString("en-IN")}</span></div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-foreground">Mutation Payload</span>
                <pre className="p-3 rounded-lg bg-muted text-[11px] font-mono overflow-x-auto max-h-56 text-foreground">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)}>
                  Dismiss
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

