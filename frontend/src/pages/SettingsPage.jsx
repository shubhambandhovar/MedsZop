import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { ShieldCheck, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

const SettingsPage = () => {
    const { token, user } = useAuth();
    const [profileForm, setProfileForm] = useState({
        name: user?.name || "",
        address: "",
        license_number: ""
    });

    const [loading, setLoading] = useState(false);

    // Initial Fetch (If pharmacy)
    useEffect(() => {
        if (user?.role === 'pharmacy') {
            const fetchProfile = async () => {
                try {
                    const res = await axios.get(`${API_URL}/pharmacy/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
                    // Typically dashboard returns stats, but let's assume if we had a dedicated profile endpoint
                    // For now, we manually fill what we can or wait for user input
                } catch (e) { console.error(e); }
            }
            fetchProfile();
        }
    }, [user, token]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Determine endpoint based on role
            let endpoint = `${API_URL}/pharmacy/profile`;
            if (user.role === 'customer') endpoint = `${API_URL}/users/profile`; // Hypothetical

            await axios.put(endpoint, profileForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Profile Updated Successfully");
        } catch (err) {
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Update your personal or business details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name / Business Name</label>
                                <input
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>

                            {user?.role === 'pharmacy' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Store Address</label>
                                        <textarea
                                            className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                                            value={profileForm.address}
                                            onChange={(e) => setProfileForm(p => ({ ...p, address: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">License Number</label>
                                        <input
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                            value={profileForm.license_number}
                                            onChange={(e) => setProfileForm(p => ({ ...p, license_number: e.target.value }))}
                                        />
                                    </div>
                                </>
                            )}

                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Security Section Placeholder */}
                <Card className="mt-6 border-red-100 dark:border-red-900/30">
                    <CardHeader>
                        <CardTitle className="flex items-center text-red-600">
                            <ShieldCheck className="w-5 h-5 mr-2" /> Security Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm mb-4">
                            Manage your password and active sessions.
                        </p>
                        <Button variant="destructive">Reset Password</Button>
                    </CardContent>
                </Card>

            </main>
            <Footer />
        </div>
    );
};

export default SettingsPage;
