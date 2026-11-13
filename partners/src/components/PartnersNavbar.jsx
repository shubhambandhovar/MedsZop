import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Building2,
  Stethoscope,
  Truck,
  Search,
  Menu,
  X,
  ExternalLink,
  Award,
  Sparkles
} from "lucide-react";
import { Button } from "./ui/button";

const PartnersNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Pharmacy Network", href: "/apply/pharmacist", icon: Building2 },
    { name: "Clinical Registry", href: "/apply/doctor", icon: Stethoscope },
    { name: "Logistics Fleet", href: "/apply/delivery", icon: Truck },
    { name: "Track Application", href: "/status", icon: Search },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      {/* Top Sovereign Health Banner */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 sm:px-6">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-200">
              Bharat Swasthya Partner Portal &bull; Institutional Credentialing System
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Drugs &amp; Cosmetics Act, 1940 Aligned</span>
            <span>&bull;</span>
            <span>NMC Telemedicine Guidelines Aligned</span>
            <span>&bull;</span>
            <span className="text-emerald-400 font-mono">support@medszop.com</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 font-heading">
                MedsZop <span className="text-emerald-600">Partners</span>
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                VERIFIED NETWORK
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Pharmacy &bull; Medical Practitioner &bull; Logistics
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-emerald-700" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <Link to="/status">
            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 border-slate-300">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <span>Track Application</span>
            </Button>
          </Link>
          <a
            href="https://medszop.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1 transition-colors px-2 py-1"
          >
            <span>MedsZop Health</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-emerald-700" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100">
            <Link to="/status" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-emerald-600 text-white font-semibold min-h-[44px]">
                <Search className="h-4 w-4 mr-2" />
                Track Submitted Application
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default PartnersNavbar;

