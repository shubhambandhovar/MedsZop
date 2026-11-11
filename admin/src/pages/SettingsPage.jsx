import React, { useState, useEffect } from "react";
import {
  Settings,
  Server,
  ShieldCheck,
  Database,
  Cpu,
  Lock,
  Globe,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getSystemHealth();
      setHealth(data);
    } catch (err) {
      console.error("Health fetch error:", err);
      toast.error("Failed to fetch system telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const formatUptime = (seconds) => {
    if (!seconds) return "—";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Platform Settings & Security
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Infrastructure telemetry, database connections, and security policy enforcement.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchHealth}
          disabled={loading}
          className="h-8 px-2.5 text-xs gap-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-primary" : ""}`} />
          Refresh Status
        </Button>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase">API Service</span>
            <Server className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-foreground">Operational</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Render Web Service Active
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase">MongoDB Atlas</span>
            <Database className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground capitalize">
            {health?.database?.status || "Connected"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            DB: <span className="font-mono font-medium text-foreground">{health?.database?.name || "test"}</span>
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase">Engine Runtime</span>
            <Cpu className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-foreground font-mono">
            {health?.node_version || "Node.js"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Heap: <span className="font-mono">{health?.memory?.heapUsed || "—"}</span>
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase">Process Uptime</span>
            <Server className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-foreground font-mono">
            {formatUptime(health?.uptime)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Platform: <span className="capitalize">{health?.platform || "Linux"}</span>
          </p>
        </div>
      </div>

      {/* Security Policies Matrix */}
      <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Enterprise Security Configuration Matrix
          </h3>
          <p className="text-xs text-muted-foreground">Automated compliance controls and hardened infrastructure</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border bg-muted/20 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Strict Role-Based Access Control (RBAC)</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Every administrative API route enforces authenticated JWT tokens signed with secure HMAC and validated against role "admin".
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-muted/20 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Multi-Portal Subdomain CORS</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Restricted preflight headers allow only verified MedsZop domains (admin, pharmacy, delivery, doctor) and localhost development ports.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-muted/20 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">HIPAA / DPDPA Prescription Shield</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Prescription files are protected from public HTTP scraping. Files stream strictly through authenticated token endpoints.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-muted/20 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Helmet Security & Content Security Policy</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                HSTS 1-year preload, X-Content-Type-Options noSniff, frameguard deny, and anti-clickjacking headers active.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Production Domain Targets */}
      <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Target Multi-Portal Endpoints
          </h3>
          <p className="text-xs text-muted-foreground">Active production domains configured across Cloudflare Pages & Render</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg border bg-muted/20">
            <p className="text-[10px] font-bold uppercase text-primary">Admin Console</p>
            <p className="font-medium text-foreground truncate mt-1">https://admin.medszop.com</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">medszop-admin.pages.dev</p>
          </div>

          <div className="p-3 rounded-lg border bg-muted/20">
            <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Pharmacy Portal</p>
            <p className="font-medium text-foreground truncate mt-1">https://pharmacy.medszop.com</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">medszop-pharmacy.pages.dev</p>
          </div>

          <div className="p-3 rounded-lg border bg-muted/20">
            <p className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Delivery Portal</p>
            <p className="font-medium text-foreground truncate mt-1">https://delivery.medszop.com</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">medszop-delivery.pages.dev</p>
          </div>

          <div className="p-3 rounded-lg border bg-muted/20">
            <p className="text-[10px] font-bold uppercase text-cyan-600 dark:text-cyan-400">Doctor Portal</p>
            <p className="font-medium text-foreground truncate mt-1">https://doctor.medszop.com</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">medszop-doctor.pages.dev</p>
          </div>
        </div>
      </div>
    </div>
  );
}

