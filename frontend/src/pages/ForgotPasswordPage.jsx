import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../components/LanguageSelector";
import {
  Loader2,
  ArrowLeft,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  BadgeCheck,
  Shield,
  Clock,
  Sparkles,
  ArrowUpSquare
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";

const API_URL = import.meta.env.VITE_API_URL;

const ForgotPasswordPage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email: email.trim() });
      toast.success("Verification code sent to your email");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/verify-reset-otp`, { email: email.trim(), otp: otp.trim() });
      toast.success("Code verified successfully");
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        email: email.trim(),
        otp: otp.trim(),
        newPassword
      });
      toast.success("Password reset successfully. You can now sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: "Email" },
    { num: 2, title: "Verify Code" },
    { num: 3, title: "New Password" }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAFBF9] dark:bg-[#080E0B] text-foreground selection:bg-[#046A47]/20">
      {/* ================= LEFT EDITORIAL HERO PANEL (Desktop) ================= */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[52%] 2xl:w-[55%] relative min-h-screen flex-col justify-between p-10 xl:p-14 2xl:p-16 bg-[#061A13] text-white overflow-hidden border-r border-[#0E2E22]">
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
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#93B4A6] hover:text-white transition-colors px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to login
          </Link>
        </div>

        {/* Center Editorial Narrative */}
        <div className="relative z-10 max-w-xl my-auto py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B2C20] border border-[#144A36] text-[#6EE7B7] text-xs font-semibold mb-6 tracking-wide shadow-sm">
            <BadgeCheck className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
            Account Recovery &amp; Security Shield
          </div>

          <h1 className="font-heading text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight text-white leading-[1.18]">
            Secure patient account recovery and identity verification.
          </h1>

          <p className="mt-4 text-sm xl:text-base text-[#9EBAAE] leading-relaxed">
            Protecting your confidential medical records, prescriptions, and health history with multi-factor
            cryptographic authorization.
          </p>

          {/* Three Clinical Proof Points */}
          <div className="grid grid-cols-1 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0B2E21] border border-[#144F38] text-[#34D399] flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Instant One-Time Code Delivery</h2>
                <p className="text-xs text-[#8BAAA0] mt-0.5 leading-relaxed">
                  Time-bounded 6-digit security token delivered immediately to your registered patient email.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0B2E21] border border-[#144F38] text-[#34D399] flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Unauthorized Access Prevention</h2>
                <p className="text-xs text-[#8BAAA0] mt-0.5 leading-relaxed">
                  Sessions are immediately revoked across all unauthorized devices upon password reset.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0B2E21] border border-[#144F38] text-[#34D399] flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Encrypted Patient Credential Storage</h2>
                <p className="text-xs text-[#8BAAA0] mt-0.5 leading-relaxed">
                  Bcrypt salted password hashes stored behind strict healthcare isolation firewalls.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Security Assurance */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#789A8F]">
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
            TLS Protected Healthcare Security Controls
          </span>
          <span className="font-mono text-[#5B7C72]">MedsZop Auth Guard</span>
        </div>
      </div>

      {/* ================= RIGHT FORM PANEL ================= */}
      <div className="w-full lg:w-[50%] xl:w-[48%] 2xl:w-[45%] min-h-screen flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-10 xl:p-14 2xl:p-16 relative">
        {/* Desktop Top Bar */}
        <div className="hidden lg:flex items-center justify-between w-full mb-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t("auth:forgot_password.back_to_login")}
          </Link>
          <LanguageSelector variant="navbar" />
        </div>

        {/* Mobile Header */}
        <div className="flex items-center justify-between w-full lg:hidden mb-6">
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
              to="/login"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {t("auth:forgot_password.back_to_login")}
            </Link>
          </div>
        </div>

        {/* Form Container (Optimal measure ~420px for readability) */}
        <div className="w-full max-w-[420px] xl:max-w-[440px] mx-auto my-auto py-4">
          <Card
            className="border-none shadow-none bg-transparent p-0"
            data-testid="forgot-password-card"
          >
            <CardContent className="p-0 space-y-6">
              {/* Step Progress Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1E2E27]">
                {steps.map((s, idx) => (
                  <div key={s.num} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                          step === s.num
                            ? "bg-[#046A47] text-white shadow-sm"
                            : step > s.num
                            ? "bg-[#046A47] text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                        }`}
                      >
                        {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                      </div>
                      <span className="text-[10px] font-semibold mt-1 text-muted-foreground whitespace-nowrap">
                        {s.title}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 mb-4 transition-colors ${
                          step > s.num ? "bg-[#046A47]" : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Heading & Subtitle */}
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#046A47]/10 dark:bg-[#046A47]/20 text-[#046A47] dark:text-[#34D399] text-xs font-semibold tracking-wide uppercase">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Account Recovery
                </div>
                <h2
                  className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
                  data-testid="forgot-password-title"
                >
                  {step === 1 && t("auth:forgot_password.title")}
                  {step === 2 && t("auth:forgot_password.step2_title")}
                  {step === 3 && t("auth:forgot_password.step3_title")}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step === 1 && t("auth:forgot_password.subtitle")}
                  {step === 2 && t("auth:forgot_password.step2_subtitle")}
                  {step === 3 && t("auth:forgot_password.step3_subtitle")}
                </p>
              </div>

              {/* Step 1: Email Form */}
              {step === 1 && (
                <form className="space-y-4" onSubmit={handleSendOTP} noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-email" className="text-xs font-semibold text-foreground">
                      {t("auth:login.email_label")}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="pl-10 h-12 rounded-xl text-base sm:text-sm bg-white dark:bg-[#0F1714] border-slate-200 dark:border-[#1E2E27] focus-visible:ring-[#046A47]/20 focus-visible:border-[#046A47]"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                        data-testid="forgot-password-email-input"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-semibold text-base bg-[#046A47] hover:bg-[#035438] text-white shadow-md shadow-[#046A47]/20 transition-all active:scale-[0.99]"
                    disabled={loading || !email.trim()}
                    data-testid="forgot-password-send-otp-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        {t("auth:forgot_password.sending")}
                      </>
                    ) : (
                      t("auth:forgot_password.send_code_btn")
                    )}
                  </Button>
                </form>
              )}

              {/* Step 2: OTP Verification */}
              {step === 2 && (
                <form className="space-y-4" onSubmit={handleVerifyOTP} noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="otp-input" className="text-xs font-semibold text-foreground">
                      6-Digit Verification Code
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="otp-input"
                        type="text"
                        required
                        placeholder="••••••"
                        className="pl-10 h-12 rounded-xl tracking-widest text-center text-lg font-bold tabular-nums bg-white dark:bg-[#0F1714] border-slate-200 dark:border-[#1E2E27] focus-visible:ring-[#046A47]/20 focus-visible:border-[#046A47]"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        autoFocus
                        data-testid="forgot-password-otp-input"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-semibold text-base bg-[#046A47] hover:bg-[#035438] text-white shadow-md shadow-[#046A47]/20 transition-all active:scale-[0.99]"
                    disabled={loading || otp.length < 4}
                    data-testid="forgot-password-verify-otp-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Verifying Code...
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-[#046A47] dark:text-[#34D399] hover:underline font-semibold"
                      data-testid="forgot-password-resend-otp-btn"
                    >
                      ← Edit Email Address
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: New Password */}
              {step === 3 && (
                <form className="space-y-4" onSubmit={handleResetPassword} noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-xs font-semibold text-foreground">
                      {t("auth:forgot_password.new_password_label")}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        required
                        placeholder="At least 6 characters"
                        className="pl-10 pr-10 h-12 rounded-xl text-base sm:text-sm bg-white dark:bg-[#0F1714] border-slate-200 dark:border-[#1E2E27] focus-visible:ring-[#046A47]/20 focus-visible:border-[#046A47]"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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
                        autoFocus
                        data-testid="forgot-password-new-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password" className="text-xs font-semibold text-foreground">
                      {t("auth:forgot_password.confirm_new_password_label")}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="Re-enter your new password"
                        className="pl-10 pr-10 h-12 rounded-xl text-base sm:text-sm bg-white dark:bg-[#0F1714] border-slate-200 dark:border-[#1E2E27] focus-visible:ring-[#046A47]/20 focus-visible:border-[#046A47]"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                        data-testid="forgot-password-confirm-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {capsLockOn && (
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1 animate-in fade-in-50">
                      <ArrowUpSquare className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("auth:login.caps_lock_on")}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-semibold text-base bg-[#046A47] hover:bg-[#035438] text-white shadow-md shadow-[#046A47]/20 transition-all active:scale-[0.99]"
                    disabled={loading || !newPassword || !confirmPassword}
                    data-testid="forgot-password-submit-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        {t("auth:forgot_password.resetting")}
                      </>
                    ) : (
                      t("auth:forgot_password.reset_btn")
                    )}
                  </Button>
                </form>
              )}

              {/* Back to Login */}
              <div className="text-center pt-2 border-t border-slate-200/80 dark:border-[#1E2E27]">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center text-xs sm:text-sm font-semibold text-muted-foreground hover:text-[#046A47] dark:hover:text-[#34D399] transition-colors gap-1.5"
                  data-testid="forgot-password-back-to-login-btn"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Footer Security Note */}
        <div className="w-full max-w-[420px] xl:max-w-[440px] mx-auto text-center pt-4">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#046A47] dark:text-[#34D399]" aria-hidden="true" />
            Protected by TLS encryption &amp; standard healthcare privacy controls
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
