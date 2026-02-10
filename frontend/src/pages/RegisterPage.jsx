import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";

import {
  Pill,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  ArrowLeft,
  ShieldCheck,
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
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { t } = useTranslation();
    if (formData.password !== formData.confirmPassword) {
      toast.error(t("register.passwords_no_match"));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t("register.password_too_short"));
      return;
    }

    setLoading(true);

    try {
      // Send OTP to email before registering
      await axios.post(`${API_URL}/auth/send-otp`, { email: formData.email });
      setOtpSent(true);
      setResendTimer(60);
      toast.success(t("register.otp_sent"));
    } catch (error) {
      const msg = error.response?.data?.message || t("register.send_otp_error");
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

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error(t("register.otp_incomplete"));
      return;
    }

    setOtpLoading(true);

    try {
      // Verify OTP
      await axios.post(`${API_URL}/auth/verify-otp`, {
        email: formData.email,
        otp: otpString,
      });

      // OTP verified — now register
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      });

      toast.success(t("register.account_created"));
      navigate("/dashboard");
    } catch (error) {
      const msg = typeof error === "string" ? error : error.response?.data?.message || error.message || t("register.verification_failed");
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    try {
      await axios.post(`${API_URL}/auth/send-otp`, { email: formData.email });
      setOtp(["", "", "", "", "", ""]);
      setResendTimer(60);
      toast.success(t("register.otp_resent"));
    } catch (error) {
      const msg = error.response?.data?.message || t("register.resend_otp_error");
      toast.error(msg);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const user = await googleSignup(credentialResponse.credential);
      toast.success(t("register.account_created"));
      navigate("/dashboard");
    } catch (error) {
      const msg = typeof error === "string" ? error : error?.message;
      if (msg && msg.includes("already exists")) {
        toast.custom(() => (
          <div className="flex flex-col items-center gap-3 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border px-8 py-6 w-[340px]">
            <p className="text-sm text-center text-foreground font-medium">
              {t("register.account_exists")}
            </p>
            <button
              onClick={() => { toast.dismiss(); navigate("/login"); }}
              className="bg-primary text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t("register.sign_in")}
            </button>
          </div>
        ), { position: "top-center", duration: 5000 });
      } else {
        toast.error(msg || t("register.google_signup_failed"));
      }
    }
  };

  const handleGoogleError = () => {
    toast.error(t("register.google_signup_failed_retry"));
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 py-12">
      <div className="absolute top-4 left-4">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("register.back_to_home")}
          </Button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Pill className="h-7 w-7 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold text-foreground">
              {t("register.brand")}
            </span>
          </Link>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-heading text-2xl">
              {t("register.create_account")}
            </CardTitle>
            <CardDescription>{t("register.join_slogan")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("register.full_name")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder={t("register.name_placeholder")}
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="pl-10 h-12"
                    required
                    data-testid="register-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("register.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("register.email_placeholder")}
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="pl-10 h-12"
                    required
                    data-testid="register-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("register.phone")}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t("register.phone_placeholder")}
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="pl-10 h-12"
                    required
                    data-testid="register-phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("register.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("register.password_placeholder")}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="pl-10 h-12"
                    required
                    data-testid="register-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("register.confirm_password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t("register.confirm_password_placeholder")}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    className="pl-10 h-12"
                    required
                    data-testid="register-confirm-password"
                  />
                </div>
              </div>


              <Button
                type="submit"
                className="w-full h-12 rounded-xl"
                disabled={loading}
                data-testid="register-submit"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("register.create_account")
                )}
              </Button>
            </form>

            {/* Google OAuth Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("register.or_continue_with")}
                </span>
              </div>
            </div>

            {/* Google Sign-Up Button */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                width="100%"
                text="signup_with"
                shape="rectangular"
                use_fedcm_for_prompt={false}
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t("register.already_have_account")}{" "}
                <Link
                  to="/login"
                  className="text-primary font-medium hover:underline"
                  data-testid="login-link"
                >
                  {t("register.sign_in")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* OTP Verification Modal */}
      <AnimatePresence>
        {otpSent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <Card className="w-full max-w-md shadow-2xl border-0">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="font-heading text-xl">
                    {t("register.verify_email")}
                  </CardTitle>
                  <CardDescription>
                    {t("register.otp_sent_to", { email: formData.email })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* OTP Input Boxes */}
                  <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-xl font-bold border-2 rounded-lg 
                          focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none
                          transition-all bg-background text-foreground"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  {/* Verify Button */}
                  <Button
                    onClick={handleVerifyOtp}
                    className="w-full h-12 rounded-xl"
                    disabled={otpLoading || otp.join("").length !== 6}
                  >
                    {otpLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 mr-2" />
                    )}
                    {otpLoading ? t("register.verifying") : t("register.verify_and_create")}
                  </Button>

                  {/* Resend & Back */}
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {t("register.didnt_receive_code")}{" "}
                      <button
                        onClick={handleResendOtp}
                        disabled={resendTimer > 0}
                        className={`font-medium ${
                          resendTimer > 0
                            ? "text-muted-foreground cursor-not-allowed"
                            : "text-primary hover:underline cursor-pointer"
                        }`}
                      >
                        {resendTimer > 0
                          ? t("register.resend_in", { seconds: resendTimer })
                          : t("register.resend_otp")}
                      </button>
                    </p>
                    <button
                      onClick={() => {
                        setOtpSent(false);
                        setOtp(["", "", "", "", "", ""]);
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {t("register.back_to_form")}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegisterPage;
