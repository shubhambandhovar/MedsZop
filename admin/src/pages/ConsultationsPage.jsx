import React, { useState, useEffect, useMemo } from "react";
import {
  Stethoscope,
  User,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { adminApi } from "@/lib/api";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getConsultations({
        page,
        limit: 10,
        status: statusFilter !== "ALL" ? statusFilter : undefined
      });
      setConsultations(res.consultations || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Fetch consultations error:", err);
      toast.error("Failed to load consultations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, [page, statusFilter]);

  const columns = useMemo(
    () => [
      {
        header: "Patient",
        cell: ({ row }) => {
          const patient = row.original.patient_id;
          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-foreground">
                  {typeof patient === "object" ? patient?.name : "Patient"}
                </div>
                <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                  {typeof patient === "object" ? patient?.email : "—"}
                </div>
              </div>
            </div>
          );
        }
      },
      {
        header: "Consulting Doctor",
        cell: ({ row }) => {
          const doctor = row.original.doctor_id;
          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                <Stethoscope className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-foreground">
                  {typeof doctor === "object" ? doctor?.name : "Doctor"}
                </div>
                <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                  {typeof doctor === "object" ? doctor?.email : "—"}
                </div>
              </div>
            </div>
          );
        }
      },
      {
        header: "Reported Symptoms",
        cell: ({ row }) => (
          <div className="text-xs text-foreground max-w-[200px] truncate" title={row.original.symptoms}>
            {row.original.symptoms || "General medical consultation"}
          </div>
        )
      },
      {
        header: "Date & Time",
        accessorKey: "createdAt",
        cell: ({ row }) => {
          const d = new Date(row.original.createdAt);
          return (
            <div className="text-xs text-muted-foreground tabular-nums">
              {d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          );
        }
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => <StatusBadge status={row.original.status || "PENDING"} />
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
            Doctor Consultations & Telehealth
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor patient appointments, diagnostic chats, and digital prescription issuance.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchConsultations}
          disabled={loading}
          className="h-8 px-2.5 text-xs gap-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {["ALL", "PENDING", "ACCEPTED", "COMPLETED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {s === "ALL" ? "All Consultations" : s}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={consultations}
        loading={loading}
        page={page}
        pageCount={totalPages}
        onPageChange={setPage}
        exportFileName="medszop_consultations.csv"
      />
    </div>
  );
}

