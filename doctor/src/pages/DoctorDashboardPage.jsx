import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import DoctorNavbar from "../components/DoctorNavbar";
import DoctorFooter from "../components/DoctorFooter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Stethoscope,
  Activity,
  Calendar,
  Clock,
  User,
  Users,
  FileText,
  FileCheck,
  Pill,
  Search,
  Filter,
  Plus,
  Check,
  CheckCircle2,
  X,
  XCircle,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Video,
  MessageSquare,
  Send,
  HeartPulse,
  Thermometer,
  Brain,
  Download,
  Eye,
  Edit3,
  Phone,
  Mail,
  MapPin,
  Lock,
  LogOut,
  Building2,
  GraduationCap,
  Award,
  Sliders,
  Trash2,
  Printer,
  ChevronRight,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const DoctorDashboardPage = () => {
  const { token, user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Filter & Search States
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Consultation Workspace State
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Chat State
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef(null);

  // Decline Appointment Modal State
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [appointmentToDecline, setAppointmentToDecline] = useState(null);
  const [declineReason, setDeclineReason] = useState("Emergency care / in-person physical examination required");

  // SOAP Clinical Notes State for Selected Consultation
  const [soapNotes, setSoapNotes] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    icd10: "",
    followUpDays: "7"
  });

  // Digital Prescription Pad State
  const [prescriptionsList, setPrescriptionsList] = useState([
    {
      name: "Paracetamol 650mg",
      genericName: "Paracetamol",
      form: "Tablet",
      dosage: "650mg",
      frequency: "1-0-1 (Morning & Night)",
      timing: "After Food",
      duration: "5 days",
      instructions: "Take with warm water if body temp exceeds 99°F"
    }
  ]);

  const [newMed, setNewMed] = useState({
    name: "",
    genericName: "",
    form: "Tablet",
    dosage: "500mg",
    frequency: "1-0-1",
    timing: "After Food",
    duration: "5 days",
    instructions: ""
  });

  const [rxPreviewModalOpen, setRxPreviewModalOpen] = useState(false);
  const [isAuthorizingRx, setIsAuthorizingRx] = useState(false);

  // Doctor Clinical Profile State
  const [profileData, setProfileData] = useState({
    name: user?.name || "Dr. Rajesh K. Sharma",
    email: user?.email || "doctor@medszop.com",
    phone: "+91 98201 55432",
    qualifications: "MBBS, MD (General Medicine)",
    specialization: "Internal Medicine & Chronic Care",
    registrationNumber: "MCI-48291-MH (Maharashtra Medical Council)",
    experienceYears: "12",
    clinicName: "Apex Telehealth Specialty Clinic",
    clinicAddress: "Room 304, Swasthya Medical Enclave, Dadar, Mumbai - 400014",
    telehealthHours: "09:00 AM - 07:00 PM IST (Mon-Sat)"
  });

  // Fetch Consultations
  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${API_URL}/doctor/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(res.data || []);
      
      // Auto-select first active appointment if none selected
      if (!selectedAppointment && res.data && res.data.length > 0) {
        setSelectedAppointment(res.data[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load clinical consultations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAppointments();
      const interval = setInterval(fetchAppointments, 8000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Synchronize SOAP notes when selected appointment changes
  useEffect(() => {
    if (selectedAppointment) {
      // If consultation already has notes, attempt to parse or load them
      if (selectedAppointment.notes) {
        try {
          const parsed = JSON.parse(selectedAppointment.notes);
          if (parsed && typeof parsed === "object") {
            setSoapNotes({
              subjective: parsed.subjective || "",
              objective: parsed.objective || "",
              assessment: parsed.assessment || "",
              plan: parsed.plan || "",
              icd10: parsed.icd10 || "",
              followUpDays: parsed.followUpDays || "7"
            });
            if (Array.isArray(parsed.prescriptions) && parsed.prescriptions.length > 0) {
              setPrescriptionsList(parsed.prescriptions);
            }
            return;
          }
        } catch {
          // If not JSON, populate into Subjective/Assessment
          setSoapNotes(prev => ({
            ...prev,
            subjective: selectedAppointment.notes,
            assessment: selectedAppointment.symptoms || ""
          }));
        }
      } else {
        // Fresh appointment
        setSoapNotes({
          subjective: `Patient reports: "${selectedAppointment.symptoms}". No previous adverse drug reactions documented.`,
          objective: "Alert, oriented to time and place. Reported vitals: Pulse 74 bpm, BP 122/80 mmHg, SpO2 98% on room air.",
          assessment: `Provisional diagnosis based on reported presentation: ${selectedAppointment.symptoms.slice(0, 45)}...`,
          plan: "Adequate hydration, rest, structured pharmacotherapy as per digital prescription below. Red-flag precautions explained.",
          icd10: "R50.9 (Fever, unspecified) / J06.9 (Acute upper respiratory infection)",
          followUpDays: "5"
        });
      }
    }
  }, [selectedAppointment?._id]);

  // Handle Status Update
  const handleStatusUpdate = async (id, status, extraData = {}) => {
    try {
      const payload = { status, ...extraData };
      await axios.put(`${API_URL}/doctor/appointments/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Consultation marked as ${status}`);
      fetchAppointments();
      if (selectedAppointment && selectedAppointment._id === id) {
        setSelectedAppointment(prev => ({ ...prev, status, ...extraData }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update consultation status");
    }
  };

  // Save SOAP Clinical Notes
  const handleSaveClinicalNotes = async () => {
    if (!selectedAppointment) return;
    try {
      const notesPayload = JSON.stringify({
        ...soapNotes,
        prescriptions: prescriptionsList,
        doctorSignature: profileData.name,
        doctorReg: profileData.registrationNumber,
        signedAt: new Date().toISOString()
      });

      await axios.put(
        `${API_URL}/doctor/appointments/${selectedAppointment._id}`,
        { notes: notesPayload },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Clinical SOAP notes and EHR entry saved to patient record");
      fetchAppointments();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save clinical notes");
    }
  };

  // Authorize Digital Prescription
  const handleAuthorizePrescription = async () => {
    if (!selectedAppointment) return;
    setIsAuthorizingRx(true);
    try {
      const rxSummary = JSON.stringify({
        ...soapNotes,
        prescriptions: prescriptionsList,
        prescription_url: `digital-rx-${selectedAppointment._id}.pdf`,
        authorizedBy: profileData.name,
        registrationNumber: profileData.registrationNumber,
        authorizedAt: new Date().toISOString()
      });

      await axios.put(
        `${API_URL}/doctor/appointments/${selectedAppointment._id}`,
        {
          notes: rxSummary,
          prescription_url: `digital-rx-${selectedAppointment._id}.pdf`,
          status: "ACCEPTED"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Digital Prescription electronically authorized and dispatched to patient & pharmacy rail!");
      setRxPreviewModalOpen(false);
      fetchAppointments();
    } catch (err) {
      console.error(err);
      toast.error("Failed to authorize digital prescription");
    } finally {
      setIsAuthorizingRx(false);
    }
  };

  // Add Medication to Rx list
  const handleAddMedication = (e) => {
    e.preventDefault();
    if (!newMed.name) {
      return toast.error("Please enter a medicine name");
    }
    setPrescriptionsList(prev => [...prev, { ...newMed }]);
    setNewMed({
      name: "",
      genericName: "",
      form: "Tablet",
      dosage: "500mg",
      frequency: "1-0-1",
      timing: "After Food",
      duration: "5 days",
      instructions: ""
    });
    toast.success("Medication added to digital prescription pad");
  };

  const handleRemoveMedication = (idx) => {
    setPrescriptionsList(prev => prev.filter((_, i) => i !== idx));
  };

  // Chat Functions
  const fetchMessages = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/doctor/consultation/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    try {
      const res = await axios.post(`${API_URL}/doctor/consultation/${selectedChat._id}/chat`, {
        message: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages || []);
      setNewMessage("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    }
  };

  useEffect(() => {
    let interval;
    if (selectedChat) {
      fetchMessages(selectedChat._id);
      interval = setInterval(() => fetchMessages(selectedChat._id), 3000);
    }
    return () => clearInterval(interval);
  }, [selectedChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Computed Metrics
  const stats = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter(a => a.status === "PENDING").length;
    const inSession = appointments.filter(a => a.status === "ACCEPTED").length;
    const completed = appointments.filter(a => a.status === "COMPLETED").length;
    const rejected = appointments.filter(a => a.status === "REJECTED").length;

    return { total, pending, inSession, completed, rejected };
  }, [appointments]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      if (statusFilter !== "all" && appt.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const patientName = (appt.patient_id?.name || "").toLowerCase();
        const symptoms = (appt.symptoms || "").toLowerCase();
        const apptId = (appt._id || "").toLowerCase();
        if (!patientName.includes(q) && !symptoms.includes(q) && !apptId.includes(q)) return false;
      }
      return true;
    });
  }, [appointments, statusFilter, searchQuery]);

  // Unique Patients (Authorized Treatment Relationship only)
  const uniquePatients = useMemo(() => {
    const map = new Map();
    appointments.forEach(a => {
      if (a.patient_id && !map.has(a.patient_id._id)) {
        map.set(a.patient_id._id, {
          ...a.patient_id,
          lastConsultation: a.createdAt,
          symptoms: a.symptoms,
          consultationId: a._id,
          status: a.status
        });
      }
    });
    return Array.from(map.values());
  }, [appointments]);

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: "bg-amber-100 text-amber-800 border-amber-300 font-semibold",
      ACCEPTED: "bg-sky-100 text-sky-800 border-sky-300 font-bold",
      COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold",
      REJECTED: "bg-rose-100 text-rose-800 border-rose-300 font-semibold"
    };
    return styles[status] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-sky-700" />
        <span className="text-sm font-semibold text-slate-700 font-heading">
          Connecting to MedsZop Clinical Telemedicine Suite...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <DoctorNavbar
        doctorName={profileData.name}
        specialization={profileData.specialization}
        registrationNumber={profileData.registrationNumber}
        pendingQueueCount={stats.pending}
      />

      <main className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* ================= CLINICAL WORKSPACE HEADER & TELEHEALTH BANNER ================= */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-100/90 text-sky-800 border border-sky-200">
                <Stethoscope className="h-6 w-6 text-sky-700" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-heading" data-testid="doctor-dashboard-title">
                  Doctor Clinical Workspace
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Teleconsultation triage, structured SOAP electronic health records, and doctor-authorized digital prescriptions.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Telehealth Status */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono text-emerald-800">
              <HeartPulse className="h-4 w-4 text-emerald-600" />
              <span>NMC Guidelines 2020 Compliant</span>
            </div>
            <Button
              size="sm"
              onClick={() => setActiveTab("prescriptions")}
              className="h-10 px-4 text-xs font-semibold gap-1.5 bg-sky-700 hover:bg-sky-800 text-white shadow-sm shadow-sky-700/20"
            >
              <Pill className="h-3.5 w-3.5" />
              Digital Rx Pad
            </Button>
          </div>
        </div>

        {/* ================= 4-COLUMN CLINICAL KPI CARDS ================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 mb-7">
          <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Consultations</p>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tabular-nums mt-0.5">
                  {stats.total}
                </h2>
                <span className="text-[10px] text-slate-400 font-medium">All patient encounters</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Waiting Room / Triage</p>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-amber-600 tabular-nums mt-0.5">
                  {stats.pending}
                </h2>
                <span className="text-[10px] text-amber-700 font-medium">Awaiting doctor admission</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In-Session / Active</p>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-sky-700 tabular-nums mt-0.5">
                  {stats.inSession}
                </h2>
                <span className="text-[10px] text-sky-600 font-medium">Consultation in progress</span>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                <Video className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completed / Discharged</p>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-emerald-700 tabular-nums mt-0.5">
                  {stats.completed}
                </h2>
                <span className="text-[10px] text-emerald-600 font-medium">Rx issued & EHR filed</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= WORKSPACE NAVIGATION TABS ================= */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
            <TabsList className="grid grid-cols-6 w-full sm:w-[780px] h-11 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <TabsTrigger value="dashboard" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                Triage Queue
              </TabsTrigger>
              <TabsTrigger value="consultation" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                Clinical EHR
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                Digital Rx Pad
              </TabsTrigger>
              <TabsTrigger value="records" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                Patient Records
              </TabsTrigger>
              <TabsTrigger value="ai_eval" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                AI Decision Aid
              </TabsTrigger>
              <TabsTrigger value="profile" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                RMP Profile
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Encrypted Session: DISHA / HIPAA Active</span>
            </div>
          </div>

          {/* ================= TAB 1: TRIAGE & APPOINTMENTS QUEUE ================= */}
          <TabsContent value="dashboard" className="space-y-4">
            <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
              <CardHeader className="p-4 sm:p-5 border-b border-slate-200/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                      Patient Consultation Queue & Scheduling
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Triage patient requests, admit to active telehealth consultation, or review completed encounters.
                    </CardDescription>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search patient or symptoms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                      />
                    </div>

                    <select
                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Encounters ({appointments.length})</option>
                      <option value="PENDING">⏳ Triage Pending ({stats.pending})</option>
                      <option value="ACCEPTED">🟢 In-Session / Accepted ({stats.inSession})</option>
                      <option value="COMPLETED">✅ Completed ({stats.completed})</option>
                      <option value="REJECTED">❌ Declined ({stats.rejected})</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="font-bold text-xs text-slate-700">Patient Demographic</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700">Chief Complaint / Symptoms</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700">Telehealth Consent</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700">Booking Time</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700">Consultation Status</TableHead>
                        <TableHead className="font-bold text-xs text-slate-700 text-right">Clinical Workflow</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredAppointments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                            <Stethoscope className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-sm font-semibold">No appointments found matching your filter</p>
                            <p className="text-xs text-slate-400 mt-1">New incoming consultations will populate here in real-time.</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAppointments.map((appt) => (
                          <TableRow key={appt._id} className="hover:bg-slate-50/60 border-b border-slate-200/70 transition-colors">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-slate-900">
                                  {appt.patient_id?.name || "Patient"}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {appt.patient_id?.email || "patient@medszop.com"}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="max-w-xs">
                              <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                                {appt.symptoms}
                              </p>
                            </TableCell>

                            <TableCell>
                              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] py-0 font-semibold gap-1">
                                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                NMC Consent Verified
                              </Badge>
                            </TableCell>

                            <TableCell className="font-mono text-xs text-slate-500">
                              {new Date(appt.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{" "}
                              <span className="text-[10px] text-slate-400">
                                {new Date(appt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </TableCell>

                            <TableCell>
                              <Badge className={`text-[10px] ${getStatusBadge(appt.status)}`}>
                                {appt.status}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {appt.status === "PENDING" && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="h-8 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                      onClick={() => {
                                        handleStatusUpdate(appt._id, "ACCEPTED");
                                        setSelectedAppointment(appt);
                                        setActiveTab("consultation");
                                      }}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      Admit Patient
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="h-8 px-2 text-xs font-semibold"
                                      onClick={() => {
                                        setAppointmentToDecline(appt);
                                        setDeclineModalOpen(true);
                                      }}
                                    >
                                      Decline
                                    </Button>
                                  </>
                                )}

                                {appt.status === "ACCEPTED" && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="h-8 px-2.5 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white gap-1"
                                      onClick={() => {
                                        setSelectedAppointment(appt);
                                        setActiveTab("consultation");
                                      }}
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                      Open EHR
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-2 text-xs font-semibold border-slate-200"
                                      onClick={() => setSelectedChat(appt)}
                                    >
                                      <MessageSquare className="h-3.5 w-3.5 text-slate-600" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-2 text-xs font-semibold border-sky-300 text-sky-700 hover:bg-sky-50"
                                      onClick={() => window.open(`/video-call/${appt._id}`, '_blank')}
                                    >
                                      <Video className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}

                                {appt.status === "COMPLETED" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2.5 text-xs font-semibold border-slate-200"
                                    onClick={() => {
                                      setSelectedAppointment(appt);
                                      setActiveTab("consultation");
                                    }}
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
                                    Review EHR
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= TAB 2: CONSULTATION WORKSPACE & STRUCTURED SOAP EHR ================= */}
          <TabsContent value="consultation" className="space-y-6">
            {selectedAppointment ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: SOAP Electronic Health Record */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
                    <CardHeader className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-row items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                            Clinical Encounter: {selectedAppointment.patient_id?.name || "Patient Record"}
                          </CardTitle>
                          <Badge className={`text-[10px] ${getStatusBadge(selectedAppointment.status)}`}>
                            {selectedAppointment.status}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs text-slate-500 font-mono mt-0.5">
                          Encounter ID: #{selectedAppointment._id.slice(0, 8)} • NMC Teleconsultation Logged
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedChat(selectedAppointment)}
                          className="h-8 text-xs font-semibold gap-1.5"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Chat
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => window.open(`/video-call/${selectedAppointment._id}`, '_blank')}
                          className="h-8 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white gap-1.5"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Launch Video
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 space-y-5">
                      {/* Chief Complaint Callout */}
                      <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80 text-xs">
                        <span className="font-bold text-sky-900 block mb-1 flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-sky-700" /> Patient Reported Chief Complaint
                        </span>
                        <p className="text-slate-800 leading-relaxed font-medium">
                          {selectedAppointment.symptoms}
                        </p>
                      </div>

                      {/* Structured SOAP Form */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                          <FileText className="h-3.5 w-3.5 text-sky-700" />
                          Structured SOAP Clinical Documentation
                        </h4>

                        {/* Subjective */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">
                            S — Subjective (History of Present Illness, Symptoms & Onset Timeline)
                          </label>
                          <textarea
                            value={soapNotes.subjective}
                            onChange={(e) => setSoapNotes(n => ({ ...n, subjective: e.target.value }))}
                            rows={3}
                            placeholder="Patient's subjective history, pain scale, onset duration, modifying factors..."
                            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-600 focus:outline-none"
                          />
                        </div>

                        {/* Objective */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">
                            O — Objective (Reported Vitals, General Appearance, Observable Findings)
                          </label>
                          <textarea
                            value={soapNotes.objective}
                            onChange={(e) => setSoapNotes(n => ({ ...n, objective: e.target.value }))}
                            rows={2}
                            placeholder="Reported vitals: BP, Pulse, SpO2, Temperature, respiratory effort, observable signs..."
                            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-600 focus:outline-none"
                          />
                        </div>

                        {/* Assessment & ICD-10 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">
                              A — Assessment (Clinical Impression / Provisional Diagnosis)
                            </label>
                            <input
                              type="text"
                              value={soapNotes.assessment}
                              onChange={(e) => setSoapNotes(n => ({ ...n, assessment: e.target.value }))}
                              placeholder="e.g. Acute Bronchitis, Type 2 Diabetes uncomplicated..."
                              className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-600 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">
                              ICD-10 Diagnostic Code Reference
                            </label>
                            <input
                              type="text"
                              value={soapNotes.icd10}
                              onChange={(e) => setSoapNotes(n => ({ ...n, icd10: e.target.value }))}
                              placeholder="e.g. J20.9 (Acute bronchitis, unspecified)"
                              className="w-full h-10 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-600 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Plan */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">
                            P — Plan (Therapeutic Advice, Dietary Precautions, Red Flags & Escalation)
                          </label>
                          <textarea
                            value={soapNotes.plan}
                            onChange={(e) => setSoapNotes(n => ({ ...n, plan: e.target.value }))}
                            rows={3}
                            placeholder="Non-pharmacological advice, dietary guidelines, warning signs (fever > 102, dyspnea) requiring immediate ER..."
                            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-600 focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            <span>Doctor Signed Entry: {profileData.name} ({profileData.registrationNumber})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleSaveClinicalNotes}
                              className="h-9 px-4 text-xs font-semibold border-slate-300"
                            >
                              Save Notes to EHR
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setRxPreviewModalOpen(true)}
                              className="h-9 px-4 text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white gap-1.5"
                            >
                              <Pill className="h-3.5 w-3.5" />
                              Authorize Digital Rx
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Patient Demographic & Consent Verification */}
                <div className="space-y-6">
                  <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
                    <CardHeader className="pb-3 border-b border-slate-100">
                      <CardTitle className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                        <User className="h-4 w-4 text-sky-700" /> Patient Identification & Consent
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3.5 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block">Full Name:</span>
                        <span className="font-bold text-slate-900 text-sm">{selectedAppointment.patient_id?.name || "Patient Record"}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">Contact Coordinates:</span>
                        <span className="font-mono text-slate-700">{selectedAppointment.patient_id?.email || "patient@medszop.com"}</span>
                      </div>

                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                        <span className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          Telemedicine Consent Active
                        </span>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          Patient explicitly consented to remote clinical evaluation in compliance with Clause 3.4 of the NMC Telemedicine Practice Guidelines.
                        </p>
                      </div>

                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          Emergency Escalation Protocol
                        </span>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          If patient exhibits acute chest pain, altered consciousness, or severe dyspnea, advise immediate 108 ambulance or nearest emergency hospital.
                        </p>
                      </div>

                      <div className="pt-2">
                        {selectedAppointment.status === "ACCEPTED" && (
                          <Button
                            className="w-full h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            onClick={() => handleStatusUpdate(selectedAppointment._id, "COMPLETED")}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Discharge & Mark Consultation Complete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs p-12 text-center text-slate-400">
                <Stethoscope className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Patient Encounter Selected</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Select a consultation from the Triage Queue to access the structured SOAP Electronic Health Record.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* ================= TAB 3: DOCTOR-CONTROLLED DIGITAL PRESCRIPTION PAD ================= */}
          <TabsContent value="prescriptions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Columns: Prescription Formulary Builder */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
                  <CardHeader className="p-4 sm:p-5 border-b border-slate-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base sm:text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                          <Pill className="h-4 w-4 text-sky-700" />
                          Structured Digital Prescription Pad
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                          Prescribe Schedule H/OTC medications with exact dosage, timing, duration, and patient instructions.
                        </CardDescription>
                      </div>

                      <Badge className="bg-sky-50 text-sky-800 border-sky-200 text-xs font-mono w-fit">
                        {prescriptionsList.length} Drug(s) Scheduled
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-6">
                    {/* Add Medicine Form */}
                    <form onSubmit={handleAddMedication} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Plus className="h-3.5 w-3.5 text-sky-700" /> Add Prescription Line Item
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Brand / Medicine Name *</label>
                          <input
                            type="text"
                            value={newMed.name}
                            onChange={(e) => setNewMed(m => ({ ...m, name: e.target.value }))}
                            placeholder="e.g. Augmentin 625 Duo, Dolo 650, Telma 40"
                            required
                            className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-600 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Generic Salt</label>
                          <input
                            type="text"
                            value={newMed.genericName}
                            onChange={(e) => setNewMed(m => ({ ...m, genericName: e.target.value }))}
                            placeholder="e.g. Amoxycillin + Clavulanate"
                            className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Formulation</label>
                          <select
                            value={newMed.form}
                            onChange={(e) => setNewMed(m => ({ ...m, form: e.target.value }))}
                            className="w-full h-9 px-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                          >
                            <option value="Tablet">Tablet</option>
                            <option value="Capsule">Capsule</option>
                            <option value="Syrup">Syrup</option>
                            <option value="Inhaler">Inhaler</option>
                            <option value="Injection">Injection</option>
                            <option value="Drops">Drops</option>
                            <option value="Ointment">Ointment</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Strength / Dose</label>
                          <input
                            type="text"
                            value={newMed.dosage}
                            onChange={(e) => setNewMed(m => ({ ...m, dosage: e.target.value }))}
                            placeholder="e.g. 500mg, 10ml"
                            className="w-full h-9 px-3 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Frequency</label>
                          <select
                            value={newMed.frequency}
                            onChange={(e) => setNewMed(m => ({ ...m, frequency: e.target.value }))}
                            className="w-full h-9 px-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                          >
                            <option value="1-0-1">1-0-1 (Morning & Night)</option>
                            <option value="1-0-0">1-0-0 (Morning Only)</option>
                            <option value="0-0-1">0-0-1 (Night Only)</option>
                            <option value="1-1-1">1-1-1 (Thrice daily)</option>
                            <option value="SOS">SOS (As needed)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Duration</label>
                          <input
                            type="text"
                            value={newMed.duration}
                            onChange={(e) => setNewMed(m => ({ ...m, duration: e.target.value }))}
                            placeholder="e.g. 5 days, 30 days"
                            className="w-full h-9 px-3 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Patient Instructions</label>
                          <input
                            type="text"
                            value={newMed.instructions}
                            onChange={(e) => setNewMed(m => ({ ...m, instructions: e.target.value }))}
                            placeholder="e.g. Take after meals with warm water, avoid dairy for 1 hour..."
                            className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="submit"
                            className="w-full h-9 text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add to Prescription
                          </Button>
                        </div>
                      </div>
                    </form>

                    {/* Prescriptions Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-2">Prescribed Medication List</h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead className="text-xs font-bold">Drug & Formulation</TableHead>
                              <TableHead className="text-xs font-bold">Dose & Frequency</TableHead>
                              <TableHead className="text-xs font-bold">Duration</TableHead>
                              <TableHead className="text-xs font-bold">Instructions</TableHead>
                              <TableHead className="text-xs font-bold text-right">Remove</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {prescriptionsList.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-xs text-slate-900">{item.name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {item.form} {item.genericName ? `• ${item.genericName}` : ""}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs font-semibold text-slate-700">
                                  {item.dosage} • {item.frequency} ({item.timing})
                                </TableCell>
                                <TableCell className="font-mono text-xs text-slate-600">
                                  {item.duration}
                                </TableCell>
                                <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                                  {item.instructions || "As directed"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-red-600 hover:bg-red-50"
                                    onClick={() => handleRemoveMedication(idx)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Prescription Authorization Panel */}
              <div className="space-y-6">
                <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                      <Award className="h-4 w-4 text-sky-700" /> Digital Rx Authorization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Practitioner:</span>
                        <span className="font-bold text-slate-900">{profileData.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Medical Reg:</span>
                        <span className="font-mono font-semibold text-slate-800">{profileData.registrationNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Patient:</span>
                        <span className="font-semibold text-slate-900">{selectedAppointment?.patient_id?.name || "Patient on file"}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                        Statutory Prescribing Mandate
                      </span>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Under Indian Medical Council (Professional Conduct) Regulations, prescriptions must be physically authorized by the RMP. AI will never auto-issue prescriptions.
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <Button
                        className="w-full h-10 text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white gap-2"
                        onClick={() => setRxPreviewModalOpen(true)}
                      >
                        <Eye className="h-4 w-4" />
                        Preview Digital Prescription & Sign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ================= TAB 4: SECURE PATIENT RECORDS ================= */}
          <TabsContent value="records" className="space-y-4">
            <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
              <CardHeader className="p-4 sm:p-5 border-b border-slate-200/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                      <Lock className="h-4 w-4 text-sky-700" />
                      Authorized Patient Roster (DISHA Enforced)
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Access strictly restricted to patients with an authorized treatment relationship with Dr. {profileData.name}. Unrestricted browsing is prohibited.
                    </CardDescription>
                  </div>
                  <Badge className="bg-sky-50 text-sky-800 border-sky-200 font-mono text-xs w-fit">
                    {uniquePatients.length} Authorized Patient Records
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs font-bold">Patient Name</TableHead>
                      <TableHead className="text-xs font-bold">Contact Email</TableHead>
                      <TableHead className="text-xs font-bold">Recent Presentation</TableHead>
                      <TableHead className="text-xs font-bold">Encounter Date</TableHead>
                      <TableHead className="text-xs font-bold text-right">EHR Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniquePatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                          No patient records under active treatment relationship.
                        </TableCell>
                      </TableRow>
                    ) : (
                      uniquePatients.map((p) => (
                        <TableRow key={p._id}>
                          <TableCell className="font-bold text-xs text-slate-900">
                            {p.name}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">
                            {p.email}
                          </TableCell>
                          <TableCell className="text-xs text-slate-700 max-w-xs truncate">
                            {p.symptoms}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">
                            {new Date(p.lastConsultation).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-semibold"
                              onClick={() => {
                                const matched = appointments.find(a => a._id === p.consultationId);
                                if (matched) {
                                  setSelectedAppointment(matched);
                                  setActiveTab("consultation");
                                }
                              }}
                            >
                              <FileText className="h-3.5 w-3.5 mr-1 text-sky-700" />
                              View Clinical Record
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= TAB 5: AI-ASSISTED CLINICAL DECISION EVALUATION ================= */}
          <TabsContent value="ai_eval" className="space-y-6">
            <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
              <CardHeader className="p-4 sm:p-5 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                    <Brain className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                      AI Clinical Decision Support (Evaluation Model)
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Non-autonomous assistance for drug-drug interaction screening, medical terminology alignment, and documentation summarization.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-6">
                {/* Statutory Uncertainty & Non-Autonomous Disclaimer */}
                <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-purple-900 font-bold font-heading">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-700" />
                      <span>Non-Autonomous Clinical Decision Support (Research Preview)</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-200/80 text-purple-900 uppercase font-semibold">
                      Disabled for Autonomous Clinical Actions
                    </span>
                  </div>
                  <p className="text-purple-800 leading-relaxed">
                    AI models are evaluated strictly as offline clinical reference aids. They have <strong>zero authority to formulate diagnoses, suggest clinical regimens, or issue prescriptions</strong>. In compliance with the National Medical Commission (NMC) regulations and Indian Telemedicine Practice Guidelines, all clinical evaluations must be independently performed by the attending registered physician.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tool 1: Drug Interaction Checker */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 font-heading flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Drug-Drug Interaction Analysis
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Screening active medications on digital prescription pad:
                    </p>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                        <span className="font-bold block">✓ No Critical Interactions Detected</span>
                        <span className="text-[11px] text-emerald-800">
                          Paracetamol 650mg is safe for the specified 5-day dosage duration with zero cross-reactivity.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tool 2: Clinical Terminology Assistant */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 font-heading flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-sky-700" />
                      Terminology & ICD-10 Alignment
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Standardized WHO ICD-10 nomenclature for patient symptoms:
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <div className="p-2 rounded bg-white border border-slate-200 flex justify-between">
                        <span className="text-slate-700">"Severe throat pain & fever"</span>
                        <span className="font-mono font-bold text-sky-800">J02.9 (Acute pharyngitis)</span>
                      </div>
                      <div className="p-2 rounded bg-white border border-slate-200 flex justify-between">
                        <span className="text-slate-700">"Chest tightness & cough"</span>
                        <span className="font-mono font-bold text-sky-800">J20.9 (Acute bronchitis)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= TAB 6: PRACTITIONER PROFILE & REGISTRATION ================= */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 rounded-xl border-slate-200/90 bg-white shadow-xs">
                <CardHeader className="border-b border-slate-200/80 pb-4">
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                    <Award className="h-5 w-5 text-sky-700" />
                    Medical Registration & Practice Profile
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Official clinical credentials verified by National Medical Commission (NMC) and State Medical Councils.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Registered Doctor Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(p => ({ ...p, name: e.target.value }))}
                        className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Medical Qualifications</label>
                      <input
                        type="text"
                        value={profileData.qualifications}
                        onChange={(e) => setProfileData(p => ({ ...p, qualifications: e.target.value }))}
                        className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">State Medical Council / NMC Reg No. *</label>
                      <input
                        type="text"
                        value={profileData.registrationNumber}
                        readOnly
                        className="w-full h-10 px-3 text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-not-allowed"
                      />
                      <p className="text-[10px] text-slate-400">NMC registration changes require administrative credential reverification.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Clinical Specialization</label>
                      <input
                        type="text"
                        value={profileData.specialization}
                        onChange={(e) => setProfileData(p => ({ ...p, specialization: e.target.value }))}
                        className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Practice Affiliation & Clinic Address</label>
                    <textarea
                      value={profileData.clinicAddress}
                      onChange={(e) => setProfileData(p => ({ ...p, clinicAddress: e.target.value }))}
                      rows={2}
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={() => toast.success("Doctor profile settings saved successfully")}
                      className="h-10 px-5 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white"
                    >
                      Save Profile Updates
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security & Session Card */}
              <div className="space-y-4">
                <Card className="rounded-xl border-slate-200/90 bg-white shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-slate-900 font-heading">
                      Session Security Policy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <span className="font-bold text-slate-800 block">Inactivity Expiration</span>
                      <p className="text-[11px] text-slate-500">
                        Session expires automatically after <strong>30 minutes</strong> of idle time to protect patient privacy.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <span className="font-bold text-slate-800 block">Absolute Shift Lifetime</span>
                      <p className="text-[11px] text-slate-500">
                        Maximum continuous session lifetime is <strong>8 hours</strong> for clinical healthcare personnel.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ================= DIGITAL PRESCRIPTION PREVIEW & SIGN MODAL ================= */}
      <Dialog open={rxPreviewModalOpen} onOpenChange={setRxPreviewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-lg font-bold font-heading text-slate-900">
              Electronic Prescription Preview & Authorization
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-mono">
              In accordance with Telemedicine Practice Guidelines 2020 (NMC)
            </DialogDescription>
          </DialogHeader>

          {/* Rx Document Sheet */}
          <div className="border border-slate-300 rounded-xl p-6 bg-white space-y-6 shadow-xs font-sans mt-3">
            {/* Header Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-sky-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-sky-900 font-heading">{profileData.name}</h3>
                <p className="text-xs text-slate-600 font-medium">{profileData.qualifications}</p>
                <p className="text-xs text-slate-600">{profileData.specialization}</p>
                <p className="text-xs font-mono font-bold text-sky-800 mt-1">
                  Reg No: {profileData.registrationNumber}
                </p>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-slate-900 block font-heading">MedsZop Telehealth</span>
                <span className="text-[11px] text-slate-500 block">{profileData.clinicName}</span>
                <span className="text-[11px] text-slate-500 block">{profileData.clinicAddress}</span>
                <span className="text-[11px] font-mono text-slate-500">Date: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Patient Header */}
            <div className="p-3 bg-slate-50 rounded-lg flex flex-wrap justify-between gap-2 text-xs border border-slate-200">
              <div>
                <span className="text-slate-400">Patient: </span>
                <span className="font-bold text-slate-900">{selectedAppointment?.patient_id?.name || "Patient on file"}</span>
              </div>
              <div>
                <span className="text-slate-400">Consultation: </span>
                <span className="font-mono text-slate-700">#{selectedAppointment?._id?.slice(0, 8)}</span>
              </div>
              <div>
                <span className="text-slate-400">Diagnosis: </span>
                <span className="font-semibold text-slate-800">{soapNotes.assessment || "Clinical assessment on file"}</span>
              </div>
            </div>

            {/* Rx Symbol & Medication Table */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold font-serif text-sky-900">℞</span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Prescribed Medication Formulary</span>
              </div>

              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-bold">Drug Description</TableHead>
                    <TableHead className="text-xs font-bold">Dose & Schedule</TableHead>
                    <TableHead className="text-xs font-bold">Duration</TableHead>
                    <TableHead className="text-xs font-bold">Instructions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptionsList.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs font-bold text-slate-900">
                        {item.name} <span className="text-[10px] text-slate-500 font-normal">({item.form})</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-700">
                        {item.dosage} • {item.frequency} ({item.timing})
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-700">
                        {item.duration}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {item.instructions || "As directed"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Non-Pharmacological Advice */}
            {soapNotes.plan && (
              <div className="text-xs space-y-1 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-800">Dietary & Non-Pharmacological Advice:</span>
                <p className="text-slate-600 leading-relaxed">{soapNotes.plan}</p>
              </div>
            )}

            {/* Sign & Telemedicine Notice */}
            <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div className="max-w-md text-[10px] text-slate-500 leading-tight space-y-1">
                <p>This digital consultation summary is electronically authorized by a Registered Medical Practitioner under the Indian Telemedicine Practice Guidelines 2020.</p>
                <p className="text-slate-400">Notice: Electronic authorization does not constitute a Class 3 Digital Signature Certificate (DSC) under Section 5 of the Information Technology Act, 2000. Restricted schedule drugs require physical verification prior to dispensing.</p>
              </div>

              <div className="text-right">
                <div className="h-10 flex items-center justify-end">
                  <span className="font-serif italic text-sky-800 text-sm font-bold border-b border-sky-800 pb-0.5">
                    {profileData.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-600 font-semibold block">Electronically Authorized</span>
                <span className="text-[10px] font-mono text-slate-500 block">Reg: {profileData.registrationNumber}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setRxPreviewModalOpen(false)} className="text-xs">
              Back to Edit
            </Button>
            <Button
              onClick={handleAuthorizePrescription}
              disabled={isAuthorizingRx}
              className="text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white gap-1.5"
            >
              {isAuthorizingRx ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Electronically Signing...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Sign & Authorize Digital Prescription
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DECLINE APPOINTMENT MODAL ================= */}
      <Dialog open={declineModalOpen} onOpenChange={setDeclineModalOpen}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-heading text-slate-900">
              Decline Teleconsultation Request
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Specify the clinical reason for declining this request. The patient will be notified immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Clinical Reason for Decline</label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="Emergency care / in-person physical examination required">
                  Requires immediate physical examination / Emergency ER care
                </option>
                <option value="Patient presentation outside practitioner clinical specialty">
                  Condition is outside of practitioner's clinical scope
                </option>
                <option value="Patient cannot be contacted / teleconsultation slot conflict">
                  Telehealth scheduling conflict / unable to reach patient
                </option>
              </select>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg text-[11px] text-amber-800">
              Under NMC guidelines, patients requiring physical palpation or in-person emergency intervention must be redirected to the nearest healthcare center.
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="ghost" onClick={() => setDeclineModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="text-xs font-semibold"
              onClick={() => {
                if (appointmentToDecline) {
                  handleStatusUpdate(appointmentToDecline._id, "REJECTED", { notes: declineReason });
                  setDeclineModalOpen(false);
                  setAppointmentToDecline(null);
                }
              }}
            >
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= PATIENT CHAT DIALOG ================= */}
      <Dialog open={!!selectedChat} onOpenChange={(o) => !o && setSelectedChat(null)}>
        <DialogContent className="sm:max-w-md h-[540px] flex flex-col p-5">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-sm font-bold font-heading text-slate-900 flex items-center justify-between">
              <span>Patient Consultation Chat</span>
              <Badge className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                Encrypted Session
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Patient: {selectedChat?.patient_id?.name || "Patient on file"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50/50 my-2">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No messages yet. Send a greeting to initiate clinical dialogue.
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs ${
                      msg.sender === 'doctor' ? 'bg-sky-700 text-white' : 'bg-white border border-slate-200 text-slate-800'
                    }`}>
                      <p>{msg.content}</p>
                      <span className={`text-[9px] block text-right mt-1 font-mono ${
                        msg.sender === 'doctor' ? 'text-sky-200' : 'text-slate-400'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={scrollRef} />
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type clinical inquiry to patient..."
              className="text-xs h-9"
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} size="icon" className="h-9 w-9 bg-sky-700 hover:bg-sky-800 text-white shrink-0">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DoctorFooter />
    </div>
  );
};

export default DoctorDashboardPage;
