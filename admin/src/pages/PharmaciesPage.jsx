import React, { useState, useEffect, useMemo } from "react";
import {
  Store,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw
} from "lucide-react";
import { adminApi } from "@/lib/api";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPharmacies();
      setPharmacies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch pharmacies error:", err);
      toast.error("Failed to load pharmacies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const handleToggleVerification = async (pharmacy) => {
    try {
      setActionLoadingId(pharmacy._id);
      const newStatus = !pharmacy.verified;
      await adminApi.verifyPharmacy(pharmacy._id, newStatus);
      toast.success(
        `Pharmacy ${pharmacy.name} ${newStatus ? "verified" : "marked unverified"}`
      );
      // Local optimistic update
      setPharmacies((prev) =>
        prev.map((p) => (p._id === pharmacy._id ? { ...p, verified: newStatus } : p))
      );
    } catch (err) {
      toast.error("Failed to update pharmacy verification");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredPharmacies = useMemo(() => {
    if (!searchQuery.trim()) return pharmacies;
    const q = searchQuery.toLowerCase();
    return pharmacies.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.address && String(p.address).toLowerCase().includes(q))
    );
  }, [pharmacies, searchQuery]);

  const columns = useMemo(
    () => [
      {
        header: "Pharmacy Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-xs text-foreground">{row.original.name}</div>
              <div className="text-[11px] text-muted-foreground">ID: {row.original._id.slice(-6)}</div>
            </div>
          </div>
        )
      },
      {
        header: "Contact Info",
        cell: ({ row }) => (
          <div className="text-xs space-y-0.5">
            <div className="text-foreground flex items-center gap-1">
              <Mail className="h-3 w-3 text-muted-foreground" />
              {row.original.email || "N/A"}
            </div>
            <div className="text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {row.original.phone || "No phone"}
            </div>
          </div>
        )
      },
      {
        header: "Address",
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground flex items-start gap-1 max-w-[220px] truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{typeof row.original.address === "object" ? JSON.stringify(row.original.address) : (row.original.address || "Unspecified")}</span>
          </div>
        )
      },
      {
        header: "License Status",
        accessorKey: "verified",
        cell: ({ row }) => (
          <StatusBadge status={row.original.verified ? "verified" : "unverified"} />
        )
      },
      {
        id: "actions",
        header: "Verification Action",
        cell: ({ row }) => {
          const isVerified = row.original.verified;
          const isLoading = actionLoadingId === row.original._id;

          return (
            <Button
              variant={isVerified ? "outline" : "default"}
              size="sm"
              disabled={isLoading}
              onClick={() => handleToggleVerification(row.original)}
              className="h-7 px-2.5 text-xs gap-1 font-medium"
            >
              {isVerified ? (
                <>
                  <ShieldAlert className="h-3 w-3 text-rose-500" />
                  Revoke
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3 w-3" />
                  Verify Partner
                </>
              )}
            </Button>
          );
        }
      }
    ],
    [actionLoadingId]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Pharmacy Management
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Audit licensed partner dispensaries, inspect fulfillment locations, and enforce compliance verifications.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchPharmacies}
          disabled={loading}
          className="h-8 px-2.5 text-xs gap-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* TanStack Pharmacies Table */}
      <DataTable
        columns={columns}
        data={filteredPharmacies}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search pharmacy name, email, location..."
        exportFileName="medszop_pharmacies.csv"
      />
    </div>
  );
}

