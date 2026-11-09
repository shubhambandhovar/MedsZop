import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Mail,
  Lock,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Sparkles,
  HeartHandshake,
  ArrowUpSquare
} from "lucide-react";
import { toast } from "sonner";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Inline Validation
  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const isEmailValid = isValidEmail(email);
  const emailError = emailTouched && email.trim().length > 0 && !isEmailValid
    ? "Please enter a valid email address (e.g. name@example.com)"
    : emailTouched && email.trim().length === 0
    ? "Email address is required"
    : null;

  const passwordError = passwordTouched && password.length === 0
    ? "Password is required"
    : null;

  const navigateByRole = (user) => {
    switch (user?.role?.toLowerCase()) {
      case "admin":
        navigate("/admin");
        break;
      case "pharmacy":
        navigate("/pharmacy");
        break;
      case "delivery":
        navigate("/delivery");
        break;
      case "doctor":
        navigate("/doctor-dashboard");
        break;
      default:
        navigate("/dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("You are currently offline. Please check your internet connection.");
      return;
    }

    setEmailTouched(true);
    setPasswordTouched(true);

    if (!email.trim() || !isEmailValid) {
      toast.error("Please provide a valid email address");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      toast.success("Welcome back!");
      navigateByRole(user);
    } catch (error) {
      const isNetworkErr = error?.message?.includes("Network Error") || error?.code === "ERR_NETWORK";
      const msg = isNetworkErr
        ? "Unable to connect to MedsZop servers. Please check your network connection."
        : typeof error === "string"
        ? error
        : error.response?.data?.message || error?.message || "Invalid email or password";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const user = await googleLogin(credentialResponse.credential);
      toast.success("Welcome back!");
      navigateByRole(user);
    } catch (error) {
      const msg = typeof error === "string" ? error : error?.message;
      if (msg && msg.includes("No account found")) {
        toast.custom(() => (
          <div className="flex flex-col items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 px-7 py-6 w-[340px]">
            <div className="h-11 w-11 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-sm text-center text-foreground font-medium">
              No account found with this Google email. Please create an account first.
            </p>
            <button
              onClick={() => {
                toast.dismiss();
                navigate("/register");
              }}
              className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-sm"
            >
              Go to Sign Up
            </button>
          </div>
        ), { position: "top-center", duration: 6000 });
      } else {
        toast.error(msg || "Google login failed. Please try standard sign in.");
      }
    }
  };

  const handleGoogleError = () => {
    toast.error("Google authentication encountered an error. Please try again.");
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center py-10 sm:py-8 pt-16 sm:pt-8 px-4 sm:px-6 lg:px-8 relative selection:bg-primary/20">
      {/* Background Accent Gradient */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/70 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background -z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Floating Back to Home Button */}
      <div className="absolute top-4 sm:top-5 left-4 sm:left-5 z-20">
        <Link to="/">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow hover:bg-white dark:hover:bg-slate-900 px-3.5 py-2 sm:px-4 min-h-[38px] text-xs sm:text-sm text-foreground font-medium transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Back to Home
          </Button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl xl:max-w-5xl my-auto"
      >
        <div className="grid lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-2xl bg-card">
          {/* ================= LEFT TRUST / BRAND SHOWCASE PANEL ================= */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden lg:border-r lg:border-slate-800/60">
            {/* Subtle Tech Glow Overlay */}
            <div
              className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none"
              aria-hidden="true"
            />

            {/* Top Branding */}
            <div className="relative z-10">
              <Link to="/" className="inline-block mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
                <img
                  src="https://res.cloudinary.com/dih1im0zi/image/upload/v1771198740/medszoplogo_hjhsxv.svg"
                  alt="MedsZop Logo"
                  className="h-10 w-auto object-contain brightness-0 invert"
                />
              </Link>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-semibold mb-4 border border-cyan-500/20">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Licensed Healthcare Ecosystem
              </div>

              <h2 className="font-heading text-3xl font-bold tracking-tight text-white leading-snug">
                Verified healthcare, delivered in 28 minutes.
              </h2>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4 my-8 relative z-10">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Zap className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">Cold-Chain Express</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Insulated temperature-controlled dispatch directly from local licensed pharmacies.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">AI Clinical Recognition</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Instantly scan prescriptions and receive drug-interaction alerts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">100% Genuine Guarantee</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Complete batch traceability on every OTC and prescription medicine.
                  </p>
                </div>
              </div>
            </div>

            {/* Editorial Testimonial Accent */}
            <div className="border-t border-slate-800/80 pt-5 relative z-10">
              <p className="font-accent italic text-xs text-slate-300 leading-relaxed">
                &ldquo;MedsZop is transforming chronic care delivery with pharmaceutical rigor and instant local access.&rdquo;
              </p>
              <p className="text-[11px] font-semibold text-cyan-400 mt-1.5">
                Dr. Arvind Rao, Chief Clinical Advisor
              </p>
            </div>
          </div>

          {/* ================= RIGHT FORM PANEL ================= */}
          <div className="col-span-12 lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
            {/* Mobile Header Logo */}
            <div className="lg:hidden text-center mb-6">
              <Link to="/" className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
                <img
                  src="https://res.cloudinary.com/dih1im0zi/image/upload/v1771198740/medszoplogo_hjhsxv.svg"
                  alt="MedsZop Logo"
                  className="h-9 w-auto object-contain mx-auto"
                />
              </Link>
            </div>

            <div className="mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-1.5 mb-2.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wider uppercase">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Patient &amp; Pharmacy Portal
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Sign in to manage prescriptions, orders, and 24/7 doctor consults.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* EMAIL INPUT */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                    Email Address
                  </Label>
                  {isEmailValid && emailTouched && (
                    <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                      Valid format
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Mail
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                      emailError
                        ? "text-destructive"
                        : isEmailValid
                        ? "text-emerald-500"
                        : "text-muted-foreground"
                    }`}
                    aria-hidden="true"
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    maxLength={120}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (!emailTouched) setEmailTouched(true);
                    }}
                    onBlur={() => setEmailTouched(true)}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "email-error" : undefined}
                    className={`pl-10 h-12 rounded-xl text-base sm:text-sm transition-all ${
                      emailError
                        ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive bg-destructive/5"
                        : isEmailValid && emailTouched
                        ? "border-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-visible:ring-primary/20 focus-visible:border-primary"
                    }`}
                    required
                    data-testid="login-email"
                  />
                </div>
                {emailError && (
                  <p
                    id="email-error"
                    role="alert"
                    className="text-xs font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in-50 duration-200"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* PASSWORD INPUT */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:underline py-0.5 inline-block"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                      passwordError ? "text-destructive" : "text-muted-foreground"
                    }`}
                    aria-hidden="true"
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    maxLength={128}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (!passwordTouched) setPasswordTouched(true);
                    }}
                    onBlur={() => {
                      setPasswordTouched(true);
                      setCapsLockOn(false);
                    }}
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
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? "password-error" : undefined}
                    className={`pl-10 pr-12 h-12 rounded-xl text-base sm:text-sm tabular-nums transition-all ${
                      passwordError
                        ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive bg-destructive/5"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-visible:ring-primary/20 focus-visible:border-primary"
                    }`}
                    required
                    data-testid="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-90"
                    aria-label={showPassword ? "Hide password text" : "Show password text"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {capsLockOn && (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                    <ArrowUpSquare className="h-3.5 w-3.5" aria-hidden="true" />
                    Caps Lock is ON
                  </p>
                )}
                {passwordError && (
                  <p
                    id="password-error"
                    role="alert"
                    className="text-xs font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {passwordError}
                  </p>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:shadow-none disabled:cursor-not-allowed"
                disabled={loading}
                data-testid="login-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Signing In...
                  </>
                ) : (
                  "Sign In to MedsZop"
                )}
              </Button>
            </form>

            {/* Google OAuth Divider */}
            <div className="relative my-5 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-medium tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Login Container */}
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme={isDark ? "filled_black" : "outline"}
                size="large"
                width="100%"
                text="signin_with"
                shape="rectangular"
              />
            </div>

            {/* Register Link Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have a MedsZop account?{" "}
                <Link
                  to="/register"
                  className="text-primary font-semibold hover:underline focus-visible:outline-none focus-visible:underline"
                  data-testid="register-link"
                >
                  Create free account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
