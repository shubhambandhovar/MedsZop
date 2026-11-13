import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ClipboardCheck,
  Boxes,
  ThermometerSnowflake,
  ArrowUpSquare,
  Shield
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const PharmacyLoginPage = () => {
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
      toast.success("Pharmacy fulfillment console session established");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err.message || "Failed to authenticate pharmacy.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAFBF9] dark:bg-[#080E0B] text-foreground selection:bg-[#046A47]/20 font-sans">
      {/* ================= LEFT EDITORIAL HERO PANEL (Desktop) ================= */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[52%] 2xl:w-[55%] relative min-h-screen flex-col justify-between p-10 xl:p-14 2xl:p-16 bg-[#061A13] text-white overflow-hidden border-r border-[#0E2E22]">
        {/* Ambient Illumination */}
        <div
          className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[#046A47]/25 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full bg-[#10B981]/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(#143D2E_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Branding Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0B2E21] border border-[#144F38] flex items-center justify-center text-[#34D399]">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg tracking-tight text-white block">
                MedsZop <span className="text-[#34D399]">Pharmacy</span>
              </span>
              <span className="text-[10px] font-mono text-[#8BAAA0] tracking-wider uppercase block">
                Retail Fulfillment &amp; Dispensing Desk
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B2C20] border border-[#144A36] text-[#6EE7B7] text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-[#34D399] animate-pulse" />
            DISPENSARY
          </div>
        </div>

        {/* Center Editorial Narrative */}
        <div className="relative z-10 max-w-xl my-auto py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B2C20] border border-[#144A36] text-[#6EE7B7] text-xs font-semibold mb-6 tracking-wide shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
            Retail Chemist Fulfillment Grid
          </div>

          <h1 className="font-heading text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight text-white leading-[1.18]">
            Prescription fulfillment &amp; medicine dispensing desk.
          </h1>

          <p className="mt-4 text-sm xl:text-base text-[#9EBAAE] leading-relaxed">
            Manage incoming digital prescriptions, verify drug interactions, orchestrate barcode batch
            deductions, and hand off delivery dispatches promptly.
          </p>

          {/* Three Dispensary Highlights */}
          <div className="grid grid-cols-1 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0B2E21] border border-[#144F38] text-[#34D399] flex items-center justify-center shrink-0">
                <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Prescription Verification Queue</h2>
                <p className="text-xs text-[#8BAAA0] mt-0.5 leading-relaxed">
                  Real-time prescription verification and clinical review before packaging.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0B2E21] border border-[#144F38] text-[#34D399] flex items-center justify-center shrink-0">
                <Boxes className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Automated Batch &amp; Expiry Control</h2>
                <p className="text-xs text-[#8BAAA0] mt-0.5 leading-relaxed">
                  First-expiry inventory deduction with instant batch audit logging.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0B2E21] border border-[#144F38] text-[#34D399] flex items-center justify-center shrink-0">
                <ThermometerSnowflake className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Protective Packaging Handover</h2>
                <p className="text-xs text-[#8BAAA0] mt-0.5 leading-relaxed">
                  Insulated dispatch packaging with tamper-evident seal and rider OTP handshake.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Operational Assurance */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#789A8F]">
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
            Prescription Review &amp; Dispensing Standards
          </span>
          <span className="font-mono text-[#5B7C72]">Partner Pharmacy Node</span>
        </div>
      </div>

      {/* ================= RIGHT FORM PANEL ================= */}
      <div className="w-full lg:w-[50%] xl:w-[48%] 2xl:w-[45%] min-h-screen flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-10 xl:p-14 2xl:p-16 relative">
        {/* Mobile Header */}
        <div className="flex items-center justify-between w-full lg:hidden mb-6">
          <div className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#046A47] text-white flex items-center justify-center">
              <Store className="h-4 w-4" />
            </div>
            <span className="font-bold text-foreground">MedsZop Pharmacy</span>
          </div>

          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded">
            PHARMACY
          </span>
        </div>

        {/* Form Container (Optimal measure ~420px for readability) */}
        <div className="w-full max-w-[420px] xl:max-w-[440px] mx-auto my-auto py-4">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#046A47]/10 dark:bg-[#046A47]/20 text-[#046A47] dark:text-[#34D399] text-xs font-semibold tracking-wide uppercase mb-3">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Pharmacist Shift Sign In
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Chemist console login
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Access your active prescription queue, stock inventory, and delivery dispatches.
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
              <Label htmlFor="pharmacy-email" className="text-xs font-semibold text-foreground">
                Registered Chemist / Pharmacy Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pharmacy-email"
                  type="email"
                  placeholder="pharmacy@medszop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl text-base sm:text-sm bg-white dark:bg-[#0F1714] border-slate-200 dark:border-[#1E2E27] focus-visible:ring-[#046A47]/20 focus-visible:border-[#046A47]"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pharmacy-password" className="text-xs font-semibold text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pharmacy-password"
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
                  className="pl-10 pr-12 h-12 rounded-xl text-base sm:text-sm tabular-nums bg-white dark:bg-[#0F1714] border-slate-200 dark:border-[#1E2E27] focus-visible:ring-[#046A47]/20 focus-visible:border-[#046A47]"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#046A47] active:scale-90"
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
              className="w-full h-12 rounded-xl font-semibold text-base bg-[#046A47] hover:bg-[#035438] text-white shadow-md shadow-[#046A47]/20 transition-all active:scale-[0.99] mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Pharmacist Credentials...
                </>
              ) : (
                "Authenticate & Open Dispensing Shift"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-[#1E2E27] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-[#046A47] dark:text-[#34D399] shrink-0" />
              <span>Prescription Verification &amp; Dispensing Standards</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Not registered as a retail partner? Apply via the MedsZop Partner Onboarding Portal.
            </p>
          </div>
        </div>

        {/* Right Footer Security Note */}
        <div className="w-full max-w-[420px] xl:max-w-[440px] mx-auto text-center pt-4">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#046A47] dark:text-[#34D399]" aria-hidden="true" />
            Secure retail pharmaceutical session • Verified Partner Dispenser
          </p>
        </div>
      </div>
    </div>
  );
};

export default PharmacyLoginPage;
