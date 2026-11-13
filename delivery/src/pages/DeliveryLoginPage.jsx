import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, ThermometerSnowflake, QrCode, KeyRound } from "lucide-react";
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
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 px-4 py-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-xl shadow-cyan-500/20 mb-3 border border-cyan-400/30">
            <Truck className="h-7 w-7" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              MedsZop <span className="text-cyan-400">Logistics</span>
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800">
              FLEET OS
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Cold-Chain Dispatch &bull; Tamper-Evident Delivery &bull; Secure OTP Handover
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-6 md:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Partner Authentication</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sign in to accept runs and verify doorstep deliveries
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/80 px-2 py-1 rounded-md">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>TLS Encrypted</span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="delivery-email" className="text-xs font-semibold text-slate-300">
                Registered Rider Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <Input
                  id="delivery-email"
                  type="email"
                  placeholder="delivery@medszop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-cyan-500/20 text-sm"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="delivery-password" className="text-xs font-semibold text-slate-300">
                  Secure Password
                </Label>
                <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer">
                  Forgot credentials?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <Input
                  id="delivery-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-cyan-500/20 text-sm font-mono"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-cyan-600/25 border border-cyan-400/20 text-sm"
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

          {/* Quick Demo Assist */}
          <div className="mt-5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-300 mb-1">
              <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
              <span>Fleet Logistics Sandbox Account</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Default role: <code className="text-cyan-300 font-mono">delivery</code> &bull; Email: <code className="text-slate-300 font-mono">delivery@medszop.com</code>
            </p>
          </div>

          {/* Safety & Protocol Footer */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <ThermometerSnowflake className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>Cold Chain 2°C–8°C</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <QrCode className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                <span>Doorstep OTP Handover</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              MedsZop Fleet Protocol: Strict tamper-evident parcel seal verification &amp; zero-exposure customer OTP protocol in effect.
            </p>
          </div>
        </div>

        {/* Onboarding Link */}
        <div className="mt-5 text-center">
          <p className="text-xs text-slate-400">
            Not an authorized delivery partner?{" "}
            <a href="/onboarding" className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4">
              Apply via Partner Onboarding
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryLoginPage;
