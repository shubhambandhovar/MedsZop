import { Link } from "react-router-dom";
import { Pill, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Footer = () => {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-6">
              <img
                src="https://res.cloudinary.com/dih1im0zi/image/upload/v1771198740/medszoplogo_hjhsxv.svg"
                alt="MedsZop Logo"
                className="h-16 w-auto object-contain block"
                style={{ maxWidth: '280px', marginTop: 0, marginBottom: 0 }}
              />
            </Link>
            <p className="text-sm leading-relaxed mb-6 text-slate-400 font-body">
              India's transparent healthcare network. Verified prescription medicines, licensed community pharmacy partners, and bioequivalent generic substitution under CDSCO guidelines.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=61588069821433"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow MedsZop on Facebook"
                className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary text-slate-300 hover:text-white transition-all shadow-xs hover:scale-105"
              >
                <Facebook className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://x.com/MedsZopIndia"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow MedsZop on Twitter/X"
                className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary text-slate-300 hover:text-white transition-all shadow-xs hover:scale-105"
              >
                <Twitter className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://www.instagram.com/medszop/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow MedsZop on Instagram"
                className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary text-slate-300 hover:text-white transition-all shadow-xs hover:scale-105"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com/company/medszop"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow MedsZop on LinkedIn"
                className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary text-slate-300 hover:text-white transition-all shadow-xs hover:scale-105"
              >
                <Linkedin className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {role === "pharmacy" ? (
                <>
                  <li><Link to="/pharmacy" className="text-sm hover:text-primary transition-colors">Dashboard</Link></li>
                  <li><Link to="/pharmacy" className="text-sm hover:text-primary transition-colors">Inventory</Link></li>
                  <li><Link to="/pharmacy" className="text-sm hover:text-primary transition-colors">Orders</Link></li>
                  <li><Link to="/settings" className="text-sm hover:text-primary transition-colors">Settings</Link></li>
                </>
              ) : role === "delivery" ? (
                <>
                  <li><Link to="/delivery" className="text-sm hover:text-primary transition-colors">Dashboard</Link></li>
                  <li><Link to="/delivery" className="text-sm hover:text-primary transition-colors">Active Deliveries</Link></li>
                  <li><Link to="/delivery" className="text-sm hover:text-primary transition-colors">Earnings History</Link></li>
                  <li><Link to="/settings" className="text-sm hover:text-primary transition-colors">Profile</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/medicines" className="text-sm hover:text-primary transition-colors">Browse Medicines</Link></li>
                  <li><Link to="/prescription-scan" className="text-sm hover:text-primary transition-colors">Upload Prescription</Link></li>
                  <li><Link to="/doctor-chat" className="text-sm hover:text-primary transition-colors">AI Doctor Chat</Link></li>
                  <li><Link to="/orders" className="text-sm hover:text-primary transition-colors">Track Order</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Support */}

          <div>
            <h4 className="font-heading font-semibold text-white mb-6">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/help" className="text-sm hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>

              <li>
                <Link to="/faqs" className="text-sm hover:text-primary transition-colors">
                  FAQs
                </Link>
              </li>

              <li>
                <Link to="/refund-policy" className="text-sm hover:text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>

              <li>
                <Link to="/privacy-policy" className="text-sm hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link to="/terms" className="text-sm hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li>
                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-primary transition-colors">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Working Remotely</span>
                </a>
              </li>
              <li>
                <a href="tel:+917354255105" className="flex items-center gap-3 hover:text-primary transition-colors">
                  <Phone className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm">+91 7354255105</span>
                </a>
              </li>
              <li>
                <a href="mailto:support@medszop.com" className="flex items-center gap-3 hover:text-primary transition-colors">
                  <Mail className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm">support@medszop.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} MedsZop. All rights reserved. • Licensed Healthcare & Pharmacy Aggregator operating in compliance with the Drugs and Cosmetics Act, 1940 and IT Act, 2000.
          </p>
          <div className="flex items-center gap-5">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Secure Payments</span>
            <img src="https://upload.wikimedia.org/wikipedia/commons/9/98/Visa_Inc._logo_%282005%E2%80%932014%29.svg" alt="Visa" className="h-4 opacity-60 hover:opacity-100 transition-opacity" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" className="h-4 opacity-60 hover:opacity-100 transition-opacity" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-4 opacity-60 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
