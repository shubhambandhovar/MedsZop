import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ThermometerSnowflake,
  QrCode,
  KeyRound,
  Navigation,
  CheckCircle2,
  ArrowUpSquare,
  Shield
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

const DeliveryLoginPage = () => {
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
      toast.success("Delivery Partner authenticated successfully");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err.message || "Failed to authenticate delivery partner credentials.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#08120E] text-slate-100 selection:bg-teal-500/20 font-sans">
      {/* ================= LEFT EDITORIAL HERO PANEL (Desktop) ================= */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[52%] 2xl:w-[55%] relative min-h-screen flex-col justify-between p-10 xl:p-14 2xl:p-16 bg-[#04100C] text-white overflow-hidden border-r border-[#0D261F]">
        {/* Subtle Ambient Illumination */}
        <div
          className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-teal-500/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(#0E332A_1px,transparent_1px)] [background-size:24px_24px] opacity-35 pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Branding Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg tracking-tight text-white block">
                MedsZop <span className="text-teal-400">Logistics</span>
              </span>
              <span className="text-[10px] font-mono text-teal-200/60 tracking-wider uppercase block">
                Cold-Chain Fleet Operating System
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800 text-teal-300 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            FLEET OS v2.0
          </div>
        </div>

        {/* Center Editorial Narrative */}
        <div className="relative z-10 max-w-xl my-auto py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A261F] border border-[#114035] text-teal-300 text-xs font-semibold mb-6 tracking-wide shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
            Certified Medical Fleet Partner Network
          </div>

          <h1 className="font-heading text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight text-white leading-[1.18]">
            Cold-chain express dispatch &amp; doorstep OTP handover network.
          </h1>

          <p className="mt-4 text-sm xl:text-base text-slate-300 leading-relaxed">
            Real-time route navigation, calibrated 2°C–8°C insulated transport telemetry, and tamper-evident
            digital OTP doorstep verification on every medicine order.
          </p>

          {/* Three Fleet Highlights */}
          <div className="grid grid-cols-1 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#092B23] border border-[#124D3E] text-teal-400 flex items-center justify-center shrink-0">
                <ThermometerSnowflake className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Calibrated 2°C–8°C Cold Chain</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Insulated thermal pack monitoring preserving vaccines, insulins, and critical injectables.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#092B23] border border-[#124D3E] text-teal-400 flex items-center justify-center shrink-0">
                <QrCode className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Zero-Exposure OTP Handshake</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  6-digit dynamic customer OTP verification required before tamper-evident parcel release.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#092B23] border border-[#124D3E] text-teal-400 flex items-center justify-center shrink-0">
                <Navigation className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Hyperlocal Turn-by-Turn Navigation</h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Live traffic-aware routing from verified neighborhood pharmacies directly to patient homes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Regulatory Assurance */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
            Tamper-Evident Packaging &amp; Cold-Chain Telemetry Standard
          </span>
          <span className="font-mono text-teal-500/70">MedsZop Fleet Network</span>
        </div>
      </div>

      {/* ================= RIGHT FORM PANEL ================= */}
      <div className="w-full lg:w-[50%] xl:w-[48%] 2xl:w-[45%] min-h-screen flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-10 xl:p-14 2xl:p-16 relative bg-[#081511]">
        {/* Mobile Header */}
        <div className="flex items-center justify-between w-full lg:hidden mb-6">
          <div className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
            <span className="font-bold text-white">MedsZop Fleet</span>
          </div>

          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-teal-950 text-teal-300 border border-teal-800 rounded">
            FLEET OS
          </span>
        </div>

        {/* Form Container (Optimal measure ~420px for readability) */}
        <div className="w-full max-w-[420px] xl:max-w-[440px] mx-auto my-auto py-4">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-950 text-teal-400 text-xs font-semibold tracking-wide uppercase mb-3 border border-teal-800/80">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Delivery Partner Sign In
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Fleet console login
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
              Sign in to accept delivery dispatches, review active routes, and verify customer handovers.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="delivery-email" className="text-xs font-semibold text-slate-300">
                Registered Rider Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="delivery-email"
                  type="email"
                  placeholder="delivery@medszop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl text-base sm:text-sm bg-[#06120E] border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="delivery-password" className="text-xs font-semibold text-slate-300">
                  Password
                </Label>
                <span className="text-xs text-teal-400 hover:underline cursor-pointer">
                  Forgot credentials?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="delivery-password"
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
                  className="pl-10 pr-12 h-12 rounded-xl text-base sm:text-sm tabular-nums bg-[#06120E] border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-slate-400 hover:text-white transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-90"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password text" : "Show password text"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {capsLockOn && (
                <p className="text-xs font-medium text-amber-400 flex items-center gap-1 mt-1 animate-in fade-in-50">
                  <ArrowUpSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  Caps Lock is ON
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-base bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/25 transition-all active:scale-[0.99] mt-2 border border-teal-400/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Fleet Credentials...
                </>
              ) : (
                "Sign In to Delivery Fleet"
              )}
            </Button>
          </form>

          {/* Quick Sandbox Credentials */}
          <div className="mt-5 p-3.5 rounded-xl bg-[#06120E] border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-300 mb-1">
              <KeyRound className="h-3.5 w-3.5 text-teal-400" />
              <span>Fleet Logistics Sandbox Account</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Default role: <code className="text-teal-300 font-mono">delivery</code> &bull; Email:{" "}
              <code className="text-slate-300 font-mono">delivery@medszop.com</code>
            </p>
          </div>

          {/* Cold chain & OTP protocol badges */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 bg-[#06120E] p-2 rounded-lg border border-slate-800">
                <ThermometerSnowflake className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>Cold Chain 2°C–8°C</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#06120E] p-2 rounded-lg border border-slate-800">
                <QrCode className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                <span>Doorstep OTP Handover</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              MedsZop Fleet Protocol: Tamper-evident packaging seal verification &amp; dynamic OTP required.
            </p>
          </div>
        </div>

        {/* Right Footer Security Note */}
        <div className="w-full max-w-[420px] xl:max-w-[440px] mx-auto text-center pt-4">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
            Encrypted fleet telemetry connection • Real-time GPS verification
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryLoginPage;
