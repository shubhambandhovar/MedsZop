import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Phone,
  Mail,
  Calendar,
  RefreshCw,
  UserCheck
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const handleRoleChange = async (targetUser, newRole) => {
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

  const columns = useMemo(
    () => [
      {
        header: "User Identity",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
              {row.original.name ? row.original.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="font-semibold text-xs text-foreground">{row.original.name || "Anonymous User"}</div>
              <div className="text-[11px] text-muted-foreground font-mono">{row.original._id.slice(-8)}</div>
            </div>
          </div>
        )
      },
      {
        header: "Email & Phone",
        cell: ({ row }) => (
          <div className="text-xs space-y-0.5">
            <div className="text-foreground flex items-center gap-1">
              <Mail className="h-3 w-3 text-muted-foreground" />
              {row.original.email}
            </div>
            {row.original.phone && (
              <div className="text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {row.original.phone}
              </div>
            )}
          </div>
        )
      },
      {
        header: "Current Role",
        accessorKey: "role",
        cell: ({ row }) => <StatusBadge status={row.original.role || "customer"} />
      },
      {
        header: "Joined Date",
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
        id: "role_control",
        header: "Role Assignment",
        cell: ({ row }) => (
          <div className="w-32">
            <Select
              value={row.original.role || "customer"}
              onValueChange={(newRole) => handleRoleChange(row.original, newRole)}
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
        )
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

          <Button size="sm" onClick={() => setCreateModalOpen(true)} className="h-8 px-3 text-xs gap-1.5 font-medium">
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

      {/* Provision Account Modal */}
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
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
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

