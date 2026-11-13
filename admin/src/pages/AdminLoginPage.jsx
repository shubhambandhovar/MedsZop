import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Server,
  Activity,
  FileCheck2,
  ArrowUpSquare
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [capsLockOn, setCapsLockOn] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated as admin, redirect to dashboard
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
      toast.success("Administrator authentication successful");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err.message || "Failed to authenticate administrator.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAFBF9] dark:bg-[#070D12] text-foreground selection:bg-blue-600/20">
      {/* ================= LEFT EDITORIAL HERO PANEL (Desktop) ================= */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[52%] 2xl:w-[55%] relative min-h-screen flex-col justify-between p-10 xl:p-14 2xl:p-16 bg-[#06111C] text-white overflow-hidden border-r border-[#0D243A]">
        {/* Subtle Ambient Illumination */}
        <div
          className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-blue-600/20 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(#0D243A_1px,transparent_1px)] [background-size:24px_24px] opacity-35 pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Branding Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg tracking-tight text-white block">
                MedsZop <span className="text-blue-400">Admin</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase block">
                Platform Operations Console
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-blue-300 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            RESTRICTED ACCESS
          </div>
        </div>

        {/* Center Editorial Narrative */}
        <div className="relative z-10 max-w-xl my-auto py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A1B2E] border border-[#123050] text-blue-300 text-xs font-semibold mb-6 tracking-wide shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
            Infrastructure Operations &amp; Audit Governance
          </div>

          <h1 className="font-heading text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight text-white leading-[1.18]">
            Centralized platform administration, telemetry, and operations.
          </h1>

          <p className="mt-4 text-sm xl:text-base text-slate-300 leading-relaxed">
            Real-time oversight across regional fulfillment nodes, logistics operations, practitioner
            accounts, and platform audit ledgers.
          </p>

          {/* Three Operational Highlights */}
          <div className="grid grid-cols-1 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0A1D33] border border-[#133760] text-blue-400 flex items-center justify-center shrink-0">
                <Server className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Role-Based Access Control (RBAC)</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Cryptographically verified session policies with fine-grained endpoint privileges.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0A1D33] border border-[#133760] text-blue-400 flex items-center justify-center shrink-0">
                <FileCheck2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Platform System Audit Trail</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  All administrative mutations logged with timestamp, user ID, and IP signature.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0A1D33] border border-[#133760] text-blue-400 flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Real-Time System Telemetry</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Live latency metrics, order throughput, and circuit-breaker telemetry monitors.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Security Assurance */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
            TLS Encrypted Healthcare Security Protection
          </span>
          <span className="font-mono text-slate-500">MedsZop Security Core v2.0</span>
        </div>
      </div>

      {/* ================= RIGHT FORM PANEL ================= */}
      <div className="w-full lg:w-[50%] xl:w-[48%] 2xl:w-[45%] min-h-screen flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-10 xl:p-14 2xl:p-16 relative">
        {/* Mobile Header */}
        <div className="flex items-center justify-between w-full lg:hidden mb-6">
          <div className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-bold text-foreground">MedsZop Admin</span>
          </div>

          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded">
            PORTAL
          </span>
        </div>

        {/* Form Container (Optimal measure ~420px for readability) */}
        <div className="w-full max-w-[420px] xl:max-w-[440px] mx-auto my-auto py-4">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold tracking-wide uppercase mb-3 border border-blue-200/60 dark:border-blue-900">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Administrative Verification
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Administrator sign in
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Authorized personnel only. All access attempts are recorded in the security audit log.
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
              <Label htmlFor="admin-email" className="text-xs font-semibold text-foreground">
                Admin Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@medszop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl text-base sm:text-sm bg-white dark:bg-[#0C1520] border-slate-200 dark:border-[#16293D] focus-visible:ring-blue-600/20 focus-visible:border-blue-600"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-xs font-semibold text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-password"
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
                  className="pl-10 pr-12 h-12 rounded-xl text-base sm:text-sm tabular-nums bg-white dark:bg-[#0C1520] border-slate-200 dark:border-[#16293D] focus-visible:ring-blue-600/20 focus-visible:border-blue-600"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-90"
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
              className="w-full h-12 rounded-xl font-semibold text-base bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all active:scale-[0.99] mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating Administrator...
                </>
              ) : (
                "Sign In to Console"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-[#16293D] text-center">
            <p className="text-xs text-muted-foreground">
              MedsZop Infrastructure Security • Role-Based Access Control (RBAC)
            </p>
          </div>
        </div>

        {/* Right Footer Security Note */}
        <div className="w-full max-w-[420px] xl:max-w-[440px] mx-auto text-center pt-4">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            Encrypted administrative management session
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
