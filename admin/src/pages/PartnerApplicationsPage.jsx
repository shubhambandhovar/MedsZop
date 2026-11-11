import React, { useState, useEffect, useMemo } from "react";
import {
  UserCheck,
  Stethoscope,
  Store,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  FileCheck,
  AlertTriangle
} from "lucide-react";
import { adminApi } from "@/lib/api";
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

export default function PartnerApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Review modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPartnerApplications({
        type: typeFilter !== "ALL" ? typeFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined
      });
      setApplications(res.applications || []);
      if (res.counts) setCounts(res.counts);
    } catch (err) {
      console.error("Fetch partner applications error:", err);
      toast.error("Failed to load partner applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [typeFilter, statusFilter]);

  const handleReviewAction = async (action) => {
    if (!selectedApp) return;
    try {
      setActionLoading(true);
      await adminApi.reviewPartnerApplication(selectedApp.type, selectedApp._id, {
        action,
        remarks: remarks || (action === "APPROVE" ? "Approved by Administrator" : "Rejected by Administrator")
      });
      toast.success(`Application ${action === "APPROVE" ? "Approved" : "Rejected"} successfully`);
      setModalOpen(false);
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to review application");
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewModal = (app) => {
    setSelectedApp(app);
    setRemarks(app.remarks || "");
    setModalOpen(true);
  };

  const getRoleIcon = (type) => {
    switch (type) {
      case "doctor":
        return <Stethoscope className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />;
      case "pharmacist":
        return <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "delivery":
        return <Truck className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <UserCheck className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Partner Review Center
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Audit professional certifications and verify credentials for Doctors, Pharmacists, and Delivery agents.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchApplications}
          disabled={loading}
          className="h-8 px-2.5 text-xs gap-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Count Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            statusFilter === "ALL" ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/30"
          }`}
        >
          <p className="text-[11px] font-medium text-muted-foreground uppercase">Total Ingested</p>
          <p className="text-lg font-bold tabular-nums text-foreground mt-0.5">{counts.total}</p>
        </div>

        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            statusFilter === "PENDING" ? "border-amber-500 bg-amber-500/5" : "bg-card hover:bg-muted/30"
          }`}
        >
          <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase">Pending Review</p>
          <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">{counts.pending}</p>
        </div>

        <div
          onClick={() => setStatusFilter("APPROVED")}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            statusFilter === "APPROVED" ? "border-emerald-500 bg-emerald-500/5" : "bg-card hover:bg-muted/30"
          }`}
        >
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase">Approved</p>
          <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">{counts.approved}</p>
        </div>

        <div
          onClick={() => setStatusFilter("REJECTED")}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            statusFilter === "REJECTED" ? "border-rose-500 bg-rose-500/5" : "bg-card hover:bg-muted/30"
          }`}
        >
          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase">Rejected</p>
          <p className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">{counts.rejected}</p>
        </div>
      </div>

      {/* Role Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { label: "All Roles", value: "ALL" },
          { label: "Doctors", value: "doctor" },
          { label: "Pharmacists", value: "pharmacist" },
          { label: "Delivery Partners", value: "delivery" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              typeFilter === t.value
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Applications Table / Cards */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="border-b uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 font-semibold">Applicant</th>
                <th className="py-2.5 px-4 font-semibold">Partner Role</th>
                <th className="py-2.5 px-4 font-semibold">Credentials & Verification</th>
                <th className="py-2.5 px-4 font-semibold">Submitted On</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {applications.length > 0 ? (
                applications.map((app) => (
                  <tr key={`${app.type}-${app._id}`} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-xs text-foreground">{app.name}</div>
                      <div className="text-[11px] text-muted-foreground">{app.email}</div>
                      {app.phone && <div className="text-[10px] text-muted-foreground">{app.phone}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-xs capitalize font-medium">
                        {getRoleIcon(app.type)}
                        {app.type}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {app.type === "doctor" && (
                        <div>
                          <div className="text-xs text-foreground">Reg: {app.registration_number || "Pending"}</div>
                          <div className="text-[11px] text-muted-foreground">{app.specialization || "General Medicine"}</div>
                        </div>
                      )}
                      {app.type === "pharmacist" && (
                        <div>
                          <div className="text-xs text-foreground">{app.pharmacy_name || "Pharmacy"}</div>
                          <div className="text-[11px] text-muted-foreground">License: {app.license_number || "Pending"}</div>
                        </div>
                      )}
                      {app.type === "delivery" && (
                        <div>
                          <div className="text-xs text-foreground">Vehicle: {app.vehicle_type || "Two-wheeler"}</div>
                          <div className="text-[11px] text-muted-foreground">DL: {app.driving_license || "Verified"}</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground tabular-nums">
                      {new Date(app.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReviewModal(app)}
                        className="h-7 px-2.5 text-xs gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Review
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No partner applications matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          {selectedApp && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between pr-4">
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    {getRoleIcon(selectedApp.type)}
                    Review {selectedApp.type.toUpperCase()} Application
                  </DialogTitle>
                  <StatusBadge status={selectedApp.status} />
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Ingested on {new Date(selectedApp.createdAt).toLocaleString("en-IN")}
                </DialogDescription>
              </DialogHeader>

              {/* Applicant Credentials Summary */}
              <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Applicant Name</span>
                    <span className="font-semibold text-foreground">{selectedApp.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Email</span>
                    <span className="text-foreground">{selectedApp.email}</span>
                  </div>
                </div>

                {selectedApp.phone && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Phone</span>
                    <span className="text-foreground">{selectedApp.phone}</span>
                  </div>
                )}

                {selectedApp.type === "doctor" && (
                  <div className="pt-1 border-t">
                    <span className="text-muted-foreground block text-[11px]">Medical Council Registration</span>
                    <span className="font-mono font-medium text-foreground">{selectedApp.registration_number || "N/A"}</span>
                  </div>
                )}

                {selectedApp.type === "pharmacist" && (
                  <div className="pt-1 border-t space-y-1">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Pharmacy Name</span>
                      <span className="font-medium text-foreground">{selectedApp.pharmacy_name || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Drug License Number</span>
                      <span className="font-mono font-medium text-foreground">{selectedApp.license_number || "N/A"}</span>
                    </div>
                  </div>
                )}

                {selectedApp.type === "delivery" && (
                  <div className="pt-1 border-t space-y-1">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Vehicle Type</span>
                      <span className="font-medium text-foreground">{selectedApp.vehicle_type || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Driving License</span>
                      <span className="font-mono font-medium text-foreground">{selectedApp.driving_license || "N/A"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Review Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Administrative Review Remarks
                </label>
                <Input
                  placeholder="e.g. Verified against state registry."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReviewAction("REJECT")}
                    disabled={actionLoading}
                    className="gap-1 text-xs"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject Application
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReviewAction("APPROVE")}
                    disabled={actionLoading}
                    className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve & Provision Account
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

