import { useState, useEffect } from "react";
import axios from "axios";

import AdminNavbar from "../components/AdminNavbar.jsx";
import AdminFooter from "../components/AdminFooter.jsx";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Users,
  Store,
  DollarSign,
  FileText,
  UserPlus,
  RefreshCw,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AdminDashboardPage = () => {
  const { token } = useAuth();
  const authToken = token || localStorage.getItem("token");

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "pharmacy",
  });

  const [applications, setApplications] = useState({ doctors: [], pharmacists: [], delivery: [] });
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      const [statsRes, usersRes, pharmaciesRes, applicationsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get(`${API_URL}/admin/pharmacies`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get(`${API_URL}/onboarding/admin/applications`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPharmacies(pharmaciesRes.data);
      setApplications(applicationsRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [authToken]);

  // ================= ADMIN ACTIONS =================
  const handleReviewApp = async (id, role, action) => {
    if (action === "REJECT" && !rejectReason) return toast.error("Rejection reason is required");

    setReviewLoading(true);
    try {
      await axios.post(`${API_URL}/onboarding/admin/review/${id}`, {
        role,
        action,
        remarks: rejectReason
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      toast.success(`Application ${action === "APPROVE" ? "Approved" : "Rejected"}`);
      setSelectedApp(null);
      setRejectReason("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setReviewLoading(false);
    }
  };

  // ================= VERIFY PHARMACY =================
  const handleVerifyPharmacy = async (id) => {
    try {
      await axios.put(
        `${API_URL}/admin/pharmacies/${id}/verify`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      toast.success("Pharmacy verified");
      fetchData();
    } catch {
      toast.error("Verification failed");
    }
  };

  // ================= CREATE USER =================
  const handleCreateUser = async () => {
    try {
      await axios.post(`${API_URL}/admin/create-user`, newUser, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      toast.success("User created successfully");
      setNewUser({ name: "", email: "", phone: "", password: "", role: "pharmacy" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Create user failed");
    }
  };

  const COLORS = ["#0066FF", "#06B6D4", "#10B981", "#F59E0B"];

  const userRoleData = [
    {
      name: "Customers",
      value: users.filter((u) => u.role === "customer").length,
    },
    {
      name: "Pharmacies",
      value: users.filter((u) => u.role === "pharmacy").length,
    },
    {
      name: "Delivery",
      value: users.filter((u) => u.role === "delivery").length,
    },
    { name: "Admins", value: users.filter((u) => u.role === "admin").length },
  ].filter((d) => d.value > 0);

  const orderData =
    stats?.recent_orders?.map((o, i) => ({
      name: `Day ${i + 1}`,
      revenue: o.total,
    })) || [];

  // ================= RENDER HELPERS =================
  const renderAppTable = (apps, type) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {apps.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
              No pending applications
            </TableCell>
          </TableRow>
        ) : apps.map(app => (
          <TableRow key={app._id}>
            <TableCell className="font-medium">{app.name || app.owner_name}</TableCell>
            <TableCell>{app.email}</TableCell>
            <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
            <TableCell><Badge variant="outline">{app.status}</Badge></TableCell>
            <TableCell>
              <Button size="sm" onClick={() => setSelectedApp({ ...app, appType: type })}>View</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-600">Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <AdminNavbar />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{new Date().toDateString()}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats?.users_count || 0}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Pending Apps</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {(applications.doctors.length + applications.pharmacists.length + applications.delivery.length) || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">₹{stats?.total_revenue?.toFixed(2) || "0.00"}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Pharmacies</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{pharmacies.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-white border shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="create-user">Create User</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {orderData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={orderData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#0066FF" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      No order revenue data recorded yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">User Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {userRoleData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={userRoleData} dataKey="value" nameKey="name" label cx="50%" cy="50%" outerRadius={90}>
                          {userRoleData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      No users available.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Registered Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u._id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                            {u.role}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PHARMACIES */}
          <TabsContent value="pharmacies">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Pharmacy Partners ({pharmacies.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pharmacies.map((p) => (
                      <TableRow key={p._id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>
                          {p.verified ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!p.verified && (
                            <Button
                              size="sm"
                              onClick={() => handleVerifyPharmacy(p._id)}
                            >
                              Verify
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CREATE USER */}
          <TabsContent value="create-user">
            <Card className="shadow-sm max-w-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  Provision Operational Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Partner Name"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input
                    placeholder="partner@example.com"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="+91 9876543210"
                    value={newUser.phone}
                    onChange={(e) =>
                      setNewUser({ ...newUser, phone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Temporary Password</Label>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Assigned Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) =>
                      setNewUser({ ...newUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleCreateUser} className="w-full bg-blue-600 hover:bg-blue-700">
                  Create User
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= APPLICATIONS TAB ================= */}
          <TabsContent value="applications">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Partner Join Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="doctors">
                  <TabsList className="mb-4">
                    <TabsTrigger value="doctors">Doctors ({applications.doctors.length})</TabsTrigger>
                    <TabsTrigger value="pharmacists">Pharmacists ({applications.pharmacists.length})</TabsTrigger>
                    <TabsTrigger value="delivery">Delivery ({applications.delivery.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="doctors">{renderAppTable(applications.doctors, "doctor")}</TabsContent>
                  <TabsContent value="pharmacists">{renderAppTable(applications.pharmacists, "pharmacist")}</TabsContent>
                  <TabsContent value="delivery">{renderAppTable(applications.delivery, "delivery")}</TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* APP DETAILS DIALOG */}
            <Dialog open={!!selectedApp} onOpenChange={(o) => !o && setSelectedApp(null)}>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Application Details</DialogTitle>
                  <DialogDescription>Review application for {selectedApp?.appType}</DialogDescription>
                </DialogHeader>

                {selectedApp && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label className="text-xs text-muted-foreground">Name</Label><p className="font-medium">{selectedApp.name || selectedApp.owner_name}</p></div>
                      <div><Label className="text-xs text-muted-foreground">Email</Label><p className="font-medium">{selectedApp.email}</p></div>
                      <div><Label className="text-xs text-muted-foreground">Phone</Label><p className="font-medium">{selectedApp.phone}</p></div>
                      <div><Label className="text-xs text-muted-foreground">Status</Label><div><Badge>{selectedApp.status}</Badge></div></div>

                      {/* Dynamic Fields */}
                      {selectedApp.registration_number && <div><Label className="text-xs text-muted-foreground">Reg No</Label><p className="font-medium">{selectedApp.registration_number}</p></div>}
                      {selectedApp.specialization && <div><Label className="text-xs text-muted-foreground">Specialization</Label><p className="font-medium">{selectedApp.specialization}</p></div>}
                      {selectedApp.pharmacy_name && <div><Label className="text-xs text-muted-foreground">Pharmacy</Label><p className="font-medium">{selectedApp.pharmacy_name}</p></div>}
                      {selectedApp.license_number && <div><Label className="text-xs text-muted-foreground">License</Label><p className="font-medium">{selectedApp.license_number}</p></div>}
                      {selectedApp.vehicle_type && <div><Label className="text-xs text-muted-foreground">Vehicle</Label><p className="font-medium">{selectedApp.vehicle_type}</p></div>}
                    </div>

                    {/* Documents */}
                    <div className="space-y-4 border-t pt-4">
                      <Label className="text-sm font-semibold">Verification Documents</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(selectedApp).filter(([k, v]) =>
                          (k.includes("certificate") || k.includes("proof") || k.includes("license")) &&
                          typeof v === 'string' && v.startsWith("data:")
                        ).map(([key, val]) => (
                          <div key={key} className="border p-2 rounded-lg bg-slate-50">
                            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{key.replace(/_/g, " ")}</p>
                            <img src={val} alt={key} className="max-w-full h-auto max-h-48 object-contain rounded" />
                            <a href={val} download={`${key}.jpg`} className="text-xs text-blue-600 hover:underline mt-1.5 block">Download File</a>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="space-y-4 border-t pt-4 bg-muted/30 p-4 rounded-lg">
                      <Label className="text-xs font-semibold">Admin Remarks (Required for Rejection)</Label>
                      <Textarea
                        placeholder="Enter remarks or grounds for review..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div className="flex gap-4 justify-end">
                        <Button
                          variant="destructive"
                          onClick={() => handleReviewApp(selectedApp._id, selectedApp.appType, "REJECT")}
                          disabled={reviewLoading}
                        >
                          Reject
                        </Button>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleReviewApp(selectedApp._id, selectedApp.appType, "APPROVE")}
                          disabled={reviewLoading}
                        >
                          Approve & Create Account
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>
      <AdminFooter />
    </div>
  );
};

export default AdminDashboardPage;

