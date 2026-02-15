import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Mail, Lock, KeyRound } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/forgot-password`, { email });
            toast.success("OTP sent to your email");
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/verify-reset-otp`, { email, otp });
            toast.success("OTP Verified");
            setStep(3);
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error("Passwords do not match");
        }
        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/reset-password`, { email, otp, newPassword });
            toast.success("Password reset successfully");
            navigate("/login");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            {step === 1 && "Reset Password"}
                            {step === 2 && "Verify OTP"}
                            {step === 3 && "New Password"}
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            {step === 1 && "Enter your email to receive an OTP"}
                            {step === 2 && `Enter the OTP sent to ${email}`}
                            {step === 3 && "Create a new secure password"}
                        </p>
                    </div>

                    {step === 1 && (
                        <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    type="email"
                                    required
                                    placeholder="Email address"
                                    className="pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2" /> : "Send OTP"}
                            </Button>
                        </form>
                    )}

                    {step === 2 && (
                        <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    type="text"
                                    required
                                    placeholder="Enter 6-digit OTP"
                                    className="pl-10 tracking-widest text-center text-lg"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2" /> : "Verify OTP"}
                            </Button>
                            <div className="text-center">
                                <button type="button" onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline">
                                    Change Email
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="password"
                                        required
                                        placeholder="New Password"
                                        className="pl-10"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="password"
                                        required
                                        placeholder="Confirm New Password"
                                        className="pl-10"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin mr-2" /> : "Reset Password"}
                            </Button>
                        </form>
                    )}

                    <div className="text-center mt-4">
                        <Link to="/login" className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
