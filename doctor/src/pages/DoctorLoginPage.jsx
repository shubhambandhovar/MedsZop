import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, HeartPulse, Award } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const DoctorLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Doctor clinical session established successfully");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err.message || "Failed to authenticate medical practitioner.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-700 text-white shadow-md shadow-sky-700/20 mb-3.5">
            <Stethoscope className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
            MedsZop <span className="text-sky-700">Doctor</span> Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Clinical Telemedicine Suite & Electronic Health Records
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">Practitioner Sign In</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Access your teleconsultation queue and digital Rx pad
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sky-50 text-sky-800 border border-sky-200 rounded">
              NMC RMP
            </span>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="doctor-email" className="text-xs font-bold text-slate-700">
                Registered Medical Practitioner Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="doctor-email"
                  type="email"
                  placeholder="doctor@medszop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-xs h-10 bg-slate-50 border-slate-200"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doctor-password" className="text-xs font-bold text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="doctor-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 text-xs h-10 bg-slate-50 border-slate-200"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-3 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs shadow-sm shadow-sky-700/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Medical Credentials...
                </>
              ) : (
                "Authenticate & Open Clinical Workspace"
              )}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-700 shrink-0" />
              <span>Governed by NMC Telemedicine Practice Guidelines 2020</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Licensed medical practitioner wishing to join the MedsZop Telehealth network? Apply via the Partner Onboarding Portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLoginPage;
