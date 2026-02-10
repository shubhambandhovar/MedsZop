import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
    const { token, user, fetchUser } = useAuth();
    const [profileForm, setProfileForm] = useState({
        name: user?.name || "",
        store_name: "",
        pharmacist_name: "",
        address: "",
        license_number: ""
    });

    const [loading, setLoading] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        try {
            // Basic upgrade: Call backend endpoint
            await axios.post(`${API_URL}/auth/change-password`, passwordForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { t } = useTranslation();
            toast.success(t("settings.password_updated"));
            setShowChangePassword(false);
            setPasswordForm({ currentPassword: "", newPassword: "" });
        } catch (err) {
            toast.error(err.response?.data?.message || t("settings.password_update_failed"));
        }
    };

    // Initial Fetch (If pharmacy or delivery)
    useEffect(() => {
        if (user?.role === 'pharmacy') {
            const fetchProfile = async () => {
                try {
                    const res = await axios.get(`${API_URL}/pharmacy/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
                    if (res.data.pharmacy) {
                        const p = res.data.pharmacy;
                        setProfileForm({
                            name: user.name || "",
                            store_name: p.name || "",
                            pharmacist_name: p.pharmacist_name || user.name || "",
                            address: p.address || "",
                            license_number: p.license_number || ""
                        });
                    }
                } catch (e) { console.error(e); }
            }
            fetchProfile();
        } else if (user?.role === 'delivery') {
            setProfileForm({
                name: user.name || "",
                store_name: "",
                pharmacist_name: "",
                address: user.addresses?.[0]?.addressLine1 || "",
                license_number: "",
                phone: user.phone || ""
            });
        } else {
            setProfileForm(prev => ({ ...prev, name: user?.name || "" }));
        }
    }, [user, token]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Determine endpoint based on role
            let endpoint = `${API_URL}/pharmacy/profile`;
            // For delivery agents and customers, use generic auth profile update
            if (user.role !== 'pharmacy') {
                endpoint = `${API_URL}/auth/profile`;
            }

            await axios.put(endpoint, profileForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(t("settings.profile_updated"));
            fetchUser(); // Refresh global user state
        } catch (err) {
            toast.error(err.response?.data?.message || t("settings.profile_update_failed"));
        } finally {
            setLoading(false);
        }
    };

    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">{t("settings.account_settings")}</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("settings.profile_information")}</CardTitle>
                        <CardDescription>{t("settings.profile_information_desc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
                            {user?.role === 'pharmacy' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("settings.pharmacy_store_name")}</label>
                                        <input
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                            value={profileForm.store_name}
                                            onChange={(e) => setProfileForm(p => ({ ...p, store_name: e.target.value }))}
                                            placeholder={t("settings.store_name_placeholder")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("settings.pharmacist_name")}</label>
                                        <input
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                            value={profileForm.pharmacist_name}
                                            onChange={(e) => setProfileForm(p => ({ ...p, pharmacist_name: e.target.value }))}
                                            placeholder={t("settings.pharmacist_name_placeholder")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("settings.store_address")}</label>
                                        <textarea
                                            className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                                            value={profileForm.address}
                                            onChange={(e) => setProfileForm(p => ({ ...p, address: e.target.value }))}
                                            placeholder={t("settings.store_address_placeholder")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("settings.license_number")}</label>
                                        <input
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                            value={profileForm.license_number}
                                            onChange={(e) => setProfileForm(p => ({ ...p, license_number: e.target.value }))}
                                            placeholder={t("settings.license_number_placeholder")}
                                        />
                                    </div>
                                </>
                            ) : user?.role === 'delivery' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("settings.full_name")}</label>
                                        <input
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                                            placeholder={t("settings.name_placeholder")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("settings.mobile_number")}</label>
                                        <input
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                            value={profileForm.phone || ""}
                                            onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                                            placeholder={t("settings.mobile_placeholder")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{t("settings.address")}</label>
                                        <textarea
                                            className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                                            value={profileForm.address}
                                            onChange={(e) => setProfileForm(p => ({ ...p, address: e.target.value }))}
                                            placeholder={t("settings.address_placeholder")}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("settings.name")}</label>
                                    <input
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                        value={profileForm.name}
                                        onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder={t("settings.name_placeholder")}
                                    />
                                </div>
                            )}

                            <Button type="submit" disabled={loading}>
                                {loading ? t("settings.saving") : t("settings.save_changes")}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Security Section */}
                <Card className="mt-6 border-red-100 dark:border-red-900/30">
                    <CardHeader>
                        <CardTitle className="flex items-center text-red-600">
                            <ShieldCheck className="w-5 h-5 mr-2" /> {t("settings.security_zone")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground text-sm">
                            {t("settings.manage_password")}
                        </p>
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setShowChangePassword(true)}>
                                {t("settings.change_password")}
                            </Button>
                            {/* "Reset Password" typically implies a forgot password flow, but sticking to user request. 
                                I'll adding a dummy handler for now or same modal. */ }
                            <Button variant="destructive" onClick={() => toast.info(t("settings.reset_password_info"))}> 
                                {t("settings.reset_password")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Change Password Modal */}
            {showChangePassword && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{t("settings.change_password_modal_title")}</h2>
                        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("settings.current_password")}</label>
                                <input
                                    type="password"
                                    className="w-full h-10 px-3 rounded-md border"
                                    value={passwordForm.currentPassword}
                                    onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("settings.new_password")}</label>
                                <input
                                    type="password"
                                    className="w-full h-10 px-3 rounded-md border"
                                    value={passwordForm.newPassword}
                                    onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setShowChangePassword(false)}>{t("settings.cancel")}</Button>
                                <Button type="submit">{t("settings.update_password")}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            <Footer />
        </div >
    );
};

export default SettingsPage;
