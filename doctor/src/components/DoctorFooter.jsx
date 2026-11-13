import { ShieldCheck, Lock, HeartPulse } from "lucide-react";

const DoctorFooter = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-5 text-xs text-slate-500 mt-auto">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-sky-700 shrink-0" />
          <p className="text-[12px] text-slate-600 font-medium">
            © 2026 MedsZop Clinical Telemedicine Suite. Governed by National Medical Commission (NMC) Telemedicine Practice Guidelines.
            <span className="hidden md:inline ml-2 text-slate-400">| Digital Rx requires registered practitioner authorization.</span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1 text-slate-500">
            <Lock className="h-3 w-3 text-sky-700" />
            DISHA & HIPAA Clinical Encryption Active
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-700">
            <HeartPulse className="h-3 w-3 text-emerald-600" />
            Audit Logging Active
          </span>
        </div>
      </div>
    </footer>
  );
};

export default DoctorFooter;
