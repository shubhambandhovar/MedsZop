import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import PartnersNavbar from "../components/PartnersNavbar";
import PartnersFooter from "../components/PartnersFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { CheckCircle, Clock, XCircle, AlertTriangle, Search, ArrowLeft } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ApplicationStatusPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setApplication(null);
      setError(null);
      return;
    }

    const fetchStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_URL}/onboarding/status/${id}`);
        setApplication(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load application status. Please check your tracking ID.");
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/application-status/${searchId.trim()}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "APPROVED": return <CheckCircle className="h-12 w-12 text-emerald-500" />;
      case "REJECTED": return <XCircle className="h-12 w-12 text-red-500" />;
      default: return <Clock className="h-12 w-12 text-amber-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "REJECTED": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PartnersNavbar />

      <main className="flex-1 container max-w-2xl mx-auto py-12 px-4">
        {/* If no ID provided, show Tracking ID lookup form */}
        {!id ? (
          <Card className="rounded-2xl border-slate-200 shadow-sm p-6 text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <Search className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">Track Partner Application</CardTitle>
              <CardDescription>
                Enter the Application Tracking ID you received upon submitting your application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearchSubmit} className="space-y-4 max-w-md mx-auto">
                <Input
                  placeholder="Enter Tracking ID (e.g. 67a...)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="text-center font-mono text-sm"
                  required
                />
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                  Check Status
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-slate-500">Retrieving application status...</p>
          </div>
        ) : error ? (
          <Card className="rounded-2xl border-red-200 bg-red-50/50 shadow-sm p-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl text-red-800">Application Lookup Failed</CardTitle>
            <p className="text-sm text-red-600 mt-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/application-status")}
              className="mt-6 gap-2 mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Try Another Tracking ID
            </Button>
          </Card>
        ) : (
          <Card className="rounded-2xl border-slate-200 shadow-sm text-center py-6">
            <CardHeader>
              <div className="flex justify-center mb-3">
                {getStatusIcon(application?.status)}
              </div>
              <CardTitle className="text-2xl font-bold">Application Status</CardTitle>
              <CardDescription>
                Tracking ID: <span className="font-mono text-slate-700">{id}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-slate-100/70 p-5 rounded-2xl inline-block w-full max-w-sm border border-slate-200/80 text-left">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Applicant Name</p>
                <p className="font-semibold text-lg text-slate-900 mt-0.5">{application?.applicant_name}</p>

                <div className="my-3 border-t border-slate-200"></div>

                <p className="text-xs text-muted-foreground uppercase font-semibold">Role Applied</p>
                <p className="font-medium text-slate-800 mt-0.5">{application?.role}</p>

                <div className="my-3 border-t border-slate-200"></div>

                <p className="text-xs text-muted-foreground uppercase font-semibold">Current Decision</p>
                <Badge variant="outline" className={`text-xs px-3 py-1 mt-1 font-semibold ${getStatusColor(application?.status)}`}>
                  {application?.status}
                </Badge>
              </div>

              {application?.status === "PENDING" && (
                <div className="flex items-start gap-3 bg-blue-50/80 border border-blue-200 p-4 rounded-xl text-left max-w-md mx-auto">
                  <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">Under Review</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Your application is currently being verified by our medical and compliance teams. You will receive an automated email as soon as an approval decision is reached.
                    </p>
                  </div>
                </div>
              )}

              {application?.status === "APPROVED" && (
                <div className="flex items-start gap-3 bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl text-left max-w-md mx-auto">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-emerald-900 text-sm">Application Approved!</h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Congratulations! Your credentials have been verified. An email has been sent with your temporary password and portal link to begin onboarding.
                    </p>
                  </div>
                </div>
              )}

              {application?.status === "REJECTED" && (
                <div className="flex items-start gap-3 bg-red-50/80 border border-red-200 p-4 rounded-xl text-left max-w-md mx-auto">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 text-sm">Application Needs Attention</h4>
                    <p className="text-xs text-red-700 mt-1">
                      Reason: {application?.rejection_reason || "Submitted documents did not meet verification criteria."}
                    </p>
                    <p className="text-xs text-red-600 mt-2 font-medium">
                      You may address the issues and submit a fresh application on the portal.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/application-status")}
                  className="gap-2 mx-auto text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Track Another Application
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <PartnersFooter />
    </div>
  );
};

export default ApplicationStatusPage;
