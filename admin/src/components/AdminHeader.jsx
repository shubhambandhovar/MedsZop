import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Menu,
  Moon,
  Sun,
  ExternalLink,
  ShieldCheck,
  Bell,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";

const ROUTE_NAMES = {
  "/dashboard": "Executive Dashboard",
  "/analytics": "Analytics & Trends",
  "/orders": "Marketplace Orders",
  "/medicines": "Medicine Catalog",
  "/pharmacies": "Licensed Pharmacies",
  "/customers": "Customer Records",
  "/prescriptions": "Prescription Verification",
  "/consultations": "Doctor Consultations",
  "/deliveries": "Delivery Logistics",
  "/partner-applications": "Partner Review Center",
  "/payments": "Payments & Refunds",
  "/audit-logs": "Administrative Audit Trail",
  "/settings": "Settings & Security",
  "/profile": "Admin Profile & Security",
};

export default function AdminHeader({ onOpenMobile, onRefresh, isRefreshing = false }) {
  const location = useLocation();
  const { user } = useAuth();
  const [healthStatus, setHealthStatus] = useState({ healthy: true, text: "System Telemetry Active" });
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains("dark") ||
      localStorage.getItem("medszop_admin_theme") === "dark";
  });

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const res = await adminApi.getSystemHealth();
        if (mounted) {
          const isDbOk = res?.database === "connected" || res?.status === "healthy" || res?.db_status === "connected";
          setHealthStatus({
            healthy: isDbOk,
            text: isDbOk ? "Atlas Cluster Live" : "DB Disconnected"
          });
        }
      } catch (err) {
        if (mounted) {
          setHealthStatus({ healthy: false, text: "Health Telemetry Offline" });
        }
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // 30s passive poll
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("medszop_admin_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("medszop_admin_theme", "light");
    }
  }, [isDark]);

  const currentPageTitle = ROUTE_NAMES[location.pathname] || "Admin Portal";

  return (
    <header className="h-16 px-4 lg:px-6 border-b border-border glass-navbar flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Left: Mobile Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Admin</span>
            <span>/</span>
            <span className="text-foreground font-medium">{currentPageTitle}</span>
          </nav>
          <h1 className="text-sm lg:text-base font-semibold text-foreground tracking-tight leading-none mt-0.5">
            {currentPageTitle}
          </h1>
        </div>
      </div>

      {/* Right: Actions & Controls */}
      <div className="flex items-center gap-2.5">
        {/* Dynamic Real-Time Operational Telemetry LED */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-muted-foreground px-2.5 py-1 rounded-md bg-muted/60 border border-border">
          <span className={`h-2 w-2 rounded-full ${healthStatus.healthy ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          <span>{healthStatus.text}</span>
        </div>

        {/* Protected Super Admin Indicator */}
        {(user?.isProtectedAdmin || user?.email === "shubhambandhovar@gmail.com") && (
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
            <span>Protected Super Admin</span>
          </div>
        )}

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 px-2.5 text-xs gap-1.5 hidden sm:flex text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>
        )}

        {/* Customer Portal Link */}
        <a
          href="https://medszop.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-muted"
        >
          <span>Storefront</span>
          <ExternalLink className="h-3 w-3" />
        </a>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDark(!isDark)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Verified RBAC Badge */}
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Secured RBAC</span>
        </div>
      </div>
    </header>
  );
}

