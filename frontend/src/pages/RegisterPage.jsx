import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RotateCcw,
  ArrowUpSquare,
  BadgeCheck,
  Shield,
  Clock,
  Sparkles,
  Edit3
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Field touched states for accessible inline validation
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });

  const otpRefs = useRef([]);
  const { register, googleSignup } = useAuth();
  const navigate = useNavigate();

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Inline validation logic
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const isPhoneValid = /^[6-9]\d{9}$/.test(formData.phone.trim().replace(/\D/g, ""));
  const isNameValid = formData.name.trim().length >= 2;
  const isPasswordLengthValid = formData.password.length >= 6;
  const isPasswordMatching =
    formData.password.length > 0 && formData.password === formData.confirmPassword;

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "", color: "bg-slate-200 dark:bg-slate-800", text: "" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass) && /[a-zA-Z]/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Weak (mix in letters & numbers)", color: "bg-rose-500", text: "text-rose-500" };
      case 2:
        return { score: 2, label: "Fair (add special symbols)", color: "bg-amber-500", text: "text-amber-500" };
      case 3:
        return { score: 3, label: "Good (add capitalization & symbols)", color: "bg-blue-500", text: "text-blue-500" };
      case 4:
        return { score: 4, label: "Strong & secure password", color: "bg-emerald-600", text: "text-emerald-600 dark:text-emerald-400" };
      default:
        return { score: 0, label: "", color: "bg-slate-200 dark:bg-slate-800", text: "" };
    }
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("You are currently offline. Please check your internet connection.");
      return;
    }

    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    if (!isNameValid) {
      toast.error("Please enter your full name (at least 2 characters)");
      return;
    }
    if (!isEmailValid) {
      toast.error("Please provide a valid email address");
      return;
    }
    if (!isPhoneValid) {
      toast.error("Please provide a valid 10-digit Indian phone number");
      return;
    }
    if (!isPasswordLengthValid) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/send-otp`, { email: formData.email.trim() });
      setOtpSent(true);
      setResendTimer(60);
      toast.success("Security OTP sent to your email!");
    } catch (error) {
      const isNetworkErr =
        error?.message?.includes("Network Error") || error?.code === "ERR_NETWORK";
      const msg = isNetworkErr
        ? "Unable to connect to MedsZop servers. Please check your network connection."
        : error.response?.data?.message || "Failed to send verification OTP";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || "";
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      otpRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (otpLoading) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("You are currently offline. Please check your internet connection.");
      return;
    }

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    setOtpLoading(true);

    try {
      await axios.post(`${API_URL}/auth/verify-otp`, {
        email: formData.email.trim(),
        otp: otpString,
      });

      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
      });

      toast.success("Welcome to MedsZop! Account created successfully.");
      navigate("/dashboard");
    } catch (error) {
      const isNetworkErr =
        error?.message?.includes("Network Error") || error?.code === "ERR_NETWORK";
      const msg = isNetworkErr
        ? "Unable to verify code due to a network connection issue."
        : typeof error === "string"
        ? error
        : error.response?.data?.message || error.message || "Verification failed";
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || otpLoading) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("You are currently offline. Please check your internet connection.");
      return;
    }

    try {
      await axios.post(`${API_URL}/auth/send-otp`, { email: formData.email.trim() });
      setOtp(["", "", "", "", "", ""]);
      setResendTimer(60);
      toast.success("New OTP code dispatched to your email!");
      otpRefs.current[0]?.focus();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to resend OTP";
      toast.error(msg);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleSignup(credentialResponse.credential);
      toast.success("Welcome to MedsZop! Account created successfully.");
      navigate("/dashboard");
    } catch (error) {
      const msg = typeof error === "string" ? error : error?.message;
      if (msg && msg.includes("already exists")) {
        toast.custom(
          () => (
            <div className="flex flex-col items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 px-7 py-6 w-[min(340px,calc(100vw-32px))]">
              <div className="h-11 w-11 rounded-full bg-[#046A47]/10 text-[#046A47] flex items-center justify-center">
                <AlertCircle className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="text-sm text-center text-foreground font-medium">
                An account with this email already exists. Please sign in instead.
              </p>
              <button
                onClick={() => {
                  toast.dismiss();
                  navigate("/login");
                }}
                className="w-full bg-[#046A47] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#035438] transition-all shadow-sm"
              >
                Sign In
              </button>
            </div>
          ),
          { position: "top-center", duration: 6000 }
        );
      } else {
        toast.error(msg || "Google registration failed. Please try form sign-up.");
      }
    }
  };

  const handleGoogleError = () => {
    toast.error("Google sign-up failed. Please try again.");
  };

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
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#93B4A6] hover:text-white transition-colors px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to store
          </Link>
        </div>

        {/* Center Editorial Narrative */}
        <div className="relative z-10 max-w-xl my-auto py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B2C20] border border-[#144A36] text-[#6EE7B7] text-xs font-semibold mb-6 tracking-wide shadow-sm">
            <BadgeCheck className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
            Patient Care &amp; Healthcare Network
          </div>

          <h1 className="font-heading text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight text-white leading-[1.18]">
            Your personal pharmacy and dedicated clinical care network.
          </h1>

          <p className="mt-4 text-sm xl:text-base text-[#9EBAAE] leading-relaxed">
            Create your account to access digital prescription refills, doorstep medicine delivery,
            and direct consultation with qualified healthcare practitioners.
          </p>

          {/* Three Clinical Proof Points */}
          <div className="grid grid-cols-1 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0B2E21] border border-[#144F38] text-[#34D399] flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Hyperlocal Neighborhood Fulfillment</h2>
                <p className="text-xs text-[#8BAAA0] mt-0.5 leading-relaxed">
                  Routed directly from partner neighborhood chemists with protective delivery.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0B2E21] border border-[#144F38] text-[#34D399] flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Licensed Pharmacist Review</h2>
                <p className="text-xs text-[#8BAAA0] mt-0.5 leading-relaxed">
                  Every prescription order is reviewed by a qualified pharmacist before packaging.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#0B2E21] border border-[#144F38] text-[#34D399] flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white">Authentic Sourcing &amp; Traceable Batches</h2>
                <p className="text-xs text-[#8BAAA0] mt-0.5 leading-relaxed">
                  Direct manufacturer sourcing with tamper-evident digital seal verification on every box.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Security Assurance */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#789A8F]">
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
            Prescription Review &amp; Patient Safety Protocols
          </span>
          <span className="font-mono text-[#5B7C72]">Patient Data Sovereignty &amp; Confidentiality</span>
        </div>
      </div>

      {/* ================= RIGHT FORM PANEL (In-Place Flow) ================= */}
      <div className="w-full lg:w-[50%] xl:w-[48%] 2xl:w-[45%] min-h-screen flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-10 xl:p-14 2xl:p-16 relative">
        {/* Mobile & Tablet Header */}
        <div className="flex items-center justify-between w-full lg:hidden mb-6">
          <Link to="/" className="inline-block">
            <img
              src="https://res.cloudinary.com/dih1im0zi/image/upload/v1771198740/medszoplogo_hjhsxv.svg"
              alt="MedsZop Logo"
              className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back
          </Link>
        </div>

        {/* Form Container (Optimal measure ~420px for readability) */}
        <div className="w-full max-w-[420px] xl:max-w-[440px] mx-auto my-auto py-4">
          <AnimatePresence mode="wait">
            {!otpSent ? (
              /* ================= STEP 1: ACCOUNT REGISTRATION ================= */
              <motion.div
                key="step-register"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {/* Header */}
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#046A47]/10 dark:bg-[#046A47]/20 text-[#046A47] dark:text-[#34D399] text-xs font-semibold tracking-wide uppercase mb-3">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Step 1 of 2 · Account Info
                  </div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Create your account
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Timely medicine deliveries, digital prescriptions, and doctor consultations.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                  {/* FULL NAME */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                        Full Name
                      </Label>
                      {isNameValid && touched.name && (
                        <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                          Valid
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <User
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                          touched.name && !isNameValid
                            ? "text-destructive"
                            : isNameValid && touched.name
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                        aria-hidden="true"
                      />
                      <Input
                        id="name"
                        type="text"
                        autoComplete="name"
                        maxLength={80}
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => {
                          handleChange("name", e.target.value);
                          if (!touched.name) setTouched((prev) => ({ ...prev, name: true }));
                        }}
                        onBlur={() => handleBlur("name")}
                        aria-invalid={touched.name && !isNameValid}
                        aria-describedby={touched.name && !isNameValid ? "name-error" : undefined}
                        className={`pl-10 h-11 sm:h-12 rounded-xl text-base sm:text-sm transition-all bg-white dark:bg-[#0F1714] ${
                          touched.name && !isNameValid
                            ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive bg-destructive/5"
                            : isNameValid && touched.name
                            ? "border-emerald-600 dark:border-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600"
                            : "border-slate-200 dark:border-[#1E2E27] hover:border-slate-300 dark:hover:border-[#2C4238] focus-visible:ring-[#046A47]/20 focus-visible:border-[#046A47]"
                        }`}
                        required
                        data-testid="register-name"
                      />
                    </div>
                    {touched.name && !isNameValid && (
                      <p
                        id="name-error"
                        role="alert"
                        className="text-xs font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        Please enter your full name (at least 2 characters)
                      </p>
                    )}
                  </div>

                  {/* EMAIL & PHONE ROW */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* EMAIL */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                          Email Address
                        </Label>
                        {isEmailValid && touched.email && (
                          <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                            Valid
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Mail
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                            touched.email && !isEmailValid
                              ? "text-destructive"
                              : isEmailValid && touched.email
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
                          value={formData.email}
                          onChange={(e) => {
                            handleChange("email", e.target.value);
                            if (!touched.email) setTouched((prev) => ({ ...prev, email: true }));
                          }}
                          onBlur={() => handleBlur("email")}
                          aria-invalid={touched.email && !isEmailValid}
                          aria-describedby={touched.email && !isEmailValid ? "email-error" : undefined}
                          className={`pl-10 h-11 sm:h-12 rounded-xl text-base sm:text-sm transition-all bg-white dark:bg-[#0F1714] ${
                            touched.email && !isEmailValid
                              ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive bg-destructive/5"
                              : isEmailValid && touched.email
                              ? "border-emerald-600 dark:border-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600"
                              : "border-slate-200 dark:border-[#1E2E27] hover:border-slate-300 dark:hover:border-[#2C4238] focus-visible:ring-[#046A47]/20 focus-visible:border-[#046A47]"
                          }`}
                          required
                          data-testid="register-email"
                        />
                      </div>
                      {touched.email && !isEmailValid && (
                        <p
                          id="email-error"
                          role="alert"
                          className="text-xs font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150"
                        >
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          Valid email required
                        </p>
                      )}
                    </div>

                    {/* PHONE */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="phone" className="text-xs font-semibold text-foreground">
                          Phone Number
                        </Label>
                        {isPhoneValid && touched.phone && (
                          <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                            Valid
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Phone
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                            touched.phone && !isPhoneValid
                              ? "text-destructive"
                              : isPhoneValid && touched.phone
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }`}
                          aria-hidden="true"
                        />
                        <Input
                          id="phone"
                          type="tel"
                          autoComplete="tel"
                          maxLength={14}
                          placeholder="9876543210"
                          value={formData.phone}
                          onChange={(e) => {
                            let digits = e.target.value.replace(/\D/g, "");
                            if (digits.startsWith("91") && digits.length > 10) {
                              digits = digits.slice(2);
                            } else if (digits.startsWith("0") && digits.length > 10) {
                              digits = digits.slice(1);
                            }
                            const cleaned = digits.slice(0, 10);
                            handleChange("phone", cleaned);
                            if (!touched.phone) setTouched((prev) => ({ ...prev, phone: true }));
                          }}
                          onBlur={() => handleBlur("phone")}
                          aria-invalid={touched.phone && !isPhoneValid}
                          aria-describedby={touched.phone && !isPhoneValid ? "phone-error" : undefined}
                          className={`pl-10 h-11 sm:h-12 rounded-xl text-base sm:text-sm tabular-nums transition-all bg-white dark:bg-[#0F1714] ${
                            touched.phone && !isPhoneValid
                              ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive bg-destructive/5"
                              : isPhoneValid && touched.phone
                              ? "border-emerald-600 dark:border-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600"
                              : "border-slate-200 dark:border-[#1E2E27] hover:border-slate-300 dark:hover:border-[#2C4238] focus-visible:ring-[#046A47]/20 focus-visible:border-[#046A47]"
                          }`}
                          required
                          data-testid="register-phone"
                        />
                      </div>
                      {touched.phone && !isPhoneValid && (
                        <p
                          id="phone-error"
                          role="alert"
                          className="text-xs font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150"
                        >
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          10-digit mobile required
                        </p>
                      )}
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                        Create Password
                      </Label>
                      {strength.label && (
                        <span className={`text-xs font-medium ${strength.text}`}>
                          {strength.label}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                          touched.password && !isPasswordLengthValid
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                        aria-hidden="true"
                      />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        maxLength={128}
                        placeholder="At least 6 characters"
                        value={formData.password}
                        onChange={(e) => {
                          handleChange("password", e.target.value);
                          if (!touched.password) setTouched((prev) => ({ ...prev, password: true }));
                        }}
                        onBlur={() => {
                          handleBlur("password");
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
                        aria-invalid={touched.password && !isPasswordLengthValid}
                        aria-describedby="password-rules"
                        className={`pl-10 pr-12 h-11 sm:h-12 rounded-xl text-base sm:text-sm tabular-nums transition-all bg-white dark:bg-[#0F1714] ${
                          touched.password && !isPasswordLengthValid
                            ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive bg-destructive/5"
                            : "border-slate-200 dark:border-[#1E2E27] hover:border-slate-300 dark:hover:border-[#2C4238] focus-visible:ring-[#046A47]/20 focus-visible:border-[#046A47]"
                        }`}
                        required
                        data-testid="register-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#046A47] active:scale-90"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    {capsLockOn && (
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1 animate-in fade-in-50">
                        <ArrowUpSquare className="h-3.5 w-3.5" aria-hidden="true" />
                        Caps Lock is ON
                      </p>
                    )}

                    {/* 4-bar Password Strength Indicator */}
                    {formData.password.length > 0 && (
                      <div className="space-y-1 pt-1" id="password-rules">
                        <div className="grid grid-cols-4 gap-1.5 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              strength.score >= 1 ? strength.color : "bg-slate-200 dark:bg-slate-800"
                            }`}
                          />
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              strength.score >= 2 ? strength.color : "bg-slate-200 dark:bg-slate-800"
                            }`}
                          />
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              strength.score >= 3 ? strength.color : "bg-slate-200 dark:bg-slate-800"
                            }`}
                          />
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              strength.score >= 4 ? strength.color : "bg-slate-200 dark:bg-slate-800"
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {touched.password && !isPasswordLengthValid && (
                      <p
                        role="alert"
                        className="text-xs font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        Minimum 6 characters required
                      </p>
                    )}
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-xs font-semibold text-foreground"
                      >
                        Confirm Password
                      </Label>
                      {isPasswordMatching && (
                        <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                          Passwords match
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                          touched.confirmPassword && !isPasswordMatching
                            ? "text-destructive"
                            : isPasswordMatching
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                        aria-hidden="true"
                      />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        maxLength={128}
                        placeholder="Repeat password"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          handleChange("confirmPassword", e.target.value);
                          if (!touched.confirmPassword)
                            setTouched((prev) => ({ ...prev, confirmPassword: true }));
                        }}
                        onBlur={() => {
                          handleBlur("confirmPassword");
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
                        aria-invalid={touched.confirmPassword && !isPasswordMatching}
                        aria-describedby={
                          touched.confirmPassword && !isPasswordMatching ? "confirm-error" : undefined
                        }
                        className={`pl-10 pr-12 h-11 sm:h-12 rounded-xl text-base sm:text-sm tabular-nums transition-all bg-white dark:bg-[#0F1714] ${
                          touched.confirmPassword && !isPasswordMatching
                            ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive bg-destructive/5"
                            : isPasswordMatching
                            ? "border-emerald-600 dark:border-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600"
                            : "border-slate-200 dark:border-[#1E2E27] hover:border-slate-300 dark:hover:border-[#2C4238] focus-visible:ring-[#046A47]/20 focus-visible:border-[#046A47]"
                        }`}
                        required
                        data-testid="register-confirm-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#046A47] active:scale-90"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {formData.confirmPassword && !isPasswordMatching && (
                      <p
                        id="confirm-error"
                        role="alert"
                        className="text-xs font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  {/* TERMS STATEMENT */}
                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                    By creating an account, you agree to MedsZop&apos;s{" "}
                    <Link
                      to="/terms"
                      className="text-[#046A47] dark:text-[#34D399] font-medium hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy-policy"
                      className="text-[#046A47] dark:text-[#34D399] font-medium hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>

                  {/* SUBMIT BUTTON */}
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-semibold text-base bg-[#046A47] hover:bg-[#035438] text-white shadow-md shadow-[#046A47]/20 transition-all active:scale-[0.99] disabled:shadow-none disabled:cursor-not-allowed mt-1"
                    disabled={loading || (formData.confirmPassword && !isPasswordMatching)}
                    data-testid="register-submit"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                        Sending Verification Code...
                      </>
                    ) : (
                      "Continue to Email Verification"
                    )}
                  </Button>
                </form>

                {/* Google OAuth Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-[#1E2E27]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#FAFBF9] dark:bg-[#080E0B] px-3 text-muted-foreground font-medium tracking-wider">
                      Or sign up with
                    </span>
                  </div>
                </div>

                {/* Google Signup Button */}
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme={isDark ? "filled_black" : "outline"}
                    size="large"
                    width="380"
                    text="signup_with"
                    shape="rectangular"
                  />
                </div>

                {/* Link to Login */}
                <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-[#1E2E27] text-center">
                  <p className="text-sm text-muted-foreground">
                    Already registered with MedsZop?{" "}
                    <Link
                      to="/login"
                      className="text-[#046A47] dark:text-[#34D399] font-semibold hover:underline focus-visible:outline-none focus-visible:underline"
                      data-testid="login-link"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </motion.div>
            ) : (
              /* ================= STEP 2: IN-PLACE OTP VERIFICATION ================= */
              <motion.div
                key="step-otp"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-6"
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#046A47]/10 dark:bg-[#046A47]/20 text-[#046A47] dark:text-[#34D399] text-xs font-semibold tracking-wide uppercase mb-3">
                    <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                    Step 2 of 2 · Security Verification
                  </div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Verify email address
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    We sent a 6-digit confirmation code to:
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0F1714] border border-slate-200 dark:border-[#1E2E27] text-xs font-semibold text-foreground">
                    <span>{formData.email}</span>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[#046A47] dark:text-[#34D399] hover:underline flex items-center gap-1 ml-1"
                      title="Edit email address"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </button>
                  </div>
                </div>

                {/* 6-Digit OTP Cells */}
                <div className="space-y-2">
                  <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        aria-label={`Digit ${index + 1} of 6`}
                        className="w-10 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-2xl font-mono font-bold rounded-xl border-2 border-slate-200 dark:border-[#1E2E27] 
                          focus:border-[#046A47] focus:ring-4 focus:ring-[#046A47]/15 focus:scale-[1.03] outline-none tabular-nums
                          transition-all bg-white dark:bg-[#0F1714] text-foreground"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Verify Button */}
                <Button
                  onClick={handleVerifyOtp}
                  className="w-full h-12 rounded-xl font-semibold text-base bg-[#046A47] hover:bg-[#035438] text-white shadow-md shadow-[#046A47]/20 transition-all active:scale-[0.99] disabled:shadow-none disabled:cursor-not-allowed"
                  disabled={otpLoading || otp.join("").length !== 6}
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                      Verifying Code...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5 mr-2" aria-hidden="true" />
                      Verify &amp; Activate Account
                    </>
                  )}
                </Button>

                {/* Resend and back navigation */}
                <div className="flex flex-col items-center gap-3 pt-3 border-t border-slate-200/80 dark:border-[#1E2E27] text-center">
                  <p className="text-xs text-muted-foreground">
                    Didn&apos;t receive the email code?{" "}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0}
                      className={`font-semibold inline-flex items-center gap-1 transition-all ${
                        resendTimer > 0
                          ? "text-muted-foreground cursor-not-allowed"
                          : "text-[#046A47] dark:text-[#34D399] hover:underline cursor-pointer active:scale-95"
                      }`}
                    >
                      {resendTimer > 0 ? (
                        `Resend code in ${resendTimer}s`
                      ) : (
                        <>
                          <RotateCcw className="h-3 w-3" aria-hidden="true" />
                          Resend OTP Code
                        </>
                      )}
                    </button>
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp(["", "", "", "", "", ""]);
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-foreground transition-all active:scale-95 inline-flex items-center gap-1"
                  >
                    ← Edit registration details
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

export default RegisterPage;
