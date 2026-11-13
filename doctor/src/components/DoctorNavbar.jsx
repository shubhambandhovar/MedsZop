import { Link, useNavigate } from "react-router-dom";
import { 
  Stethoscope, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  Activity,
  HeartPulse,
  Award
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const DoctorNavbar = ({ 
  doctorName = "Dr. Rajesh K. Sharma",
  specialization = "MD, MBBS • Internal Medicine",
  registrationNumber = "MCI-48291-MH",
  pendingQueueCount = 0
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Doctor clinical workspace session safely terminated");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-[1720px] mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand & Suite Identity */}
        <div className="flex items-center gap-3.5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-700 text-white shadow-sm shadow-sky-700/20 group-hover:bg-sky-800 transition-colors">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-heading">
                  MedsZop <span className="text-sky-700">Doctor</span>
                </span>
                <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-bold font-mono tracking-wider bg-slate-100 text-slate-700 border border-slate-200 rounded">
                  CLINICAL OS v2.4
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                Clinical Telehealth, EHR & Digital Rx Pad
              </span>
            </div>
          </Link>

          {/* Regulatory & Practice Credentials */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200">
            <Badge className="bg-sky-50 hover:bg-sky-50 text-sky-800 border-sky-200 text-[11px] font-semibold gap-1.5 py-1 px-2.5 shadow-none">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-700" />
              <span>NMC Verified RMP</span>
            </Badge>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono">
              <Award className="h-3.5 w-3.5 text-slate-500" />
              <span>Reg: {registrationNumber}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Telehealth Shift Active</span>
            </div>
          </div>
        </div>

        {/* Doctor Information & Session Controls */}
        <div className="flex items-center gap-3.5">
          {pendingQueueCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md text-[11px] font-semibold text-amber-800">
              <Activity className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
              <span>{pendingQueueCount} Patient(s) In Triage</span>
            </div>
          )}

          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900 truncate max-w-[220px]">
              {user?.name || doctorName}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {specialization}
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

export default DoctorNavbar;
