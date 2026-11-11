import { Link, useNavigate } from "react-router-dom";
import { Store, LogOut, ShieldCheck, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const PharmacyNavbar = ({ verified = true, pharmacyName = "My Pharmacy" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Successfully logged out of Pharmacy Portal");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <Store className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                MedsZop <span className="text-emerald-600">Pharmacy</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Dispensing & Inventory Hub
              </span>
            </div>
          </Link>
          {verified ? (
            <Badge className="hidden sm:inline-flex bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold ml-2 gap-1">
              <ShieldCheck className="h-3 w-3" />
              Verified Partner
            </Badge>
          ) : (
            <Badge variant="outline" className="hidden sm:inline-flex text-amber-600 border-amber-200 bg-amber-50 text-xs font-semibold ml-2 gap-1">
              <Clock className="h-3 w-3" />
              Verification Pending
            </Badge>
          )}
        </div>

        {/* User Info & Controls */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-900">{pharmacyName || user?.name}</span>
            <span className="text-xs text-slate-500">{user?.email}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-slate-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default PharmacyNavbar;

