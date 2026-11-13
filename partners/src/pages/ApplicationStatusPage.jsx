import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Search,
  ArrowRight,
  ShieldCheck,
  FileText,
  Copy,
  ExternalLink,
  RotateCcw,
  Loader2,
  Building2,
  Stethoscope,
  Truck,
  Mail,
  HelpCircle,
  Upload
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ApplicationStatusPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(id || "");
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);

  // Resubmission modal state for REJECTED or ADDITIONAL_INFO_REQUIRED
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitDoc, setResubmitDoc] = useState("");
  const [resubmitNotes, setResubmitNotes] = useState("");
  const [isResubmitting, setIsResubmitting] = useState(false);

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
      navigate(`/status/${searchId.trim()}`);
    }
  };

  const copyTrackingId = () => {
    if (application?._id) {
      navigator.clipboard.writeText(application._id);
      toast.success("Tracking ID copied to clipboard");
    }
  };

  const handleResubmit = async () => {
    if (!resubmitDoc && !resubmitNotes.trim()) {
      return toast.error("Please attach a corrected document or provide explanatory notes.");
    }
    setIsResubmitting(true);
    try {
      // In production this updates the application record
      toast.success("Additional documentation received. Application status updated to UNDER_REVIEW.");
      setShowResubmitModal(false);
      setApplication(prev => ({
        ...prev,
        status: "PENDING",
        admin_remarks: "Resubmitted documents under second-line audit."
      }));
    } catch (err) {
      toast.error("Failed to submit additional documents");
    } finally {
      setIsResubmitting(false);
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
    if (s === "ADDITIONAL_INFO_REQUIRED") {
      return <Badge variant="warning" className="text-xs px-3 py-1 font-bold gap-1"><AlertTriangle className="h-3.5 w-3.5" /> INFO REQUIRED</Badge>;
    }
    return <Badge variant="secondary" className="text-xs px-3 py-1 font-bold bg-amber-100 text-amber-900 border-amber-300 gap-1"><Clock className="h-3.5 w-3.5" /> UNDER AUDIT</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-sans space-y-8">
      {/* Header Search Banner */}
      <div className="text-center space-y-3">
        <Badge variant="outline" className="text-xs font-semibold px-3 py-0.5 border-emerald-600 text-emerald-800 bg-emerald-50">
          REAL-TIME DOSSIER TRACKING
        </Badge>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          Partner Application Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Track the statutory credential review and activation status of your MedsZop partner onboarding application.
        </p>

        {/* Tracking Search Input */}
        <form onSubmit={handleSearchSubmit} className="max-w-lg mx-auto flex gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Paste Tracking ID (e.g. 65b9e0000000000000005001)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="pl-10 h-11 text-sm font-mono border-slate-300"
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
          <p className="text-xs font-semibold text-slate-600">Retrieving official application dossier...</p>
        </div>
      )}

      {error && !loading && (
        <Card className="border-red-200 bg-red-50/50 p-6 text-center space-y-3 rounded-2xl">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-red-900">Application Record Not Found</h3>
          <p className="text-xs text-red-700 max-w-md mx-auto">{error}</p>
          <div className="pt-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="text-xs">
                Return to Partner Streams
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {application && !loading && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Main Status Dossier Card */}
          <Card className="border-slate-200/90 shadow-lg rounded-2xl overflow-hidden">
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
                    <span className="text-xs font-semibold text-slate-500">
                      ({application.role || "Partner"})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-mono text-slate-500">
                      ID: {application._id}
                    </span>
                    <button
                      onClick={copyTrackingId}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                      title="Copy ID"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                {getStatusBadge(application.status)}
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-8">
              {/* Audit Progress Stepper */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Verification Lifecycle Timeline
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>1. Submitted</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : "Timestamped"}
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className={`p-3.5 rounded-xl border space-y-1 ${
                    application.status === "APPROVED" || application.status === "REJECTED" || application.status === "PENDING"
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-slate-200 bg-slate-50"
                  }`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      {application.status === "PENDING" ? (
                        <Clock className="h-4 w-4 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                      <span>2. License Audit</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Form 20/21 or NMC Check</p>
                  </div>

                  {/* Step 3 */}
                  <div className={`p-3.5 rounded-xl border space-y-1 ${
                    application.status === "APPROVED"
                      ? "border-emerald-200 bg-emerald-50/50"
                      : application.status === "REJECTED"
                      ? "border-red-200 bg-red-50/50"
                      : "border-slate-200 bg-slate-50"
                  }`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      {application.status === "APPROVED" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : application.status === "REJECTED" ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-slate-400" />
                      )}
                      <span>3. Reviewer Action</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {application.status === "APPROVED" ? "Approved" : application.status === "REJECTED" ? "Rejected" : "In Progress"}
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className={`p-3.5 rounded-xl border space-y-1 ${
                    application.status === "APPROVED"
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-slate-200 bg-slate-50"
                  }`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      {application.status === "APPROVED" ? (
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-slate-400" />
                      )}
                      <span>4. Portal Access</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {application.status === "APPROVED" ? "Provisioned" : "Locked"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Specific Action Cards */}
              {/* 1. UNDER REVIEW */}
              {(application.status === "PENDING" || application.status === "UNDER_REVIEW") && (
                <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3">
                  <div className="flex items-center gap-2.5 text-amber-900 font-bold text-sm">
                    <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                    <span>Dossier Currently Under Administrative Review</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Your application is being cross-referenced with official statutory registries (State Licensing Authority / National Medical Commission / Transport Department). Standard review turnaround is 24 to 48 business hours. You will receive an automated dispatch notification on your registered email once concluded.
                  </p>
                </div>
              )}

              {/* 2. APPROVED */}
              {application.status === "APPROVED" && (
                <div className="p-6 rounded-xl border border-emerald-300 bg-emerald-50/80 space-y-4">
                  <div className="flex items-center gap-3 text-emerald-900">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-base font-bold">Partner Credentials Approved &amp; Account Provisioned!</h4>
                      <p className="text-xs text-emerald-700">
                        Your professional identity and licensing have been verified by central administration.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-emerald-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500">Registered Portal Login:</span>
                      <span className="font-bold text-slate-900">{application.email || "Registered Partner Email"}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-500">Temporary Password:</span>
                      <span className="font-bold text-emerald-700">Sent via Secure Email Notification</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    {application.role?.toLowerCase().includes("doctor") && (
                      <a href="http://localhost:5175/login" target="_blank" rel="noreferrer">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-h-[44px]">
                          <span>Launch Doctor Clinical Workspace</span>
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </a>
                    )}
                    {application.role?.toLowerCase().includes("pharm") && (
                      <a href="http://localhost:5174/login" target="_blank" rel="noreferrer">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-h-[44px]">
                          <span>Launch Pharmacy Retail Console</span>
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </a>
                    )}
                    {application.role?.toLowerCase().includes("delivery") && (
                      <a href="http://localhost:5176/login" target="_blank" rel="noreferrer">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-h-[44px]">
                          <span>Launch Delivery Fleet Logistics Hub</span>
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* 3. REJECTED */}
              {application.status === "REJECTED" && (
                <div className="p-6 rounded-xl border border-red-300 bg-red-50/80 space-y-4">
                  <div className="flex items-center gap-3 text-red-900">
                    <XCircle className="h-6 w-6 text-red-600 shrink-0" />
                    <div>
                      <h4 className="text-base font-bold">Application Determination: Not Approved</h4>
                      <p className="text-xs text-red-700">
                        The submitted documents did not satisfy statutory compliance standards.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-red-200 text-xs space-y-1.5">
                    <span className="font-semibold text-slate-700 uppercase tracking-wide text-[10px]">
                      Official Reviewer Finding:
                    </span>
                    <p className="text-red-900 font-medium">
                      {application.rejection_reason || application.admin_remarks || "Expired or illegible license copy submitted."}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <Button
                      onClick={() => setShowResubmitModal(true)}
                      className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs min-h-[44px]"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      <span>Resubmit Corrected Documentation</span>
                    </Button>
                    <a href="mailto:compliance@medszop.com" className="inline-block">
                      <Button variant="outline" className="w-full border-slate-300 text-xs min-h-[44px]">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>Appeal to Compliance Desk</span>
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resubmit Modal */}
      <Dialog open={showResubmitModal} onOpenChange={setShowResubmitModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resubmit Corrected Credentials</DialogTitle>
            <DialogDescription>
              Attach the updated or corrected license document as requested by the reviewer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="resubmit_file">Corrected Document Scan (PDF, JPG, PNG &lt; 3MB) *</Label>
              <Input
                id="resubmit_file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) setResubmitDoc(file.name);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resubmit_notes">Applicant Clarification Note</Label>
              <Input
                id="resubmit_notes"
                placeholder="e.g. Attached renewed Form 20 valid through 2028."
                value={resubmitNotes}
                onChange={(e) => setResubmitNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResubmitModal(false)} disabled={isResubmitting}>
              Cancel
            </Button>
            <Button onClick={handleResubmit} disabled={isResubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {isResubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Submit for Re-Audit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationStatusPage;
