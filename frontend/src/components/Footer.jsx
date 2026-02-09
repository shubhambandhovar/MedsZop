import { Link } from "react-router-dom";
import { Pill, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Footer = () => {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <span className="font-heading text-2xl font-bold text-white">
                MedsZop
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              Your trusted digital healthcare partner. Fast medicine delivery, AI-powered health tools, and 24/7 support.
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/profile.php?id=61588069821433" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://x.com/MedsZopIndia" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://www.instagram.com/medszop/" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://www.linkedin.com/company/medszop" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors">
                <Linkedin className="h-4 w-4" />
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
                  <li><a href="#" className="text-sm hover:text-primary transition-colors">Partner with Us</a></li>
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
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">123 Healthcare Street, Bangalore, Karnataka 560001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm">+91 1800-123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm">support@medszop.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} MedsZop. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6 opacity-50" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6 opacity-50" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-6 opacity-50" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
