import { ShieldCheck, FileText, Phone, Mail, Award, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const PartnersFooter = () => {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 text-xs">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-heading">
                MedsZop <span className="text-emerald-400">Partners</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs max-w-md">
              Institutional partner acquisition and credential verification infrastructure for Indian healthcare. Connecting certified retail chemists, registered medical practitioners, and cold-chain logistics heroes across Bharat.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-emerald-300 text-[11px] font-mono border border-slate-700">
                <Award className="h-3 w-3 text-emerald-400" />
                <span>CDSCO Compliant</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-emerald-300 text-[11px] font-mono border border-slate-700">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>NMC Guidelines</span>
              </span>
            </div>
          </div>

          {/* Partner Streams */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Partner Channels
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link to="/apply/pharmacist" className="hover:text-emerald-400 transition-colors">
                  Retail Chemists &amp; Pharmacies
                </Link>
              </li>
              <li>
                <Link to="/apply/doctor" className="hover:text-emerald-400 transition-colors">
                  Registered Medical Practitioners (RMP)
                </Link>
              </li>
              <li>
                <Link to="/apply/delivery" className="hover:text-emerald-400 transition-colors">
                  Last-Mile Delivery Partners
                </Link>
              </li>
              <li>
                <Link to="/status" className="hover:text-emerald-400 transition-colors font-semibold text-emerald-400">
                  Track Application Status &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Verification Protocol */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Compliance Protocols
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>Form 20 &amp; 21 Drug Licensing</li>
              <li>State Pharmacy Council Audits</li>
              <li>NMC / State Council Verification</li>
              <li>GDP Cold-Chain Standards</li>
              <li>Zero-Medical-Disclosure Transport</li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Partner Desk
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-[11px]">partners@medszop.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>+91 1800-MEDSZOP (Partner Desk)</span>
              </li>
              <li className="text-[11px] text-slate-500 pt-1">
                Mon - Sat, 09:00 AM - 06:00 PM IST
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory Governance Disclaimer */}
        <div className="mt-10 pt-6 border-t border-slate-800 text-[11px] text-slate-500 space-y-2 leading-relaxed">
          <p>
            <strong className="text-slate-400">Statutory Notice:</strong> MedsZop is a healthcare technology platform. Submission of an onboarding application does not constitute professional approval or authorization to dispense medicines, provide clinical advice, or fulfill medical shipments. All applications are subject to mandatory identity, credential, and regulatory verification by authorized reviewers.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
            <p>&copy; {new Date().getFullYear()} MedsZop Technologies India Pvt. Ltd. All rights reserved.</p>
            <p className="font-mono text-[10px] text-slate-600">
              ISO 9001:2015 Process Aligned &bull; Server TLS 1.3
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PartnersFooter;

