import { Link, useNavigate } from "react-router-dom";
import { Truck, LogOut, Radio, UserCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const DeliveryNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Successfully logged out of Delivery Portal");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-500/20">
              <Truck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                MedsZop <span className="text-cyan-600">Delivery</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Agent Logistics & Handover
              </span>
            </div>
          </Link>
          <Badge className="hidden sm:inline-flex bg-cyan-50 text-cyan-700 border-cyan-200 text-xs font-semibold ml-2 gap-1.5">
            <Radio className="h-3 w-3 text-cyan-600 animate-pulse" />
            Live Dispatch Active
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-900 flex items-center justify-end gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-cyan-600" />
              {user?.name || "Delivery Partner"}
            </span>
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

export default DeliveryNavbar;

