import React, { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Laptop,
  Smartphone,
  Globe,
  Bell,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Mail,
  Phone,
  Clock,
  Save,
  Lock,
  Calendar,
  Check
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi, sessionApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminProfilePage() {
  const { user, fetchUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile"); // profile | security | sessions | notifications

  // Profile Form
  const [profileLoading, setProfileLoading] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [language, setLanguage] = useState(user?.languagePreference || "en");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Email Change Modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailStep, setEmailStep] = useState(1); // 1 = input email, 2 = input OTP
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  // Active Sessions
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    whatsapp: false,
    orderUpdates: true,
    securityAlerts: true
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Sync user state to form
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatarUrl(user.avatarUrl || "");
      setPhone(user.phone || "");
      setLanguage(user.languagePreference || "en");
      if (user.notificationPreferences) {
        setNotifications((prev) => ({ ...prev, ...user.notificationPreferences }));
      }
    }
  }, [user]);

  // Load sessions when switching to sessions tab
  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const data = await profileApi.getSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      toast.error("Failed to load active sessions");
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "sessions") {
      fetchSessions();
    }
  }, [activeTab]);

  // Handle Profile Update
  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await profileApi.updateProfile({
        name,
        avatarUrl,
        languagePreference: language
      });
      toast.success("Profile details updated successfully");
      await fetchUser();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    try {
      setChangingPassword(true);
      await sessionApi.changePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully. Other active sessions have been invalidated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  // Initiate Email Change
  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setEmailSubmitting(true);
      const res = await profileApi.requestEmailChange({ newEmail });
      toast.success(res.message || "Verification code dispatched");
      setEmailStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate email change");
    } finally {
      setEmailSubmitting(false);
    }
  };

  // Verify Email Change OTP
  const handleVerifyEmailChange = async (e) => {
    e.preventDefault();
    if (!emailOtp || emailOtp.length < 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    try {
      setEmailSubmitting(true);
      await profileApi.verifyEmailChange({ otp: emailOtp });
      toast.success("Email address updated successfully");
      setEmailModalOpen(false);
      setEmailStep(1);
      setNewEmail("");
      setEmailOtp("");
      await fetchUser();
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired verification code");
    } finally {
      setEmailSubmitting(false);
    }
  };

  // Revoke single session
  const handleRevokeSession = async (sessionId) => {
    try {
      setRevokingSessionId(sessionId);
      await profileApi.revokeSession(sessionId);
      toast.success("Session revoked");
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err) {
      toast.error("Failed to revoke session");
    } finally {
      setRevokingSessionId(null);
    }
  };

  // Revoke other sessions
  const handleRevokeOthers = async () => {
    try {
      setRevokingOthers(true);
      await profileApi.revokeOtherSessions();
      toast.success("Signed out from all other active sessions");
      fetchSessions();
    } catch (err) {
      toast.error("Failed to sign out from other devices");
    } finally {
      setRevokingOthers(false);
    }
  };

  // Save Notification Preferences
  const handleSaveNotifications = async () => {
    try {
      setSavingNotifications(true);
      await profileApi.updateProfile({ notificationPreferences: notifications });
      toast.success("Notification preferences saved");
      await fetchUser();
    } catch (err) {
      toast.error("Failed to update notification preferences");
    } finally {
      setSavingNotifications(false);
    }
  };

  const isProtectedAdmin = user?.isProtectedAdmin === true;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Administrator Profile & Security
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your credentials, active devices, and session security policies.
          </p>
        </div>

        {isProtectedAdmin && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold shrink-0">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            <span>Permanent Protected Founder</span>
          </div>
        )}
      </div>

      {/* User Hero Identity Card */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name || "Admin"}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              (user?.name || "A").charAt(0).toUpperCase()
            )}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-foreground truncate">{user?.name || "Administrator"}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                Administrator
              </span>
              {isProtectedAdmin && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  Protected Super Admin
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">{user?.email}</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
              <Calendar className="h-3 w-3" />
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "2026"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-3 py-2 rounded-lg transition-all ${
            activeTab === "profile"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Personal Details
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`px-3 py-2 rounded-lg transition-all ${
            activeTab === "security"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Password & Security
        </button>

        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-3 py-2 rounded-lg transition-all ${
            activeTab === "sessions"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Active Sessions
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-3 py-2 rounded-lg transition-all ${
            activeTab === "notifications"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          Notification Settings
        </button>
      </div>

      {/* TAB 1: PERSONAL DETAILS */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSave} className="space-y-5 rounded-xl border bg-card p-5 sm:p-6 shadow-sm">
          <div>
            <h4 className="text-sm font-semibold text-foreground">General Profile Information</h4>
            <p className="text-xs text-muted-foreground">Update your identity and display preferences</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Avatar URL</Label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Email Address</Label>
                <button
                  type="button"
                  onClick={() => {
                    setNewEmail("");
                    setEmailOtp("");
                    setEmailStep(1);
                    setEmailModalOpen(true);
                  }}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Change Email
                </button>
              </div>
              <Input
                value={user?.email || ""}
                disabled
                className="h-9 text-xs bg-muted/50 cursor-not-allowed font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Language Preference</Label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="en">English (US / IN)</option>
                <option value="hi">Hindi (हिंदी)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={savingProfile} size="sm" className="text-xs gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {savingProfile ? "Saving..." : "Save Details"}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Protected Admin Overview Callout */}
          {isProtectedAdmin && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
                Immutable Founder / Super Admin Protection Active
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This account is designated as the primary Founder Administrator anchored to the immutable
                MongoDB ID. Backend controllers permanently block deletion, deactivation, role demotion, and
                anonymization against this identity.
              </p>
            </div>
          )}

          {/* Session Policy Matrix */}
          <div className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Session Expiration Policy (Administrator)
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated compliance rules enforced server-side
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Inactivity Timeout</span>
                <p className="text-sm font-bold text-foreground">30 Minutes</p>
                <p className="text-[11px] text-muted-foreground">
                  Warning popup appears at 28 minutes. Expired sessions are cleanly logged out.
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Absolute Session Lifetime</span>
                <p className="text-sm font-bold text-foreground">2 Hours</p>
                <p className="text-[11px] text-muted-foreground">
                  Hard boundary requiring re-authentication regardless of ongoing activity.
                </p>
              </div>
            </div>
          </div>

          {/* Password Change Form */}
          <form onSubmit={handlePasswordChange} className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Change Password</h4>
              <p className="text-xs text-muted-foreground">
                Updating your password will automatically invalidate all other active sessions across devices
              </p>
            </div>

            <div className="space-y-3 max-w-md">
              <div className="space-y-1">
                <Label className="text-xs">Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">New Password (min. 6 characters)</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={changingPassword} size="sm" className="text-xs gap-1.5">
                <KeyRound className="h-3.5 w-3.5" />
                {changingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: ACTIVE SESSIONS */}
      {activeTab === "sessions" && (
        <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Active Sessions & Devices</h4>
              <p className="text-xs text-muted-foreground">
                Devices currently signed into this administrative account
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSessions}
                disabled={sessionsLoading}
                className="h-8 px-2.5 text-xs gap-1.5"
              >
                <RefreshCw className={`h-3 w-3 ${sessionsLoading ? "animate-spin text-primary" : ""}`} />
                Refresh
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevokeOthers}
                disabled={revokingOthers || sessions.length <= 1}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                {revokingOthers ? "Signing out..." : "Sign Out Other Devices"}
              </Button>
            </div>
          </div>

          {sessionsLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Loading active sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">No active sessions found.</div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => {
                const isMobile = s.deviceType === "mobile";
                return (
                  <div
                    key={s.sessionId}
                    className="p-3.5 rounded-xl border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-card border flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                        {isMobile ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground truncate max-w-[240px]">
                            {s.userAgent?.slice(0, 45) || "Browser Session"}
                          </span>
                          {s.isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Current Device
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono">IP: {s.ipAddress || "Localhost / Protected"}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last active: {new Date(s.lastActivityAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>

                    {!s.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={revokingSessionId === s.sessionId}
                        onClick={() => handleRevokeSession(s.sessionId)}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 self-end sm:self-center"
                      >
                        {revokingSessionId === s.sessionId ? "Revoking..." : "Revoke"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Notification Preferences</h4>
            <p className="text-xs text-muted-foreground">Select channels for system telemetry and alerts</p>
          </div>

          <div className="space-y-3 max-w-lg text-xs">
            <label className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 cursor-pointer">
              <div>
                <p className="font-semibold text-foreground">Email Notifications</p>
                <p className="text-muted-foreground text-[11px]">System digests, partner applications, order alerts</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 cursor-pointer">
              <div>
                <p className="font-semibold text-foreground">Security & Audit Alerts</p>
                <p className="text-muted-foreground text-[11px]">Failed logins, role modifications, session revocations</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.securityAlerts}
                onChange={(e) => setNotifications({ ...notifications, securityAlerts: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 cursor-pointer">
              <div>
                <p className="font-semibold text-foreground">Critical Order Updates</p>
                <p className="text-muted-foreground text-[11px]">High-value prescriptions and urgent fulfillment issues</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.orderUpdates}
                onChange={(e) => setNotifications({ ...notifications, orderUpdates: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={handleSaveNotifications}
              disabled={savingNotifications}
              size="sm"
              className="text-xs gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              {savingNotifications ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      )}

      {/* CHANGE EMAIL DIALOG (2-STEP OTP FLOW) */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {emailStep === 1 ? "Change Email Address" : "Verify Email Address"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {emailStep === 1
                ? "Enter your new email address. A 6-digit verification code will be dispatched."
                : `Enter the 6-digit verification code sent to ${newEmail}`}
            </DialogDescription>
          </DialogHeader>

          {emailStep === 1 ? (
            <form onSubmit={handleRequestEmailChange} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">New Email Address</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin.new@medszop.com"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEmailModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={emailSubmitting} className="text-xs">
                  {emailSubmitting ? "Sending OTP..." : "Send Verification Code"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleVerifyEmailChange} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">6-Digit Verification Code</Label>
                <Input
                  type="text"
                  maxLength={6}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.trim())}
                  placeholder="123456"
                  className="h-10 text-center font-mono text-lg tracking-widest"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEmailStep(1)}>
                  Back
                </Button>
                <Button type="submit" size="sm" disabled={emailSubmitting} className="text-xs">
                  {emailSubmitting ? "Verifying..." : "Confirm & Update Email"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

