import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  Pill,
  Store,
  Users,
  FileText,
  Stethoscope,
  Truck,
  UserCheck,
  CreditCard,
  ShieldAlert,
  Settings,
  UserCog,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { name: "Executive Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Analytics & Trends", path: "/analytics", icon: BarChart3 },
    ]
  },
  {
    title: "Marketplace",
    items: [
      { name: "Orders", path: "/orders", icon: ShoppingBag },
      { name: "Medicine Catalog", path: "/medicines", icon: Pill },
      { name: "Pharmacies", path: "/pharmacies", icon: Store },
      { name: "Customers", path: "/customers", icon: Users },
    ]
  },
  {
    title: "Healthcare",
    items: [
      { name: "Prescriptions", path: "/prescriptions", icon: FileText },
      { name: "Doctor Consultations", path: "/consultations", icon: Stethoscope },
    ]
  },
  {
    title: "Operations",
    items: [
      { name: "Delivery Logistics", path: "/deliveries", icon: Truck },
      { name: "Partner Applications", path: "/partner-applications", icon: UserCheck },
    ]
  },
  {
    title: "Business",
    items: [
      { name: "Payments & Refunds", path: "/payments", icon: CreditCard },
    ]
  },
  {
    title: "System",
    items: [
      { name: "Audit Logs", path: "/audit-logs", icon: ShieldAlert },
      { name: "Settings & Security", path: "/settings", icon: Settings },
      { name: "Admin Profile", path: "/profile", icon: UserCog },
    ]
  }
];

export default function AdminSidebar({ isCollapsed, setIsCollapsed, onCloseMobile }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r border-border transition-all duration-300 select-none",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
              MZ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-foreground">MedsZop</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Enterprise Portal V2</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            MZ
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">
                {section.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    title={isCollapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}

                    {/* Active accent pill when collapsed */}
                    {isCollapsed && isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Profile & Status */}
      <div className="p-3 border-t border-border shrink-0 bg-muted/20">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Node v20
              </span>
              <span className="font-mono text-[10px] opacity-70">SSL TLS 1.3</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="truncate max-w-[140px]">
                <p className="text-xs font-semibold text-foreground truncate">{user?.name || "Administrator"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email || "admin@medszop.com"}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Sign out"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Healthy" />
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Sign out"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

