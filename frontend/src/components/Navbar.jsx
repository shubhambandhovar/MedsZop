import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
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
import axios from "axios";
import {
  Pill,
  ShoppingCart,
  User,
  Menu,
  LogOut,
  LayoutDashboard,
  Package,
  FileText,
  MessageSquare,
  Moon,
  Sun,
  Globe,
  Settings,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileDetails, setProfileDetails] = useState(null);

  useEffect(() => {
    const dark = localStorage.getItem("theme") === "dark";
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleOpenProfile = async () => {
    setShowProfileModal(true);
    if (user?.role === 'pharmacy') {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/pharmacy/dashboard`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.pharmacy) {
          setProfileDetails(res.data.pharmacy);
        }
      } catch (e) {
        console.error("Failed to fetch profile", e);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { href: "/medicines", label: "nav.medicines" },
    { href: "/prescription-scan", label: "nav.scan_prescription", auth: true },
    { href: "/doctor-chat", label: "nav.ai_doctor", auth: true },
  ];

  // Helper to handle language change via Google Translate Cookie
  // Common languages for the dropdown
  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi (हिंदी)" },
    { code: "bn", name: "Bengali (বাংলা)" },
  ];

  /*
    Other languages can be added here if translations are available in i18n.js
    { code: "te", name: "Telugu (తెలుగు)" },
    { code: "mr", name: "Marathi (मराठी)" },
    ...
  */

  // Common languages for the dropdown


  const getDashboardLink = () => {
    if (!user?.role) return "/dashboard";

    const role = user?.role?.toLowerCase();

    if (role === 'doctor') return "/doctor-dashboard";

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


  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link
              to={user?.role === "delivery" ? "/delivery" : user?.role === "pharmacy" ? "/pharmacy" : "/"}
              className="flex items-center gap-2"
              data-testid="logo-link"
            >
              <img
                src="https://res.cloudinary.com/dih1im0zi/image/upload/v1771198740/medszoplogo_hjhsxv.svg"
                alt="MedsZop Logo"
                className="h-20 w-auto object-contain min-w-[120px]"
                style={{ maxWidth: '190px' }}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {(!user || user.role === "customer") && navLinks.map(
                (link) =>
                  (!link.auth || isAuthenticated) && (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                      data-testid={`nav-${link.label.toLowerCase().replace(" ", "-")}`}
                    >
                      {t(link.label)}
                    </Link>
                  ),
              )}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Language Toggle - Custom Select */}
              <Select onValueChange={(value) => i18n.changeLanguage(value)} defaultValue={i18n.language || "en"}>
                <SelectTrigger className="w-[140px] h-9">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
                data-testid="theme-toggle"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              {/* Cart */}
              {isAuthenticated && user?.role === "customer" && (
                <Link to="/cart" data-testid="cart-link">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 relative"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
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
                      className="h-9 w-9"
                      data-testid="user-menu"
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {/* Make Header Clickable */}
                    <div
                      className="px-2 py-1.5 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                      onClick={handleOpenProfile}
                    >
                      <p className="text-sm font-medium">{profileDetails?.name || user?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center gap-2"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {t('nav.dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "customer" && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/orders" className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {t('nav.my_orders')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            to="/prescription-scan"
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            {t('nav.scan_prescription')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/doctor-chat" className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            {t('nav.ai_doctor')}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('nav.log_out')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" data-testid="login-btn">
                      {t('nav.log_in')}
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button
                      size="sm"
                      className="rounded-full"
                      data-testid="signup-btn"
                    >
                      {t('nav.get_started')}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" data-testid="mobile-menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <nav className="flex flex-col gap-4 mt-8">
                    {navLinks.map(
                      (link) =>
                        (!link.auth || isAuthenticated) && (
                          <Link
                            key={link.href}
                            to={link.href}
                            onClick={() => setIsOpen(false)}
                            className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {t(link.label)}
                          </Link>
                        ),
                    )}
                    {!isAuthenticated && (
                      <>
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full">
                            {t('nav.log_in')}
                          </Button>
                        </Link>
                        <Link to="/register" onClick={() => setIsOpen(false)}>
                          <Button className="w-full">{t('nav.get_started')}</Button>
                        </Link>
                      </>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-md relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setShowProfileModal(false)}>
              <X className="h-4 w-4" />
            </Button>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <Badge variant="outline" className="mt-2 capitalize">{user?.role}</Badge>
            </div>

            {user?.role === 'pharmacy' && profileDetails ? (
              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  <span className="font-medium text-muted-foreground">Pharmacy Name:</span>
                  <span className="font-semibold">{profileDetails.name}</span>

                  <span className="font-medium text-muted-foreground">Pharmacist:</span>
                  <span className="font-semibold">{profileDetails.pharmacist_name || "N/A"}</span>

                  <span className="font-medium text-muted-foreground">License No:</span>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{profileDetails.license_number || "N/A"}</span>

                  <span className="font-medium text-muted-foreground">Address:</span>
                  <span>{profileDetails.address || "N/A"}</span>
                </div>
              </div>
            ) : user?.role === 'pharmacy' ? (
              <div className="text-center py-4 text-muted-foreground">Loading specific details...</div>
            ) : null}

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowProfileModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
