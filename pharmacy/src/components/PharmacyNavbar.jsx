import { Link, useNavigate } from "react-router-dom";
import { 
  Store, 
  LogOut, 
  ShieldCheck, 
  Clock, 
  ThermometerSnowflake, 
  Building2,
  FileCheck,
  Activity
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const PharmacyNavbar = ({ 
  verified = true, 
  pharmacyName = "MedsZop Pharmacy Partner",
  pharmacistName = "",
  licenseNumber = "DL-20B/21B-49210",
  lowStockCount = 0,
  pendingRxCount = 0
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Successfully logged out of Pharmacy Fulfillment Console");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 glass-navbar shadow-xs">
      <div className="max-w-[1720px] mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand & Console Identity */}
        <div className="flex items-center gap-3.5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 group-hover:bg-emerald-700 transition-colors">
              <Store className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  MedsZop <span className="text-emerald-600">Pharmacy</span>
                </span>
                <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-bold font-mono tracking-wider bg-slate-100 text-slate-700 border border-slate-200 rounded">
                  CONSOLE v2.4
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                Retail Fulfillment & Prescription Dispensing Desk
              </span>
            </div>
          </Link>

          {/* Regulatory & Verification Telemetry */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200">
            {verified ? (
              <Badge className="bg-emerald-50 hover:bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold gap-1.5 py-1 px-2.5 shadow-none">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Form 20/21 Chemist</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[11px] font-semibold gap-1.5 py-1 px-2.5 shadow-none">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Verification Under Review</span>
              </Badge>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Shift Active</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-50/60 border border-cyan-200 text-[11px] text-cyan-800 font-mono">
              <ThermometerSnowflake className="h-3 w-3 text-cyan-600" />
              <span>Cold-Chain 2°C–8°C</span>
            </div>
          </div>
        </div>

        {/* Pharmacist Profile & Session Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Counters for Desk Action */}
          <div className="hidden sm:flex items-center gap-2 mr-1">
            {pendingRxCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md text-[11px] font-semibold text-amber-800">
                <FileCheck className="h-3.5 w-3.5 text-amber-600" />
                <span>{pendingRxCount} Rx Review</span>
              </div>
            )}
            {lowStockCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-md text-[11px] font-semibold text-red-700">
                <Activity className="h-3.5 w-3.5 text-red-600" />
                <span>{lowStockCount} Low Stock</span>
              </div>
            )}
          </div>

          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
              {pharmacyName || user?.name || "Licensed Chemist"}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {pharmacistName ? `R.Ph. ${pharmacistName}` : (user?.email || "Shift Operator")}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="h-9 px-3 flex items-center gap-1.5 text-slate-700 hover:text-red-700 hover:border-red-200 hover:bg-red-50/70 border-slate-200 text-xs font-semibold"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">End Shift / Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default PharmacyNavbar;
