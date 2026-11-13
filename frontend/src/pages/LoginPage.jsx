import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { LanguageSelector } from "../components/LanguageSelector";
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
  ArrowUpSquare,
  Clock,
  Shield,
  BadgeCheck,
  PhoneCall
} from "lucide-react";
import { toast } from "sonner";

const LoginPage = () => {
  const { t } = useTranslation(['auth', 'common']);
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
  const emailError =
    emailTouched && email.trim().length > 0 && !isEmailValid
      ? "Please enter a valid email address (e.g. name@example.com)"
      : emailTouched && email.trim().length === 0
      ? "Email address is required"
      : null;

  const passwordError =
    passwordTouched && password.length === 0 ? "Password is required" : null;

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
      toast.success("Welcome back to MedsZop!");
      navigateByRole(user);
    } catch (error) {
      const isNetworkErr =
        error?.message?.includes("Network Error") || error?.code === "ERR_NETWORK";
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
      toast.success("Welcome back to MedsZop!");
      navigateByRole(user);
    } catch (error) {
      const msg = typeof error === "string" ? error : error?.message;
      if (msg && msg.includes("No account found")) {
        toast.custom(
          () => (
            <div className="flex flex-col items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 px-7 py-6 w-[min(340px,calc(100vw-32px))]">
              <div className="h-11 w-11 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
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
                className="w-full bg-[#046A47] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#035438] transition-all shadow-sm"
              >
                Go to Sign Up
              </button>
            </div>
          ),
          { position: "top-center", duration: 6000 }
        );
      } else {
        toast.error(msg || "Google login failed. Please try standard sign in.");
      }
    }
  };

  const handleGoogleError = () => {
    toast.error("Google authentication encountered an error. Please try again.");
  };

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] w-full flex flex-col lg:flex-row bg-[#FAFBF9] dark:bg-[#080E0B] text-foreground selection:bg-[#046A47]/20 lg:overflow-hidden">
      {/* ================= LEFT EDITORIAL HERO PANEL (Desktop) ================= */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[52%] 2xl:w-[55%] relative lg:h-full flex-col justify-between p-8 xl:p-12 2xl:p-14 bg-[#061A13] text-white overflow-hidden border-r border-[#0E2E22]">
        {/* Subtle Ambient Illumination */}
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
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] rounded-xl group transition-all"
            aria-label="MedsZop Home"
          >
            <img
              src="https://res.cloudinary.com/dih1im0zi/image/upload/v1771198740/medszoplogo_hjhsxv.svg"
              alt="MedsZop Logo"
              className="h-10 w-auto object-contain brightness-0 invert group-hover:opacity-90 transition-opacity"
            />
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#93B4A6] hover:text-white transition-colors px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to store
          </Link>
        </div>

        {/* Center Editorial Narrative */}
        <div className="relative z-10 max-w-xl my-auto py-4 xl:py-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B2C20] border border-[#144A36] text-[#6EE7B7] text-xs font-semibold mb-4 xl:mb-5 tracking-wide shadow-sm">
            <BadgeCheck className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
            Licensed Indian Healthcare Ecosystem
          </div>

          <h1 className="font-heading text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight text-white leading-[1.18]">
            Restoring trust in medicine, from prescription to doorstep.
          </h1>

          <p className="mt-3.5 text-sm xl:text-base text-[#9EBAAE] leading-relaxed">
            Direct delivery from licensed neighborhood pharmacies, batch-traceable
            pharmaceuticals, and qualified doctor consultations.
          </p>

          {/* Three Clinical Proof Points */}
          <div className="grid grid-cols-1 gap-3 xl:gap-3.5 mt-5 xl:mt-8 pt-5 xl:pt-8 border-t border-white/10">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0B2E21] border border-[#144F38] text-[#34D399] flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Temperature-Aware Packaging</h2>
                <p className="text-xs text-[#8BAAA0] mt-0.5 leading-relaxed">
                  Insulated transit packaging supporting medication integrity and quality.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0B2E21] border border-[#144F38] text-[#34D399] flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Verifiable Batch Traceability</h2>
                <p className="text-xs text-[#8BAAA0] mt-0.5 leading-relaxed">
                  Direct pharmacy sourcing with barcode tamper-evident packaging.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0B2E21] border border-[#144F38] text-[#34D399] flex items-center justify-center shrink-0">
                <PhoneCall className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Qualified Healthcare Consultations</h2>
                <p className="text-xs text-[#8BAAA0] mt-0.5 leading-relaxed">
                  Qualified doctors and clinical pharmacists available for prescription reviews.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Security Assurance */}
        <div className="relative z-10 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#789A8F]">
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
            Verified Pharmacy Sourcing &amp; Prescription Standards
          </span>
          <span className="font-mono text-[#5B7C72]">TLS Encryption • Data Privacy Standard</span>
        </div>
      </div>

      {/* ================= RIGHT FORM PANEL ================= */}
      <div className="w-full lg:w-[50%] xl:w-[48%] 2xl:w-[45%] min-h-[100dvh] lg:min-h-0 lg:h-full flex flex-col justify-between p-6 sm:p-8 lg:px-8 lg:py-6 xl:px-12 xl:py-8 relative overflow-y-auto">
        {/* Desktop Top Bar */}
        <div className="hidden lg:flex items-center justify-between w-full mb-1">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t("common:actions.back")}
          </Link>
          <LanguageSelector variant="navbar" />
        </div>

        {/* Mobile & Tablet Header */}
        <div className="flex items-center justify-between w-full lg:hidden mb-4">
          <Link to="/" className="inline-block">
            <img
              src="https://res.cloudinary.com/dih1im0zi/image/upload/v1771198740/medszoplogo_hjhsxv.svg"
              alt="MedsZop Logo"
              className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSelector variant="navbar" />
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {t("common:actions.back")}
            </Link>
          </div>
        </div>

        {/* Form Container (Optimal measure ~420px for readability) */}
        <div className="w-full max-w-[420px] xl:max-w-[440px] mx-auto my-auto py-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Form Header */}
            <div className="mb-5 sm:mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#046A47]/10 dark:bg-[#046A47]/20 text-[#046A47] dark:text-[#34D399] text-xs font-semibold tracking-wide uppercase mb-2.5">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                MedsZop Care Identity
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {t("auth:login.title")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {t("auth:login.subtitle")}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* EMAIL FIELD */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                    {t("auth:login.email_label")}
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
                        : isEmailValid && emailTouched
                        ? "text-emerald-600 dark:text-emerald-400"
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
                    className={`pl-10 h-12 rounded-xl text-base sm:text-sm transition-all bg-white dark:bg-[#0F1714] ${
                      emailError
                        ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive bg-destructive/5"
                        : isEmailValid && emailTouched
                        ? "border-emerald-600 dark:border-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600"
                        : "border-slate-200 dark:border-[#1E2E27] hover:border-slate-300 dark:hover:border-[#2C4238] focus-visible:ring-[#046A47]/20 focus-visible:border-[#046A47]"
                    }`}
                    required
                    data-testid="login-email"
                  />
                </div>
                {emailError && (
                  <p
                    id="email-error"
                    role="alert"
                    className="text-xs font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in-50 duration-150"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* PASSWORD FIELD */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  {t("auth:login.password_label")}
                </Label>

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
                    placeholder="••••••••••••"
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
                    className={`pl-10 pr-12 h-12 rounded-xl text-base sm:text-sm tabular-nums transition-all bg-white dark:bg-[#0F1714] ${
                      passwordError
                        ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive bg-destructive/5"
                        : "border-slate-200 dark:border-[#1E2E27] hover:border-slate-300 dark:hover:border-[#2C4238] focus-visible:ring-[#046A47]/20 focus-visible:border-[#046A47]"
                    }`}
                    required
                    data-testid="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#046A47] active:scale-90"
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
                    {t("auth:login.caps_lock_on")}
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

                {/* Forgot Password Link - positioned directly below password input, right-aligned */}
                <div className="flex justify-end pt-1">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-[#046A47] dark:text-[#34D399] hover:underline focus-visible:outline-none focus-visible:underline py-0.5 inline-block transition-colors"
                  >
                    {t("auth:login.forgot_password")}
                  </Link>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-semibold text-base bg-[#046A47] hover:bg-[#035438] text-white shadow-md shadow-[#046A47]/20 transition-all active:scale-[0.99] disabled:shadow-none disabled:cursor-not-allowed mt-2.5"
                disabled={loading}
                data-testid="login-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    {t("auth:login.signing_in")}
                  </>
                ) : (
                  t("auth:login.sign_in_btn")
                )}
              </Button>
            </form>

            {/* Google OAuth Divider */}
            <div className="relative my-4 sm:my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-[#1E2E27]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#FAFBF9] dark:bg-[#080E0B] px-3 text-muted-foreground font-medium tracking-wider">
                  {t("auth:login.or_continue_with")}
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
                width="380"
                text="signin_with"
                shape="rectangular"
              />
            </div>

            {/* Create Account Link Footer */}
            <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-200/80 dark:border-[#1E2E27] text-center">
              <p className="text-sm text-muted-foreground">
                {t("login.no_account", "Don't have a MedsZop account?")}{" "}
                <Link
                  to="/register"
                  className="text-[#046A47] dark:text-[#34D399] font-semibold hover:underline focus-visible:outline-none focus-visible:underline ml-1"
                  data-testid="register-link"
                >
                  {t("login.create_account", "Create account")}
                </Link>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Footer Security Note */}
        <div className="w-full max-w-[420px] xl:max-w-[440px] mx-auto text-center pt-2 pb-1 shrink-0">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#046A47] dark:text-[#34D399]" aria-hidden="true" />
            Protected by TLS encryption &amp; standard healthcare privacy controls
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
