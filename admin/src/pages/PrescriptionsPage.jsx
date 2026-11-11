import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { adminApi, API_URL } from "@/lib/api";
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
import { toast } from "sonner";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Review modal
  const [selectedRx, setSelectedRx] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewReason, setReviewReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPrescriptions({
        page,
        limit: 10,
        status: statusFilter !== "ALL" ? statusFilter : undefined
      });
      setPrescriptions(res.prescriptions || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Fetch prescriptions error:", err);
      toast.error("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [page, statusFilter]);

  const handleReviewAction = async (status) => {
    if (!selectedRx) return;
    try {
      setActionLoading(true);
      await adminApi.updatePrescriptionStatus(selectedRx._id, {
        status,
        reason: reviewReason || `Prescription ${status} by administrator`
      });
      toast.success(`Prescription marked as ${status}`);
      setReviewModalOpen(false);
      fetchPrescriptions();
    } catch (err) {
      toast.error("Failed to update prescription status");
    } finally {
      setActionLoading(false);
    }
  };

  const getPrescriptionPreviewUrl = (rx) => {
    if (!rx) return "";
    if (rx.file_url && rx.file_url.startsWith("http")) return rx.file_url;
    if (rx.filename) {
      return `${API_URL}/uploads/prescriptions/${rx.filename}`;
    }
    return "";
  };

  const columns = useMemo(
    () => [
      {
        header: "Prescription Record",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-xs text-foreground truncate max-w-[180px]">
                {row.original.original_name || row.original.filename || "prescription_upload.jpg"}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                User: {row.original.user_id?.slice(-8) || "Unknown"}
              </div>
            </div>
          </div>
        )
      },
      {
        header: "File Details",
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground tabular-nums">
            <div>{row.original.mime_type || "Image"}</div>
            {row.original.file_size && (
              <div className="text-[10px] opacity-70">
                {(row.original.file_size / 1024).toFixed(0)} KB
              </div>
            )}
          </div>
        )
      },
      {
        header: "Upload Date",
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
        header: "Clinical Status",
        accessorKey: "status",
        cell: ({ row }) => <StatusBadge status={row.original.status || "uploaded"} />
      },
      {
        id: "actions",
        header: "Review Action",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedRx(row.original);
              setReviewReason("");
              setReviewModalOpen(true);
            }}
            className="h-7 px-2.5 text-xs gap-1"
          >
            <Eye className="h-3 w-3" />
            Inspect Rx
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
            Prescription Verification
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Clinical review gate for prescription-required pharmaceutical orders and Schedule H compliance.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchPrescriptions}
          disabled={loading}
          className="h-8 px-2.5 text-xs gap-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {["ALL", "uploaded", "verified", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium capitalize whitespace-nowrap transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {s === "ALL" ? "All Prescriptions" : s === "uploaded" ? "Pending Review" : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={prescriptions}
        loading={loading}
        page={page}
        pageCount={totalPages}
        onPageChange={setPage}
        exportFileName="medszop_prescriptions.csv"
      />

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRx && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between pr-4">
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Review Prescription Upload
                  </DialogTitle>
                  <StatusBadge status={selectedRx.status} />
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Verify doctor signature, clinic registration, date of issue, and prescribed medicines.
                </DialogDescription>
              </DialogHeader>

              {/* Document Image Container */}
              <div className="rounded-xl border bg-muted/30 p-2 overflow-hidden flex items-center justify-center min-h-[260px] max-h-[380px]">
                {getPrescriptionPreviewUrl(selectedRx) ? (
                  <img
                    src={getPrescriptionPreviewUrl(selectedRx)}
                    alt="Prescription Document"
                    className="max-h-[360px] w-auto object-contain rounded-lg shadow-sm"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="flex flex-col items-center justify-center text-muted-foreground p-6 text-center"
                  style={{ display: getPrescriptionPreviewUrl(selectedRx) ? "none" : "flex" }}
                >
                  <AlertCircle className="h-8 w-8 text-muted-foreground/50 mb-1" />
                  <p className="text-xs font-medium">Secured Document Stream</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Prescription stored under HIPAA / DPDPA encrypted storage.
                  </p>
                </div>
              </div>

              {/* Review Remarks Field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Pharmacist / Clinical Review Notes
                </label>
                <Input
                  placeholder="e.g. Verified Dr. Sharma registration; all dosages checked."
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(false)}>
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReviewAction("rejected")}
                    disabled={actionLoading}
                    className="gap-1 text-xs"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject Prescription
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReviewAction("verified")}
                    disabled={actionLoading}
                    className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve & Verify
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

