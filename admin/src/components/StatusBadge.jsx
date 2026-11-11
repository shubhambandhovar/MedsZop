import React from "react";
import { cn } from "@/lib/utils";

const STATUS_CONFIGS = {
  // Order statuses
  pending: { label: "Pending", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  placed: { label: "Placed", bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
  confirmed: { label: "Confirmed", bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  packed: { label: "Packed", bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
  out_for_delivery: { label: "Out for Delivery", bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  delivered: { label: "Delivered", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  cancelled: { label: "Cancelled", bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },

  // Verification & Application statuses
  verified: { label: "Verified", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  unverified: { label: "Unverified", bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" },
  pending_review: { label: "Pending Review", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  approved: { label: "Approved", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  rejected: { label: "Rejected", bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },

  // Payment statuses
  paid: { label: "Paid", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  success: { label: "Success", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  failed: { label: "Failed", bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  refunded: { label: "Refunded", bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  initiated: { label: "Initiated", bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },

  // User Roles
  admin: { label: "Admin", bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  doctor: { label: "Doctor", bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" },
  pharmacy: { label: "Pharmacy", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  delivery: { label: "Delivery", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  customer: { label: "Customer", bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" },
};

export default function StatusBadge({ status, className, customLabel }) {
  if (!status) return null;
  const key = String(status).toLowerCase().replace(/\s+/g, "_");
  const config = STATUS_CONFIGS[key] || {
    label: customLabel || status,
    bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tabular-nums transition-colors",
        config.bg,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {customLabel || config.label}
    </span>
  );
}

