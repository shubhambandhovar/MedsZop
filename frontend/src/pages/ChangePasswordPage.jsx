import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const ChangePasswordPage = () => {
    const { token, logout, user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword.length < 6) {
            return toast.error("New password must be at least 6 characters");
        }
        if (formData.newPassword !== formData.confirmPassword) {
            return toast.error("New passwords do not match");
        }

        setLoading(true);
        try {
            const payload = {
                newPassword: formData.newPassword
            };

            // Only send current password if NOT first login
            if (!user?.is_first_login) {
                payload.currentPassword = formData.currentPassword;
            }

            await axios.post(`${API_URL}/auth/change-password`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Password changed successfully! Please login again.");
            logout();
            navigate("/login");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <div className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md rounded-3xl border-slate-200 dark:border-slate-800 shadow-xl bg-card overflow-hidden" data-testid="change-password-card">
                    <CardHeader className="text-center pb-4 pt-6 sm:pt-8 px-6 sm:px-8">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 border border-primary/20">
                            <KeyRound className="h-6 w-6" />
                        </div>
                        <CardTitle className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground" data-testid="change-password-title">
                            {user?.is_first_login ? "Set New Password" : "Change Password"}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed mt-1">
                            {user?.is_first_login
                                ? "Welcome! Please set a secure password for your new account to proceed."
                                : "For security and account protection, please update your existing password."}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 sm:p-8 pt-0 space-y-5">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Only show Current Password if NOT first login */}
                            {!user?.is_first_login && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="currentPassword" className="text-xs font-semibold text-foreground">
                                        Current Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="currentPassword"
                                            type={showCurrentPassword ? "text" : "password"}
                                            name="currentPassword"
                                            required
                                            value={formData.currentPassword}
                                            onChange={handleChange}
                                            className="pl-10 pr-10 h-12 rounded-xl text-sm"
                                            placeholder="Enter your current password"
                                            data-testid="current-password-input"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="newPassword" className="text-xs font-semibold text-foreground">
                                    New Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        name="newPassword"
                                        required
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="pl-10 pr-10 h-12 rounded-xl text-sm"
                                        placeholder="At least 6 characters"
                                        data-testid="new-password-input"
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
                                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
                                    Confirm New Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="pl-10 pr-10 h-12 rounded-xl text-sm"
                                        placeholder="Re-enter your new password"
                                        data-testid="confirm-password-input"
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
                                className="w-full h-12 rounded-xl font-bold text-sm shadow-md shadow-primary/20 active-press mt-2"
                                disabled={loading}
                                data-testid="change-password-submit-btn"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                        Updating Password...
                                    </>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
