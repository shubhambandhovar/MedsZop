import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { LanguageSelector } from "./LanguageSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  LogOut,
  LayoutDashboard,
  Package,
  FileText,
  MessageSquare,
  Stethoscope,
  Moon,
  Sun,
  Globe,
  Settings,
  X,
  ScanLine,
  Pill,
  Zap,
  ChevronRight,
  ShieldCheck,
  MapPin
} from "lucide-react";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDark, setIsDark] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileDetails, setProfileDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const dark = localStorage.getItem("theme") === "dark";
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Track scroll position for subtle sticky elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleOpenProfile = async () => {
    setShowProfileModal(true);
    if (user?.role === "pharmacy") {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/pharmacy/dashboard`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        if (res.data.pharmacy) {
          setProfileDetails(res.data.pharmacy);
        }
      } catch (e) {
        console.error("Failed to fetch pharmacy profile:", e);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/medicines?search=${encodeURIComponent(query)}`);
    } else {
      navigate("/medicines");
    }
    setIsOpen(false);
  };

  const navLinks = [
    { href: "/medicines", label: "nav.medicines", icon: Pill },
    { href: "/prescription-scan", label: "nav.scan_prescription", auth: true, icon: ScanLine },
    { href: "/doctor-chat", label: "nav.ai_doctor", auth: true, icon: MessageSquare },
    { href: "/consult-doctor", label: "nav.consult_doctor", auth: true, icon: Stethoscope },
  ];

  const getDashboardLink = () => {
    if (!user?.role) return "/dashboard";
    const role = user?.role?.toLowerCase();
    switch (role) {
      case "admin":
        return "/admin";
      case "pharmacy":
        return "/pharmacy";
      case "delivery":
        return "/delivery";
      case "doctor":
        return "/doctor-dashboard";
      default:
        return "/dashboard";
    }
  };

  const logoDestination =
    user?.role === "delivery"
      ? "/delivery"
      : user?.role === "pharmacy"
      ? "/pharmacy"
      : "/";

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "py-2 sm:py-2.5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md"
            : "py-2 sm:py-3"
        }`}
      >
        <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10">
          <div
            className={`w-full rounded-2xl sm:rounded-3xl transition-all duration-300 ${
              isScrolled
                ? "backdrop-blur-2xl backdrop-saturate-180 bg-white/72 dark:bg-slate-900/72 border border-white/90 dark:border-white/15 shadow-glass-xl dark:shadow-glass-dark-xl px-3.5 sm:px-6"
                : "backdrop-blur-xl backdrop-saturate-180 bg-white/68 dark:bg-slate-900/68 border border-white/80 dark:border-white/12 shadow-glass dark:shadow-glass-dark hover:border-emerald-500/30 px-3.5 sm:px-6"
            }`}
          >
            <div className="flex h-16 sm:h-[68px] items-center justify-between gap-3 sm:gap-6">
            {/* 1. BRAND LOGO + HONEST CLINICAL ASSURANCE */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to={logoDestination}
                className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl min-h-[44px] min-w-[44px]"
                data-testid="logo-link"
                aria-label="MedsZop Home"
              >
                <img
                  src="https://res.cloudinary.com/dih1im0zi/image/upload/v1771198740/medszoplogo_hjhsxv.svg"
                  alt="MedsZop Logo"
                  className="h-8 sm:h-9 md:h-10 w-auto object-contain"
                  style={{ maxWidth: "150px" }}
                />
              </Link>

              {/* Factual Licensed Chemist Verification Badge */}
              <div
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-sm bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold shadow-xs"
                title="Licensed Indian Chemist & Pharmacist Verified under D&C Act"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>Licensed Pharmacy Network</span>
              </div>
            </div>

            {/* 2. MEDICINE SEARCH BAR (Desktop & Large Screens) */}
            <div className="hidden xl:flex flex-1 max-w-sm lg:max-w-md xl:max-w-lg mx-2">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <div className="relative flex items-center">
                  <Search
                    className="absolute left-3.5 h-4 w-4 text-emerald-600 dark:text-emerald-400 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search medicines, salts, brands..."
                    aria-label="Search medicines across MedsZop"
                    className="w-full h-10 pl-9 pr-9 rounded-full backdrop-blur-md bg-white/50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:bg-white/90 dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all duration-200 shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear medicine search"
                      className="absolute right-3 p-0.5 text-muted-foreground hover:text-foreground rounded-full transition-colors"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* 3. DESKTOP NAV LINKS (Wide Screens) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0">
              {(!user || user.role === "customer") &&
                navLinks.map(
                  (link) =>
                    (!link.auth || isAuthenticated) && (
                      <Link
                        key={link.href}
                        to={link.href}
                        className={`text-sm font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                          location.pathname === link.href
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs border border-emerald-500/25"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                        }`}
                        data-testid={`nav-${link.label.toLowerCase().replace(" ", "-")}`}
                      >
                        {t(link.label)}
                      </Link>
                    )
                )}
            </nav>

            {/* 4. RIGHT ACTION CONTROLS */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Quick Upload Rx Action Pill (Visible on xl+ screens) */}
              {(!user || user.role === "customer") && (
                <Link to="/prescription-scan" className="hidden xl:inline-flex shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full h-9 px-3.5 text-xs font-semibold border-primary/40 text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all gap-1.5 shadow-xs"
                    data-testid="navbar-upload-rx-btn"
                  >
                    <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t("nav.upload_rx")}</span>
                  </Button>
                </Link>
              )}

              {/* Pan-Indian Language Selector (Desktop & Tablet) */}
              <div className="hidden md:block">
                <LanguageSelector variant="navbar" />
              </div>

              {/* Theme Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-11 w-11 sm:h-9 sm:w-9 rounded-full text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                data-testid="theme-toggle"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>

              {/* Shopping Cart Button */}
              {(!user || user?.role === "customer") && (
                <Link to="/cart" data-testid="cart-link" className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 sm:h-9 sm:w-9 rounded-full text-slate-700 dark:text-slate-300 hover:text-primary hover:bg-primary/10 transition-all"
                    aria-label={`Shopping cart with ${cartCount} items`}
                  >
                    <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold bg-primary text-white border-2 border-white dark:border-slate-900 shadow-xs">
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}

              {/* User Menu / Auth Buttons */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 sm:h-9 sm:w-9 rounded-full border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 text-foreground hover:ring-2 hover:ring-primary/20 transition-all"
                      aria-label="User account menu"
                      data-testid="user-menu"
                    >
                      <User className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-1 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
                    {/* Clickable Profile Header */}
                    <div
                      className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      onClick={handleOpenProfile}
                    >
                      <p className="text-sm font-semibold text-foreground truncate">
                        {profileDetails?.name || user?.name || "My Account"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary">
                        {user?.role}
                      </span>
                    </div>

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link to={getDashboardLink()} className="flex items-center gap-2.5 text-sm py-2">
                        <LayoutDashboard className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span>{t("nav.dashboard")}</span>
                      </Link>
                    </DropdownMenuItem>

                    {user?.role === "customer" && (
                      <>
                        <DropdownMenuItem asChild className="rounded-xl">
                          <Link to="/orders" className="flex items-center gap-2.5 text-sm py-2">
                            <Package className="h-4 w-4 text-primary" aria-hidden="true" />
                            <span>{t("nav.my_orders")}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl">
                          <Link to="/prescription-scan" className="flex items-center gap-2.5 text-sm py-2">
                            <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                            <span>{t("nav.scan_prescription")}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl">
                          <Link to="/doctor-chat" className="flex items-center gap-2.5 text-sm py-2">
                            <MessageSquare className="h-4 w-4 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                            <span>{t("nav.ai_doctor")}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl">
                          <Link to="/consult-doctor" className="flex items-center gap-2.5 text-sm py-2">
                            <Stethoscope className="h-4 w-4 text-primary" aria-hidden="true" />
                            <span>{t("nav.consult_doctor")}</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link to="/settings" className="flex items-center gap-2.5 text-sm py-2">
                        <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span>{t("nav.settings")}</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="rounded-xl text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer py-2"
                    >
                      <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                      <span>{t("nav.log_out")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-xs font-semibold px-4 h-9"
                      data-testid="login-btn"
                    >
                      {t("nav.log_in")}
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button
                      size="sm"
                      className="rounded-full text-xs font-semibold px-5 h-9 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-glow-sm hover:shadow-emerald-glow transition-all"
                      data-testid="signup-btn"
                    >
                      {t("nav.get_started")}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Drawer Trigger (md:hidden) */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 sm:h-9 sm:w-9 rounded-full text-foreground"
                    aria-label="Open mobile navigation menu"
                    data-testid="mobile-menu"
                  >
                    <Menu className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[310px] sm:w-[360px] p-0 flex flex-col justify-between">
                  <div className="p-6 overflow-y-auto">
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
                      <img
                        src="https://res.cloudinary.com/dih1im0zi/image/upload/v1771198740/medszoplogo_hjhsxv.svg"
                        alt="MedsZop Logo"
                        className="h-8 w-auto object-contain"
                      />
                    </div>

                    {/* Authenticated User Banner */}
                    {isAuthenticated ? (
                      <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {user?.name?.[0] || "U"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                          <Link
                            to={getDashboardLink()}
                            onClick={() => setIsOpen(false)}
                            className="flex-1 text-center py-1.5 px-3 rounded-lg bg-white dark:bg-slate-800 text-xs font-semibold text-foreground shadow-xs"
                          >
                            Dashboard
                          </Link>
                          {user?.role === "customer" && (
                            <Link
                              to="/orders"
                              onClick={() => setIsOpen(false)}
                              className="flex-1 text-center py-1.5 px-3 rounded-lg bg-white dark:bg-slate-800 text-xs font-semibold text-foreground shadow-xs"
                            >
                              Orders
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 space-y-2">
                        <Link to="/register" onClick={() => setIsOpen(false)}>
                          <Button className="w-full rounded-full h-11 text-sm font-semibold shadow-sm">
                            {t("nav.get_started")}
                          </Button>
                        </Link>
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full rounded-full h-11 text-sm font-semibold">
                            {t("nav.log_in")}
                          </Button>
                        </Link>
                      </div>
                    )}

                    {/* Prescription Quick Action Banner */}
                    {(!user || user?.role === "customer") && (
                      <div className="mt-5">
                        <Link
                          to="/prescription-scan"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-200/50 dark:border-blue-800/50 hover:bg-primary/15 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary text-white flex items-center justify-center">
                              <ScanLine className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">Upload Prescription</p>
                              <p className="text-xs text-muted-foreground">AI scans & maps medicines</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </Link>
                      </div>
                    )}

                    {/* Navigation Link List */}
                    <nav className="mt-6 space-y-1">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                        Explore Platform
                      </p>
                      {navLinks.map(
                        (link) =>
                          (!link.auth || isAuthenticated) && (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                location.pathname === link.href
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60"
                              }`}
                            >
                              <link.icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                              <span>{t(link.label)}</span>
                            </Link>
                          )
                      )}
                      {isAuthenticated && (
                        <Link
                          to="/settings"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <Settings className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                          <span>Settings</span>
                        </Link>
                      )}
                    </nav>
                  </div>

                  {/* Drawer Footer Controls */}
                  <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <LanguageSelector variant="mobile" />

                    {isAuthenticated && (
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive text-sm h-10 px-3"
                      >
                        <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                        <span>{t("nav.log_out")}</span>
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* 5. MOBILE FULL-WIDTH SEARCH BAR (Visible below 768px for immediate access) */}
          <div className="md:hidden pb-3 pt-0.5">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 dark:text-emerald-400 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicines, brands, generics..."
                aria-label="Search medicines on mobile"
                className="w-full h-10 pl-9 pr-8 rounded-full backdrop-blur-md bg-white/60 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800/90 text-xs text-foreground placeholder:text-muted-foreground focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear mobile search query"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </form>
          </div>
          </div>
        </div>
      </header>

      {/* Profile Modal (Preserved for Pharmacy Details & User Verification) */}
      {showProfileModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[100] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
        >
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl w-full max-w-md relative border border-slate-200 dark:border-slate-800">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setShowProfileModal(false)}
              aria-label="Close profile modal"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
                <User className="w-10 h-10" aria-hidden="true" />
              </div>
              <h2 id="profile-modal-title" className="font-heading text-2xl font-bold text-foreground">
                {profileDetails?.name || user?.name || "User Profile"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
              <Badge variant="outline" className="mt-2.5 capitalize px-3 py-0.5 font-semibold text-xs border-primary/30 text-primary">
                {user?.role}
              </Badge>
            </div>

            {user?.role === "pharmacy" && profileDetails ? (
              <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  <span className="font-medium text-muted-foreground">Pharmacy:</span>
                  <span className="font-semibold text-foreground">{profileDetails.name}</span>

                  <span className="font-medium text-muted-foreground">Pharmacist:</span>
                  <span className="font-semibold text-foreground">{profileDetails.pharmacist_name || "N/A"}</span>

                  <span className="font-medium text-muted-foreground">License No:</span>
                  <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-foreground">
                    {profileDetails.license_number || "N/A"}
                  </span>

                  <span className="font-medium text-muted-foreground">Address:</span>
                  <span className="text-foreground">{profileDetails.address || "N/A"}</span>
                </div>
              </div>
            ) : user?.role === "pharmacy" ? (
              <div className="text-center py-4 text-muted-foreground text-sm">Loading pharmacy license details...</div>
            ) : null}

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowProfileModal(false)}
                className="rounded-full px-6 shadow-sm hover:shadow"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
