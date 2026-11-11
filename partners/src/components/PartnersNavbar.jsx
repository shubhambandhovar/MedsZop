import { Link } from "react-router-dom";
import { Users, Stethoscope, Store, Truck, Clock } from "lucide-react";
import { Button } from "./ui/button";

const PartnersNavbar = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              MedsZop <span className="text-blue-600">Partners</span>
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Healthcare Network Onboarding
            </span>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600">
          <Link to="/apply/doctor">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
              Doctor
            </Button>
          </Link>
          <Link to="/apply/pharmacy">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Store className="h-3.5 w-3.5 text-emerald-600" />
              Pharmacy
            </Button>
          </Link>
          <Link to="/apply/delivery">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Truck className="h-3.5 w-3.5 text-cyan-600" />
              Delivery
            </Button>
          </Link>
          <Link to="/application-status">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs ml-2 border-slate-300">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              Track Status
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default PartnersNavbar;

