import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Search,
  ArrowRight,
  ShieldCheck,
  Copy,
  ExternalLink,
  RotateCcw,
  Loader2,
  Building2,
  Stethoscope,
  Truck,
  Mail,
  AlertCircle
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ApplicationStatusPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(id || "");
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);

  const fetchStatus = async (appId) => {
    if (!appId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/onboarding/status/${appId}`);
      setApplication({ ...res.data, _id: appId });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Application not found. Please verify your tracking ID.");
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setSearchId(id);
      fetchStatus(id);
    }
  }, [id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/application-status/${searchId.trim()}`);
    }
  };

  const copyTrackingId = () => {
    if (application?._id) {
      navigator.clipboard.writeText(application._id);
      toast.success("Tracking ID copied to clipboard");
    }
  };

  const getRoleIcon = (role) => {
    if (role?.toLowerCase().includes("doctor")) return Stethoscope;
    if (role?.toLowerCase().includes("pharm")) return Building2;
    return Truck;
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase();
    if (s === "APPROVED") {
      return <Badge variant="success" className="text-xs px-3 py-1 font-bold gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> APPROVED</Badge>;
    }
    if (s === "REJECTED") {
      return <Badge variant="destructive" className="text-xs px-3 py-1 font-bold gap-1"><XCircle className="h-3.5 w-3.5" /> REJECTED</Badge>;
    }
    return <Badge variant="secondary" className="text-xs px-3 py-1 font-bold bg-amber-100 text-amber-900 border-amber-300 gap-1"><Clock className="h-3.5 w-3.5" /> UNDER AUDIT</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full space-y-8">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-xs font-semibold px-3 py-0.5 border-emerald-600 text-emerald-800 bg-emerald-50">
            DOSSIER TRACKING
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-heading">
            Partner Application Status
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Check the credential audit progress of your MedsZop onboarding application.
          </p>

          <form onSubmit={handleSearchSubmit} className="max-w-lg mx-auto flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Enter Application ID (e.g. 65b9e0000000000000005001)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="pl-10 h-11 text-sm font-mono border-slate-300 bg-white"
                required
              />
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 text-xs shrink-0">
              <span>Lookup</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>
        </div>

        {loading && (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Retrieving application record...</p>
          </div>
        )}

        {error && !loading && (
          <Card className="border-red-200 bg-red-50/50 p-6 text-center space-y-3 rounded-2xl">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-red-900">Application Not Found</h3>
            <p className="text-xs text-red-700 max-w-md mx-auto">{error}</p>
          </Card>
        )}

        {application && !loading && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <Card className="border-slate-200/90 shadow-md rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md">
                    {(() => {
                      const RoleIcon = getRoleIcon(application.role);
                      return <RoleIcon className="h-6 w-6" />;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                        {application.applicant_name || "Authorized Applicant"}
                      </CardTitle>
                      <span className="text-xs font-semibold text-slate-500">({application.role})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-mono text-slate-500">ID: {application._id}</span>
                      <button onClick={copyTrackingId} className="text-slate-400 hover:text-slate-700 p-0.5" title="Copy ID">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>{getStatusBadge(application.status)}</div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 space-y-8">
                {/* 4-Step Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification Stages</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>1. Submitted</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Timestamped</p>
                    </div>

                    <div className={`p-3.5 rounded-xl border space-y-1 ${
                      application.status === "APPROVED" || application.status === "REJECTED" || application.status === "PENDING"
                        ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50"
                    }`}>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        {application.status === "PENDING" ? <Clock className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        <span>2. License Audit</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Statutory Check</p>
                    </div>

                    <div className={`p-3.5 rounded-xl border space-y-1 ${
                      application.status === "APPROVED" ? "border-emerald-200 bg-emerald-50/50" : application.status === "REJECTED" ? "border-red-200 bg-red-50/50" : "border-slate-200 bg-slate-50"
                    }`}>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        {application.status === "APPROVED" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : application.status === "REJECTED" ? <XCircle className="h-4 w-4 text-red-500" /> : <Clock className="h-4 w-4 text-slate-400" />}
                        <span>3. Reviewer Action</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{application.status === "APPROVED" ? "Approved" : application.status === "REJECTED" ? "Rejected" : "In Progress"}</p>
                    </div>

                    <div className={`p-3.5 rounded-xl border space-y-1 ${application.status === "APPROVED" ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50"}`}>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        {application.status === "APPROVED" ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-slate-400" />}
                        <span>4. Portal Access</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{application.status === "APPROVED" ? "Active" : "Locked"}</p>
                    </div>
                  </div>
                </div>

                {/* Status Determinations */}
                {(application.status === "PENDING" || application.status === "UNDER_REVIEW") && (
                  <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <span>Application Under Statutory Review</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Your dossier is being checked by our compliance team. Standard review time is 24 to 48 business hours. You will receive an email upon conclusion.
                    </p>
                  </div>
                )}

                {application.status === "APPROVED" && (
                  <div className="p-6 rounded-xl border border-emerald-300 bg-emerald-50/80 space-y-4">
                    <div className="flex items-center gap-3 text-emerald-900">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="text-base font-bold">Partner Account Approved!</h4>
                        <p className="text-xs text-emerald-700">Credentials have been generated and dispatched to your email.</p>
                      </div>
                    </div>
                  </div>
                )}

                {application.status === "REJECTED" && (
                  <div className="p-6 rounded-xl border border-red-300 bg-red-50/80 space-y-3">
                    <div className="flex items-center gap-3 text-red-900">
                      <XCircle className="h-6 w-6 text-red-600 shrink-0" />
                      <div>
                        <h4 className="text-base font-bold">Application Not Approved</h4>
                        <p className="text-xs text-red-700">{application.rejection_reason || "Submitted documents did not meet compliance requirements."}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ApplicationStatusPage;
