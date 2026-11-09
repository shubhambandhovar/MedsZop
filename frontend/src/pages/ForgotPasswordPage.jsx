import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Mail, Lock, KeyRound, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import Navbar from "../components/Navbar";

const API_URL = import.meta.env.VITE_API_URL;

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/forgot-password`, { email });
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
            await axios.post(`${API_URL}/auth/verify-reset-otp`, { email, otp });
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
            await axios.post(`${API_URL}/auth/reset-password`, { email, otp, newPassword });
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
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <div className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
                <Card className="max-w-md w-full rounded-3xl border-slate-200 dark:border-slate-800 shadow-xl bg-card overflow-hidden" data-testid="forgot-password-card">
                    <CardContent className="p-6 sm:p-8 space-y-6">
                        {/* Step Progress Bar */}
                        <div className="flex items-center justify-between px-2 pt-2">
                            {steps.map((s, idx) => (
                                <div key={s.num} className="flex items-center flex-1 last:flex-none">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                                                step === s.num
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : step > s.num
                                                    ? "bg-emerald-600 text-white"
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
                                                step > s.num ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-800"
                                            }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Heading & Subtitle */}
                        <div className="text-center space-y-1">
                            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground" data-testid="forgot-password-title">
                                {step === 1 && "Reset Password"}
                                {step === 2 && "Enter Verification Code"}
                                {step === 3 && "Create New Password"}
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                                {step === 1 && "Enter your registered email to receive a secure 6-digit recovery code."}
                                {step === 2 && `Enter the 6-digit verification code sent to ${email}`}
                                {step === 3 && "Choose a strong password with at least 6 characters."}
                            </p>
                        </div>

                        {/* Step 1: Email Form */}
                        {step === 1 && (
                            <form className="space-y-4" onSubmit={handleSendOTP}>
                                <div className="space-y-1.5">
                                    <Label htmlFor="reset-email" className="text-xs font-semibold text-foreground">
                                        Registered Email Address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="reset-email"
                                            type="email"
                                            required
                                            placeholder="you@example.com"
                                            className="pl-10 h-12 rounded-xl text-sm"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoFocus
                                            data-testid="forgot-password-email-input"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-xl font-bold text-sm shadow-md shadow-primary/20 active-press"
                                    disabled={loading || !email.trim()}
                                    data-testid="forgot-password-send-otp-btn"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                            Sending Code...
                                        </>
                                    ) : (
                                        "Send Recovery Code"
                                    )}
                                </Button>
                            </form>
                        )}

                        {/* Step 2: OTP Verification */}
                        {step === 2 && (
                            <form className="space-y-4" onSubmit={handleVerifyOTP}>
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
                                            className="pl-10 h-12 rounded-xl tracking-widest text-center text-lg font-bold tabular-nums"
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
                                    className="w-full h-12 rounded-xl font-bold text-sm shadow-md shadow-primary/20 active-press"
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
                                        className="text-xs text-primary hover:underline font-semibold"
                                        data-testid="forgot-password-resend-otp-btn"
                                    >
                                        Edit Email Address
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 3: New Password */}
                        {step === 3 && (
                            <form className="space-y-4" onSubmit={handleResetPassword}>
                                <div className="space-y-1.5">
                                    <Label htmlFor="new-password" className="text-xs font-semibold text-foreground">
                                        New Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="new-password"
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            placeholder="At least 6 characters"
                                            className="pl-10 pr-10 h-12 rounded-xl text-sm"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
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
                                        Confirm New Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="confirm-password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            placeholder="Re-enter your new password"
                                            className="pl-10 pr-10 h-12 rounded-xl text-sm"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
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

                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-xl font-bold text-sm shadow-md shadow-primary/20 active-press"
                                    disabled={loading || !newPassword || !confirmPassword}
                                    data-testid="forgot-password-submit-btn"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                            Updating Password...
                                        </>
                                    ) : (
                                        "Save New Password"
                                    )}
                                </Button>
                            </form>
                        )}

                        {/* Back to Login */}
                        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary transition-colors gap-1.5"
                                data-testid="forgot-password-back-to-login-btn"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
