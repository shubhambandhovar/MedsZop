import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Phone,
  Mail,
  Calendar,
  RefreshCw,
  UserCheck,
  Eye,
  UserX,
  Trash2,
  AlertTriangle,
  FileText,
  Package,
  Stethoscope,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Building2,
  Clock,
  Lock
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function CustomersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create User modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "customer",
    password: ""
  });

  // 1. View User Details Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // 2. Deactivate / Reactivate Modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTargetUser, setStatusTargetUser] = useState(null);
  const [statusReason, setStatusReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // 3. Permanent Deletion & Anonymization Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [deletionDeps, setDeletionDeps] = useState(null);
  const [checkingDeps, setCheckingDeps] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({
        page,
        limit: 10,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        search: searchQuery || undefined
      });
      setUsers(res.users || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Fetch users error:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, searchQuery]);

  // Handle Role Change
  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.isDeleted) {
      toast.error("Cannot modify the role of an anonymized or deleted account.");
      return;
    }

    if (targetUser._id === currentAdmin?._id && newRole !== "admin") {
      toast.error("You cannot demote your own administrator account.");
      return;
    }

    try {
      await adminApi.updateUserRole(targetUser._id, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  // Handle Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Name, email and password are required");
      return;
    }

    try {
      setCreating(true);
      await adminApi.createUser(newUser);
      toast.success(`User ${newUser.name} created as ${newUser.role}`);
      setCreateModalOpen(false);
      setNewUser({ name: "", email: "", phone: "", role: "customer", password: "" });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  // Open Details Modal
  const openUserDetails = async (user) => {
    setSelectedUserDetails(null);
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    setCopiedId(false);
    try {
      const data = await adminApi.getUserById(user._id);
      setSelectedUserDetails(data);
    } catch (err) {
      toast.error("Failed to fetch detailed user record");
      setDetailsModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Open Deactivate / Reactivate Modal
  const openStatusDialog = (user) => {
    if (user._id === currentAdmin?._id && user.isActive !== false) {
      toast.error("You cannot deactivate your own administrator account.");
      return;
    }
    if (user.isDeleted) {
      toast.error("This account has already been permanently anonymized/deleted.");
      return;
    }
    setStatusTargetUser(user);
    setStatusReason("");
    setStatusModalOpen(true);
  };

  // Execute Deactivate / Reactivate
  const handleUpdateStatus = async () => {
    if (!statusTargetUser) return;
    const willBeActive = statusTargetUser.isActive === false;

    try {
      setUpdatingStatus(true);
      await adminApi.updateUserStatus(statusTargetUser._id, {
        isActive: willBeActive,
        reason: statusReason || undefined
      });
      toast.success(
        `User account ${willBeActive ? "reactivated successfully" : "deactivated successfully"}`
      );
      setStatusModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update account status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Open Permanent Deletion Modal
  const openDeleteDialog = async (user) => {
    if (user._id === currentAdmin?._id) {
      toast.error("You cannot delete your own administrator account.");
      return;
    }
    if (user.isDeleted) {
      toast.error("This account is already anonymized.");
      return;
    }

    setDeleteTargetUser(user);
    setDeleteConfirmationInput("");
    setDeleteReason("");
    setDeletionDeps(null);
    setDeleteModalOpen(true);
    setCheckingDeps(true);

    try {
      const deps = await adminApi.checkUserDeletionDependencies(user._id);
      setDeletionDeps(deps);
    } catch (err) {
      toast.error("Failed to inspect account dependencies");
    } finally {
      setCheckingDeps(false);
    }
  };

  // Execute Permanent Deletion / Anonymization
  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    if (deleteConfirmationInput !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    try {
      setDeleting(true);
      const res = await adminApi.deleteUser(deleteTargetUser._id, {
        confirmation: "DELETE",
        reason: deleteReason || undefined,
        anonymize: !deletionDeps?.canHardDelete
      });
      toast.success(res.message || "User account deleted successfully");
      setDeleteModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  // Copy ID to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const columns = useMemo(
    () => [
      {
        header: "User Identity",
        cell: ({ row }) => {
          const user = row.original;
          const isAnon = user.isDeleted;
          return (
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                  isAnon
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {user.name && !isAnon ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <div
                  className={`font-semibold text-xs truncate ${
                    isAnon ? "italic text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {user.name || "Anonymous User"}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {user._id.slice(-8)}
                </div>
              </div>
            </div>
          );
        }
      },
      {
        header: "Email & Phone",
        cell: ({ row }) => (
          <div className="text-xs space-y-0.5">
            <div className="text-foreground flex items-center gap-1 font-mono text-[11px] truncate max-w-[200px]">
              <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="truncate">{row.original.email}</span>
            </div>
            {row.original.phone && (
              <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                <Phone className="h-3 w-3 shrink-0" />
                {row.original.phone}
              </div>
            )}
          </div>
        )
      },
      {
        header: "Role",
        accessorKey: "role",
        cell: ({ row }) => <StatusBadge status={row.original.role || "customer"} />
      },
      {
        header: "Status",
        cell: ({ row }) => {
          const u = row.original;
          if (u.isDeleted) {
            return <StatusBadge status="anonymized" customLabel="Anonymized" />;
          }
          if (u.isActive === false) {
            return <StatusBadge status="deactivated" customLabel="Deactivated" />;
          }
          return <StatusBadge status="active" customLabel="Active" />;
        }
      },
      {
        header: "Joined Date",
        accessorKey: "createdAt",
        cell: ({ row }) => {
          const d = new Date(row.original.createdAt);
          return (
            <div className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {d.toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </div>
          );
        }
      },
      {
        id: "role_control",
        header: "Role Assignment",
        cell: ({ row }) => {
          const isAnon = row.original.isDeleted;
          return (
            <div className="w-28">
              <Select
                value={row.original.role || "customer"}
                onValueChange={(newRole) => handleRoleChange(row.original, newRole)}
                disabled={isAnon}
              >
                <SelectTrigger className="h-7 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        }
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = user._id === currentAdmin?._id;
          const isAnon = user.isDeleted;
          const isDeactivated = user.isActive === false;

          return (
            <div className="flex items-center gap-1">
              {/* View Details */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="View user details and linked records"
                onClick={() => openUserDetails(user)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>

              {/* Deactivate / Reactivate */}
              <Button
                variant="ghost"
                size="icon"
                disabled={isSelf || isAnon}
                className={`h-7 w-7 ${
                  isDeactivated
                    ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                }`}
                title={
                  isSelf
                    ? "Cannot deactivate your own account"
                    : isAnon
                    ? "Account is anonymized"
                    : isDeactivated
                    ? "Reactivate account"
                    : "Deactivate account"
                }
                onClick={() => openStatusDialog(user)}
              >
                {isDeactivated ? (
                  <UserCheck className="h-3.5 w-3.5" />
                ) : (
                  <UserX className="h-3.5 w-3.5" />
                )}
              </Button>

              {/* Delete / Anonymize */}
              <Button
                variant="ghost"
                size="icon"
                disabled={isSelf || isAnon}
                className="h-7 w-7 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                title={
                  isSelf
                    ? "Cannot delete your own account"
                    : isAnon
                    ? "Account already anonymized"
                    : "Permanently delete or anonymize account"
                }
                onClick={() => openDeleteDialog(user)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        }
      }
    ],
    [currentAdmin]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Customer & User Management
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Directory of all registered accounts across patient, partner, courier, and admin roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="h-8 px-2.5 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="h-8 px-3 text-xs gap-1.5 font-medium"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Provision Account
          </Button>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {["ALL", "customer", "pharmacy", "delivery", "doctor", "admin"].map((r) => (
          <button
            key={r}
            onClick={() => {
              setRoleFilter(r);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium capitalize whitespace-nowrap transition-colors ${
              roleFilter === r
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {r === "ALL" ? "All Users" : r}
          </button>
        ))}
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        page={page}
        pageCount={totalPages}
        onPageChange={setPage}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchPlaceholder="Search by name, email, phone number..."
        exportFileName="medszop_users.csv"
      />

      {/* ========================================================================= */}
      {/* 1. VIEW USER DETAILS MODAL                                                */}
      {/* ========================================================================= */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              User Account Record
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Comprehensive profile and linked healthcare transaction summary.
            </DialogDescription>
          </DialogHeader>

          {detailsLoading || !selectedUserDetails ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              Loading user profile & dependencies...
            </div>
          ) : (
            <div className="space-y-4 py-2 text-xs">
              {/* Identity Header */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                  {selectedUserDetails.user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground flex items-center gap-2 truncate">
                    {selectedUserDetails.user.name}
                    <StatusBadge status={selectedUserDetails.user.role} />
                  </div>
                  <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                    <span>ID: {selectedUserDetails.user._id}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedUserDetails.user._id)}
                      className="hover:text-foreground inline-flex items-center"
                    >
                      {copiedId ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Deactivated Notice Banner if applicable */}
              {selectedUserDetails.user.isActive === false && (
                <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Account is Currently Deactivated
                  </div>
                  <div className="text-[11px] leading-relaxed">
                    Deactivated by{" "}
                    <strong>{selectedUserDetails.user.deactivatedBy || "Admin"}</strong> on{" "}
                    {selectedUserDetails.user.deactivatedAt
                      ? new Date(selectedUserDetails.user.deactivatedAt).toLocaleString()
                      : "N/A"}
                    .
                  </div>
                  {selectedUserDetails.user.deactivationReason && (
                    <div className="text-[11px] italic bg-background/50 p-1.5 rounded">
                      Reason: "{selectedUserDetails.user.deactivationReason}"
                    </div>
                  )}
                </div>
              )}

              {/* Anonymized Notice Banner if applicable */}
              {selectedUserDetails.user.isDeleted && (
                <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Account has been Anonymized & Removed
                  </div>
                  <div className="text-[11px]">
                    PII scrubbed by{" "}
                    <strong>{selectedUserDetails.user.deletedBy || "Admin"}</strong> on{" "}
                    {selectedUserDetails.user.deletedAt
                      ? new Date(selectedUserDetails.user.deletedAt).toLocaleString()
                      : "N/A"}
                    .
                  </div>
                  {selectedUserDetails.user.deletionReason && (
                    <div className="text-[11px] italic bg-background/50 p-1.5 rounded">
                      Reason: "{selectedUserDetails.user.deletionReason}"
                    </div>
                  )}
                </div>
              )}

              {/* Linked Records KPI Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg border border-border bg-card flex flex-col items-center justify-center text-center">
                  <Package className="h-4 w-4 text-primary mb-1" />
                  <span className="text-lg font-bold text-foreground">
                    {selectedUserDetails.stats?.ordersCount ?? 0}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Orders
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-card flex flex-col items-center justify-center text-center">
                  <FileText className="h-4 w-4 text-emerald-500 mb-1" />
                  <span className="text-lg font-bold text-foreground">
                    {selectedUserDetails.stats?.prescriptionsCount ?? 0}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Prescriptions
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-card flex flex-col items-center justify-center text-center">
                  <Stethoscope className="h-4 w-4 text-cyan-500 mb-1" />
                  <span className="text-lg font-bold text-foreground">
                    {selectedUserDetails.stats?.consultationsCount ?? 0}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Consultations
                  </span>
                </div>
              </div>

              {/* Key Attributes */}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> Email Address
                  </span>
                  <span className="font-mono text-foreground">{selectedUserDetails.user.email}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> Phone Number
                  </span>
                  <span className="text-foreground">
                    {selectedUserDetails.user.phone || "Not recorded"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Account Created
                  </span>
                  <span className="text-foreground">
                    {new Date(selectedUserDetails.user.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Lock className="h-3 w-3" /> Google OAuth SSO
                  </span>
                  <span className="text-foreground">
                    {selectedUserDetails.user.googleId ? "Enabled" : "Password only"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3 w-3" /> Account Active
                  </span>
                  <span>
                    {selectedUserDetails.user.isActive !== false ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Deactivated
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDetailsModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. DEACTIVATE / REACTIVATE CONFIRMATION MODAL                             */}
      {/* ========================================================================= */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {statusTargetUser?.isActive === false ? (
                <>
                  <UserCheck className="h-4 w-4 text-emerald-500" />
                  Reactivate User Account
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4 text-amber-500" />
                  Deactivate User Account
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {statusTargetUser?.isActive === false
                ? "Restore platform access and login capability for this account."
                : "Block authentication and invalidate active sessions server-side."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            {statusTargetUser?.isActive === false ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Account Reactivation
                </div>
                <p className="text-[11px] leading-relaxed">
                  Reactivating <strong>{statusTargetUser?.name}</strong> (
                  {statusTargetUser?.email}) will allow them to log in again and use all platform
                  features corresponding to their role.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Immediate Session Revocation
                </div>
                <p className="text-[11px] leading-relaxed">
                  Deactivating <strong>{statusTargetUser?.name}</strong> (
                  {statusTargetUser?.email}) will reject further login attempts and immediately
                  invalidate any active JWT sessions server-side.
                </p>
                <p className="text-[11px] leading-relaxed text-muted-foreground mt-1">
                  All past transaction history, prescription ledgers, and order records will be
                  safely retained for compliance.
                </p>
              </div>
            )}

            {statusTargetUser?.isActive !== false && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs">Reason for Deactivation (Optional)</Label>
                <Textarea
                  placeholder="e.g. Inactive account audit, suspicious login attempt, user request..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={updatingStatus}
              onClick={handleUpdateStatus}
              className={
                statusTargetUser?.isActive === false
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }
            >
              {updatingStatus
                ? "Processing..."
                : statusTargetUser?.isActive === false
                ? "Reactivate Account"
                : "Confirm Deactivation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 3. PERMANENT DELETION & ANONYMIZATION MODAL                                */}
      {/* ========================================================================= */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Trash2 className="h-4 w-4" />
              Account Deletion & Data Retention Check
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Evaluates clinical dependencies and applies healthcare retention safeguards.
            </DialogDescription>
          </DialogHeader>

          {checkingDeps || !deletionDeps ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin text-rose-500" />
              Scanning MongoDB dependencies (Orders, Prescriptions, Consultations)...
            </div>
          ) : (
            <div className="space-y-3.5 py-2 text-xs">
              {/* Account summary */}
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">{deleteTargetUser?.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {deleteTargetUser?.email}
                  </div>
                </div>
                <StatusBadge status={deleteTargetUser?.role} />
              </div>

              {/* Dependency Grid */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Linked Healthcare & Commerce Records
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded border border-border bg-card text-center">
                    <span className="block text-sm font-bold text-foreground">
                      {(deletionDeps.dependencies?.customerOrders || 0) +
                        (deletionDeps.dependencies?.courierOrders || 0)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Orders</span>
                  </div>
                  <div className="p-2 rounded border border-border bg-card text-center">
                    <span className="block text-sm font-bold text-foreground">
                      {deletionDeps.dependencies?.prescriptions || 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Prescriptions</span>
                  </div>
                  <div className="p-2 rounded border border-border bg-card text-center">
                    <span className="block text-sm font-bold text-foreground">
                      {(deletionDeps.dependencies?.patientConsultations || 0) +
                        (deletionDeps.dependencies?.doctorConsultations || 0)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Consultations</span>
                  </div>
                  <div className="p-2 rounded border border-border bg-card text-center">
                    <span className="block text-sm font-bold text-foreground">
                      {(deletionDeps.dependencies?.partnerApplications || 0) +
                        (deletionDeps.dependencies?.pharmacies || 0)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Partner Records</span>
                  </div>
                </div>
              </div>

              {/* Retention Policy Explanation Banner */}
              {deletionDeps.canHardDelete ? (
                <div className="p-3 rounded-md bg-slate-500/10 border border-slate-500/20 text-slate-800 dark:text-slate-200 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Zero Clinical Dependencies Detected
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    This account has no associated orders, prescriptions, or consultations. It will
                    be <strong>permanently purged</strong> from the database.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    Legal Healthcare Retention Requirement
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Under pharmacy compliance rules, accounts with prescription or clinical records
                    cannot be hard-deleted.
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    MedsZop will perform <strong>Safe PII Anonymization</strong>:
                  </p>
                  <ul className="text-[11px] list-disc list-inside space-y-0.5 pl-1 opacity-90">
                    <li>Customer name replaced with "Deleted User"</li>
                    <li>Email replaced with an unresolvable anonymized hash</li>
                    <li>Phone numbers, delivery addresses, and cart data erased</li>
                    <li>Passwords and OAuth credentials destroyed</li>
                    <li>Audit trail and order totals preserved without PII</li>
                  </ul>
                </div>
              )}

              {/* Optional Reason */}
              <div className="space-y-1">
                <Label className="text-xs">Reason for Deletion (Optional)</Label>
                <Input
                  placeholder="e.g. GDPR / Data privacy request, account closure"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              {/* Strict Confirmation Typing Input */}
              <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 space-y-2">
                <Label className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Type DELETE to confirm permanent action:
                </Label>
                <Input
                  placeholder="Type DELETE"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  className="h-8 text-xs font-mono uppercase bg-background"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={deleteConfirmationInput !== "DELETE" || deleting}
              onClick={handleDeleteUser}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium gap-1.5"
            >
              {deleting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : deletionDeps?.canHardDelete ? (
                "Permanently Purge Account"
              ) : (
                "Anonymize & Remove PII"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 4. PROVISION ACCOUNT MODAL                                                */}
      {/* ========================================================================= */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Provision Platform Account
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Explicit administrative account creation with assigned security role.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Full Name *</Label>
                <Input
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Email Address *</Label>
                <Input
                  required
                  type="email"
                  placeholder="user@medszop.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Phone Number</Label>
                <Input
                  placeholder="+91 9876543210"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Security Role *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(val) => setNewUser({ ...newUser, role: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy Partner</SelectItem>
                    <SelectItem value="delivery">Delivery Partner</SelectItem>
                    <SelectItem value="doctor">Licensed Doctor</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Initial Password *</Label>
                <Input
                  required
                  type="password"
                  placeholder="At least 8 characters"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={creating}>
                {creating ? "Provisioning..." : "Provision Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
