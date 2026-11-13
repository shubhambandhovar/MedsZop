import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Video,
  FileSignature,
  Activity,
  ArrowUpSquare,
  Shield
} from "lucide-react";
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
  const [capsLockOn, setCapsLockOn] = useState(false);

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
      await login(email.trim(), password);
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAFBF9] dark:bg-[#070D12] text-foreground selection:bg-sky-600/20 font-sans">
      {/* ================= LEFT EDITORIAL HERO PANEL (Desktop) ================= */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[52%] 2xl:w-[55%] relative min-h-screen flex-col justify-between p-10 xl:p-14 2xl:p-16 bg-[#051624] text-white overflow-hidden border-r border-[#0D2E49]">
        {/* Subtle Ambient Illumination */}
        <div
          className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-sky-600/20 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(#0E314D_1px,transparent_1px)] [background-size:24px_24px] opacity-35 pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Branding Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg tracking-tight text-white block">
                MedsZop <span className="text-sky-400">Doctor</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase block">
                Clinical Telemedicine Suite &amp; EHR
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800 text-sky-300 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            CLINICAL SUITE
          </div>
        </div>

        {/* Center Editorial Narrative */}
        <div className="relative z-10 max-w-xl my-auto py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A2238] border border-[#123E66] text-sky-300 text-xs font-semibold mb-6 tracking-wide shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            Physician &amp; Teleconsultation Workspace
          </div>

          <h1 className="font-heading text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight text-white leading-[1.18]">
            Clinical telemedicine suite &amp; electronic health records.
          </h1>

          <p className="mt-4 text-sm xl:text-base text-slate-300 leading-relaxed">
            Conduct encrypted video consultations, review patient health histories, and issue
            structured electronic prescriptions for patient care.
          </p>

          {/* Three Clinical Highlights */}
          <div className="grid grid-cols-1 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#09253F] border border-[#144773] text-sky-400 flex items-center justify-center shrink-0">
                <Video className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Encrypted Patient Consultations</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  HD WebRTC teleconsultations with live patient queue management and EHR records.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#09253F] border border-[#144773] text-sky-400 flex items-center justify-center shrink-0">
                <FileSignature className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Digital Prescription Pad (Rx)</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Dosage validation, contraindication checks, and secure digital signatures.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#09253F] border border-[#144773] text-sky-400 flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Comprehensive Diagnostic History</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Secure longitudinal patient timelines, lab reports, and past prescription reviews.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Clinical Assurance */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            Structured Telemedicine Consultations
          </span>
          <span className="font-mono text-slate-500">Verified Practitioner Network</span>
        </div>
      </div>

      {/* ================= RIGHT FORM PANEL ================= */}
      <div className="w-full lg:w-[50%] xl:w-[48%] 2xl:w-[45%] min-h-screen flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-10 xl:p-14 2xl:p-16 relative">
        {/* Mobile Header */}
        <div className="flex items-center justify-between w-full lg:hidden mb-6">
          <div className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-700 text-white flex items-center justify-center">
              <Stethoscope className="h-4 w-4" />
            </div>
            <span className="font-bold text-foreground">MedsZop Doctor</span>
          </div>

          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded">
            CLINICAL
          </span>
        </div>

        {/* Form Container (Optimal measure ~420px for readability) */}
        <div className="w-full max-w-[420px] xl:max-w-[440px] mx-auto my-auto py-4">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 text-xs font-semibold tracking-wide uppercase mb-3 border border-sky-200/60 dark:border-sky-900">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Clinical Practitioner Sign In
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Doctor workspace login
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Access your scheduled patient consultations, clinical queues, and digital Rx pad.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="doctor-email" className="text-xs font-semibold text-foreground">
                Registered Medical Practitioner Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="doctor-email"
                  type="email"
                  placeholder="doctor@medszop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl text-base sm:text-sm bg-white dark:bg-[#0C1520] border-slate-200 dark:border-[#16293D] focus-visible:ring-sky-600/20 focus-visible:border-sky-600"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doctor-password" className="text-xs font-semibold text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="doctor-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.getModifierState) {
                      setCapsLockOn(e.getModifierState("CapsLock"));
                    }
                  }}
                  onKeyUp={(e) => {
                    if (e.getModifierState) {
                      setCapsLockOn(e.getModifierState("CapsLock"));
                    }
                  }}
                  className="pl-10 pr-12 h-12 rounded-xl text-base sm:text-sm tabular-nums bg-white dark:bg-[#0C1520] border-slate-200 dark:border-[#16293D] focus-visible:ring-sky-600/20 focus-visible:border-sky-600"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 active:scale-90"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password text" : "Show password text"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {capsLockOn && (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1 animate-in fade-in-50">
                  <ArrowUpSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  Caps Lock is ON
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-base bg-sky-700 hover:bg-sky-800 text-white shadow-md shadow-sky-700/20 transition-all active:scale-[0.99] mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Medical Practitioner Credentials...
                </>
              ) : (
                "Authenticate & Open Clinical Workspace"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-[#16293D] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Teleconsultation &amp; Prescription Management</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Not registered as a physician partner? Apply via the MedsZop Doctor Onboarding Portal.
            </p>
          </div>
        </div>

        {/* Right Footer Security Note */}
        <div className="w-full max-w-[420px] xl:max-w-[440px] mx-auto text-center pt-4">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            Secure clinical communication channel • Verified Practitioner Access
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorLoginPage;
