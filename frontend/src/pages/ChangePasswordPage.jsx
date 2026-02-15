import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const ChangePasswordPage = () => {
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            return toast.error("New passwords do not match");
        }

        setLoading(true);
        try {
            await axios.put(`${API_URL}/auth/change-password`, {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            }, {
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
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <Navbar />
            <Card className="w-full max-w-md mt-20">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Change Password Required</CardTitle>
                    <CardDescription className="text-center">
                        For security reasons, you must change your temporary password on first login.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Current (Temporary) Password</label>
                            <Input
                                type="password"
                                name="currentPassword"
                                required
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <Input
                                type="password"
                                name="newPassword"
                                required
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm New Password</label>
                            <Input
                                type="password"
                                name="confirmPassword"
                                required
                                onChange={handleChange}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ChangePasswordPage;
