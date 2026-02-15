import { useState, useEffect } from "react";
import axios from "axios";

import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer";

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
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Shield,
  Users,
  Store,
  Package,
  DollarSign,
  CheckCircle,
  Eye,
  FileText,
  X,
  Check,
  AlertCircle
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

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
      const [statsRes, usersRes, pharmaciesRes] = await Promise.all([
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
  }, [authToken]); // Added dependency for safety

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
      setSelectedApp(null); // Close dialog
      setRejectReason("");
      fetchData(); // Refresh list
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

      toast.success("User created");
      setNewUser({ name: "", email: "", password: "", role: "pharmacy" });
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
            <TableCell colSpan={5} className="text-center">No pending applications</TableCell>
          </TableRow>
        ) : apps.map(app => (
          <TableRow key={app._id}>
            <TableCell>{app.name || app.owner_name}</TableCell>
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

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <Navbar />

      <main className="flex-1 container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">{new Date().toDateString()}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users_count || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Apps</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(applications.doctors.length + applications.pharmacists.length + applications.delivery.length) || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.total_revenue?.toFixed(2) || "0.00"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pharmacies</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pharmacies.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="create-user">Create User</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#0066FF" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={userRoleData} dataKey="value" label>
                        {userRoleData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users">
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
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge>{u.role}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          {/* PHARMACIES */}
          <TabsContent value="pharmacies">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pharmacies.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      {p.verified ? (
                        <Badge>Verified</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
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
          </TabsContent>

          {/* CREATE USER */}
          <TabsContent value="create-user">
            <div className="max-w-md space-y-4">
              <Input
                placeholder="Name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
              />
              <Input
                placeholder="Email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
              <Input
                placeholder="Phone Number"
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser({ ...newUser, phone: e.target.value })
                }
              />

              <Input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />

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

              <Button onClick={handleCreateUser}>Create User</Button>
            </div>
          </TabsContent>
          {/* ================= APPLICATIONS TAB ================= */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Join Requests</CardTitle>
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
                      <div><Label>Name</Label><p className="font-medium">{selectedApp.name || selectedApp.owner_name}</p></div>
                      <div><Label>Email</Label><p className="font-medium">{selectedApp.email}</p></div>
                      <div><Label>Phone</Label><p className="font-medium">{selectedApp.phone}</p></div>
                      <div><Label>Status</Label><Badge>{selectedApp.status}</Badge></div>

                      {/* Dynamic Fields */}
                      {selectedApp.registration_number && <div><Label>Reg No</Label><p>{selectedApp.registration_number}</p></div>}
                      {selectedApp.specialization && <div><Label>Specialization</Label><p>{selectedApp.specialization}</p></div>}
                      {selectedApp.pharmacy_name && <div><Label>Pharmacy</Label><p>{selectedApp.pharmacy_name}</p></div>}
                      {selectedApp.license_number && <div><Label>License</Label><p>{selectedApp.license_number}</p></div>}
                      {selectedApp.vehicle_type && <div><Label>Vehicle</Label><p>{selectedApp.vehicle_type}</p></div>}
                    </div>

                    {/* Documents */}
                    <div className="space-y-4 border-t pt-4">
                      <Label className="text-lg">Documents</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(selectedApp).filter(([k, v]) =>
                          (k.includes("certificate") || k.includes("proof") || k.includes("license")) &&
                          typeof v === 'string' && v.startsWith("data:")
                        ).map(([key, val]) => (
                          <div key={key} className="border p-2 rounded">
                            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{key.replace(/_/g, " ")}</p>
                            <img src={val} alt={key} className="max-w-full h-auto max-h-48 object-contain" />
                            <a href={val} download={`${key}.jpg`} className="text-xs text-blue-500 mt-1 block">Download</a>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="space-y-4 border-t pt-4 bg-muted/30 p-4 rounded-lg">
                      <Label>Admin Remarks (Required for Rejection)</Label>
                      <Textarea
                        placeholder="Enter remarks..."
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
                          className="bg-green-600 hover:bg-green-700"
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
      <Footer />
    </div>
  );
};

export default AdminDashboardPage;
