import React, { useEffect, useState, useRef, useCallback } from "react";
import { AlertTriangle, Clock, ShieldAlert, LogOut, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { sessionApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Admin Policies (Phase 2)
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;        // 30 minutes
const ABSOLUTE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const WARNING_THRESHOLD_MS = 2 * 60 * 1000;     // 2 minutes

export default function SessionTimeoutManager() {
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const [isExtending, setIsExtending] = useState(false);

  const sessionStartTimeRef = useRef(Date.now());
  const lastActiveRef = useRef(Date.now());
  const throttleRef = useRef(0);

  // Record user activity
  const recordActivity = useCallback(() => {
    const now = Date.now();
    lastActiveRef.current = now;

    // Throttle local storage sync to once per 5 seconds
    if (now - throttleRef.current > 5000) {
      throttleRef.current = now;
      try {
        localStorage.setItem("medszop_admin_last_activity", now.toString());
      } catch {
        // ignore
      }
    }
  }, []);

  // Set up user interaction listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initialize timestamps
    sessionStartTimeRef.current = Date.now();
    lastActiveRef.current = Date.now();
    try {
      localStorage.setItem("medszop_admin_last_activity", Date.now().toString());
    } catch {
      // ignore
    }

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    const handler = () => recordActivity();

    events.forEach((evt) => window.addEventListener(evt, handler, { passive: true }));
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handler));
    };
  }, [isAuthenticated, recordActivity]);

  // Handle cross-tab activity sync
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleStorage = (e) => {
      if (e.key === "medszop_admin_last_activity" && e.newValue) {
        const remoteTime = parseInt(e.newValue, 10);
        if (remoteTime > lastActiveRef.current) {
          lastActiveRef.current = remoteTime;
          // Hide warning if user became active in another tab
          setShowWarning(false);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [isAuthenticated]);

  // Support synthetic test dispatch for visual auditing
  useEffect(() => {
    const handleForce = () => {
      setShowWarning(true);
      setSecondsRemaining(105);
    };
    window.addEventListener("medszop_test_trigger_warning", handleForce);
    return () => window.removeEventListener("medszop_test_trigger_warning", handleForce);
  }, []);

  // Main evaluation ticker (runs every second)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const now = Date.now();

      // Check cross-tab latest activity
      let latestActive = lastActiveRef.current;
      try {
        const stored = parseInt(localStorage.getItem("medszop_admin_last_activity"), 10);
        if (stored && stored > latestActive) {
          latestActive = stored;
          lastActiveRef.current = stored;
        }
      } catch {
        // ignore
      }

      const idleElapsed = now - latestActive;
      const absoluteElapsed = now - sessionStartTimeRef.current;

      const idleRemaining = IDLE_TIMEOUT_MS - idleElapsed;
      const absoluteRemaining = ABSOLUTE_TIMEOUT_MS - absoluteElapsed;

      const effectiveRemainingMs = Math.min(idleRemaining, absoluteRemaining);

      if (effectiveRemainingMs <= 0) {
        clearInterval(interval);
        setShowWarning(false);
        toast.error("Session Expired: You were logged out due to inactivity for security compliance.");
        logout(true, "SESSION_EXPIRED");
        return;
      }

      if (effectiveRemainingMs <= WARNING_THRESHOLD_MS) {
        setShowWarning(true);
        setSecondsRemaining(Math.max(1, Math.ceil(effectiveRemainingMs / 1000)));
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  // Stay Logged In button click
  const handleStayLoggedIn = async () => {
    try {
      setIsExtending(true);
      await sessionApi.heartbeat();
      const now = Date.now();
      lastActiveRef.current = now;
      try {
        localStorage.setItem("medszop_admin_last_activity", now.toString());
      } catch {
        // ignore
      }
      setShowWarning(false);
      toast.success("Session renewed. Inactivity timer has been reset.");
    } catch (err) {
      toast.error("Failed to renew session. Please log in again.");
      logout(true, "HEARTBEAT_FAILED");
    } finally {
      setIsExtending(false);
    }
  };

  const handleSignOutNow = () => {
    setShowWarning(false);
    logout(true, "MANUAL_LOGOUT");
  };

  if (!isAuthenticated || !showWarning) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-amber-500/30 rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight">
              Session Inactivity Warning
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Healthcare Security Policy Enforcement
            </p>
          </div>
        </div>

        {/* Informative Body */}
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            For patient privacy and compliance with healthcare data regulations, administrative sessions
            automatically expire after 30 minutes of inactivity.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Automatic Logout In:
            </span>
            <span className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {timeFormatted}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSignOutNow}
            className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out Now
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleStayLoggedIn}
            disabled={isExtending}
            className="text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isExtending ? "Extending..." : "Stay Logged In"}
          </Button>
        </div>
      </div>
    </div>
  );
}
