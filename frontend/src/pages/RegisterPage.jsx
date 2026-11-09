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
  Zap,
  Sparkles,
  HeartHandshake,
  KeyRound,
  RotateCcw,
  ArrowUpSquare,
  X
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

  // Hardened Escape key listener and body scroll lock for OTP modal
  useEffect(() => {
    if (otpSent) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e) => {
        if (e.key === "Escape" && !otpLoading) {
          setOtpSent(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [otpSent, otpLoading]);

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
        return { score: 1, label: "Weak (add numbers & mix cases)", color: "bg-rose-500", text: "text-rose-500" };
      case 2:
        return { score: 2, label: "Fair (add special characters)", color: "bg-amber-500", text: "text-amber-500" };
      case 3:
        return { score: 3, label: "Good (add symbols)", color: "bg-blue-500", text: "text-blue-500" };
      case 4:
        return { score: 4, label: "Strong & secure password", color: "bg-emerald-500", text: "text-emerald-500" };
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
      const isNetworkErr = error?.message?.includes("Network Error") || error?.code === "ERR_NETWORK";
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
      const isNetworkErr = error?.message?.includes("Network Error") || error?.code === "ERR_NETWORK";
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
            <div className="flex flex-col items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 px-7 py-6 w-[340px]">
              <div className="h-11 w-11 rounded-full bg-blue-500/10 text-primary flex items-center justify-center">
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
                className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-sm"
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
            {/* Tech Glow Overlay */}
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
                Join 50,000+ Verified Patients
              </div>

              <h2 className="font-heading text-3xl font-bold tracking-tight text-white leading-snug">
                Your health ecosystem, built for precision care.
              </h2>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4 my-8 relative z-10">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Zap className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">Hyperlocal Dispatch</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Routed directly from your verified neighborhood pharmacy for 28m delivery.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">Smart Pill Reminders</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    AI-powered dosage reminders and automated refills for chronic therapies.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">Licensed Pharmacist Review</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Every order is double-checked by a registered pharmacist before departure.
                  </p>
                </div>
              </div>
            </div>

            {/* Editorial Testimonial Accent */}
            <div className="border-t border-slate-800/80 pt-5 relative z-10">
              <p className="font-accent italic text-xs text-slate-300 leading-relaxed">
                &ldquo;Creating an account takes less than 2 minutes and guarantees authentic, tamper-proof medication.&rdquo;
              </p>
              <p className="text-[11px] font-semibold text-cyan-400 mt-1.5">
                MedsZop Clinical Quality Board
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

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 mb-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wider uppercase">
                Step 1 of 2 · Account Info
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Create your account
              </h1>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Fast medicine deliveries, digital prescriptions, and AI health guidance.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* FULL NAME */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="name" className="text-sm font-semibold text-foreground">
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
                        ? "text-emerald-500"
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
                    className={`pl-10 h-11 sm:h-12 rounded-xl text-base sm:text-sm transition-all ${
                      touched.name && !isNameValid
                        ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive bg-destructive/5"
                        : isNameValid && touched.name
                        ? "border-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-visible:ring-primary/20 focus-visible:border-primary"
                    }`}
                    required
                    data-testid="register-name"
                  />
                </div>
                {touched.name && !isNameValid && (
                  <p id="name-error" role="alert" className="text-xs font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Please enter your name (at least 2 characters)
                  </p>
                )}
              </div>

              {/* EMAIL & PHONE GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* EMAIL */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="email" className="text-sm font-semibold text-foreground">
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
                      value={formData.email}
                      onChange={(e) => {
                        handleChange("email", e.target.value);
                        if (!touched.email) setTouched((prev) => ({ ...prev, email: true }));
                      }}
                      onBlur={() => handleBlur("email")}
                      aria-invalid={touched.email && !isEmailValid}
                      aria-describedby={touched.email && !isEmailValid ? "email-error" : undefined}
                      className={`pl-10 h-11 sm:h-12 rounded-xl text-base sm:text-sm transition-all ${
                        touched.email && !isEmailValid
                          ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive bg-destructive/5"
                          : isEmailValid && touched.email
                          ? "border-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-visible:ring-primary/20 focus-visible:border-primary"
                      }`}
                      required
                      data-testid="register-email"
                    />
                  </div>
                  {touched.email && !isEmailValid && (
                    <p id="email-error" role="alert" className="text-xs font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      Valid email required
                    </p>
                  )}
                </div>

                {/* PHONE */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="phone" className="text-sm font-semibold text-foreground">
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
                          ? "text-emerald-500"
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
                        // Smart paste support: handle +91 prefix or leading 0
                        if (digits.length === 12 && digits.startsWith("91")) {
                          digits = digits.slice(2);
                        } else if (digits.length > 10 && digits.startsWith("0")) {
                          digits = digits.slice(1);
                        }
                        const cleaned = digits.slice(0, 10);
                        handleChange("phone", cleaned);
                        if (!touched.phone) setTouched((prev) => ({ ...prev, phone: true }));
                      }}
                      onBlur={() => handleBlur("phone")}
                      aria-invalid={touched.phone && !isPhoneValid}
                      aria-describedby={touched.phone && !isPhoneValid ? "phone-error" : undefined}
                      className={`pl-10 h-11 sm:h-12 rounded-xl text-base sm:text-sm tabular-nums transition-all ${
                        touched.phone && !isPhoneValid
                          ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive bg-destructive/5"
                          : isPhoneValid && touched.phone
                          ? "border-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-visible:ring-primary/20 focus-visible:border-primary"
                      }`}
                      required
                      data-testid="register-phone"
                    />
                  </div>
                  {touched.phone && !isPhoneValid && (
                    <p id="phone-error" role="alert" className="text-xs font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      10-digit mobile required
                    </p>
                  )}
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                    Password
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
                    placeholder="Create a secure password"
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
                    className={`pl-10 pr-12 h-11 sm:h-12 rounded-xl text-base sm:text-sm tabular-nums transition-all ${
                      touched.password && !isPasswordLengthValid
                        ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive bg-destructive/5"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-visible:ring-primary/20 focus-visible:border-primary"
                    }`}
                    required
                    data-testid="register-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-90"
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

                {/* Password Strength Meter */}
                {formData.password.length > 0 && (
                  <div className="space-y-1 pt-1" id="password-rules">
                    <div className="grid grid-cols-4 gap-1.5 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : "bg-slate-200 dark:bg-slate-800"}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : "bg-slate-200 dark:bg-slate-800"}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : "bg-slate-200 dark:bg-slate-800"}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 4 ? strength.color : "bg-slate-200 dark:bg-slate-800"}`} />
                    </div>
                  </div>
                )}
                {touched.password && !isPasswordLengthValid && (
                  <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Minimum 6 characters required
                  </p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
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
                        ? "text-emerald-500"
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
                      if (!touched.confirmPassword) setTouched((prev) => ({ ...prev, confirmPassword: true }));
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
                    aria-describedby={touched.confirmPassword && !isPasswordMatching ? "confirm-error" : undefined}
                    className={`pl-10 pr-12 h-11 sm:h-12 rounded-xl text-base sm:text-sm tabular-nums transition-all ${
                      touched.confirmPassword && !isPasswordMatching
                        ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive bg-destructive/5"
                        : isPasswordMatching
                        ? "border-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-visible:ring-primary/20 focus-visible:border-primary"
                    }`}
                    required
                    data-testid="register-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-90"
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
                  <p id="confirm-error" role="alert" className="text-xs font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* TERMS STATEMENT */}
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                By creating an account, you agree to MedsZop&apos;s{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:shadow-none disabled:cursor-not-allowed"
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
            <div className="relative my-5 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-medium tracking-wider">
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
                width="100%"
                text="signup_with"
                shape="rectangular"
                use_fedcm_for_prompt={false}
              />
            </div>

            {/* Link to Login */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-sm text-muted-foreground">
                Already registered with MedsZop?{" "}
                <Link
                  to="/login"
                  className="text-primary font-semibold hover:underline focus-visible:outline-none focus-visible:underline"
                  data-testid="login-link"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================= OTP VERIFICATION MODAL ================= */}
      <AnimatePresence>
        {otpSent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="bg-card rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-2xl space-y-6 relative">
                {/* Close Modal Button */}
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95"
                  aria-label="Close verification modal"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>

                <div className="text-center">
                  <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <KeyRound className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                    Verify Email Address
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    We sent a 6-digit confirmation code to{" "}
                    <span className="font-semibold text-foreground block mt-0.5">
                      {formData.email}
                    </span>
                  </p>
                </div>

                {/* 6-DIGIT OTP INPUTS */}
                <div className="space-y-2">
                  <div className="flex justify-center gap-1.5 sm:gap-2.5" onPaste={handleOtpPaste}>
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
                        className="w-9 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-2xl font-mono font-bold rounded-xl border-2 border-slate-200 dark:border-slate-800 
                          focus:border-primary focus:ring-4 focus:ring-primary/15 focus:scale-[1.04] outline-none tabular-nums
                          transition-all bg-slate-50 dark:bg-slate-900 text-foreground"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* VERIFY BUTTON */}
                <Button
                  onClick={handleVerifyOtp}
                  className="w-full h-12 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
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
                      Verify & Activate Account
                    </>
                  )}
                </Button>

                {/* RESEND & BACK NAVIGATION */}
                <div className="flex flex-col items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-xs text-muted-foreground">
                    Didn&apos;t receive the email code?{" "}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0}
                      className={`font-semibold inline-flex items-center gap-1 transition-all ${
                        resendTimer > 0
                          ? "text-muted-foreground cursor-not-allowed"
                          : "text-primary hover:underline cursor-pointer active:scale-95"
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegisterPage;
