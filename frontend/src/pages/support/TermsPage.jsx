import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  CheckSquare,
  User,
  AlertTriangle,
  Truck,
  Ban,
  Edit,
  Mail,
  Phone
} from "lucide-react";

const terms = [
  {
    icon: CheckSquare,
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    title: "1. Acceptance of Terms",
    content: (
      <p className="text-slate-600 dark:text-slate-300">
        By accessing, browsing, or using the MedsZop platform, you acknowledge that you have read, understood, and entirely agree to be legally bound by these Terms of Service. If you do not agree to these terms, please refrain from using our platform.
      </p>
    )
  },
  {
    icon: User,
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "2. User Accounts & Responsibilities",
    content: (
      <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
        <li>You must be at least 18 years of age to register and order medicines through our platform independently.</li>
        <li>You are responsible for maintaining the strict confidentiality of your account credentials and passwords.</li>
        <li>You agree to provide true, accurate, and completely updated information when placing orders or updating your profile.</li>
      </ul>
    )
  },
  {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    title: "3. Medical Disclaimer",
    content: (
      <>
        <p className="text-slate-600 dark:text-slate-300 mb-3 font-semibold">
          IMPORTANT: MedsZop is not a replacement for professional medical advice or emergency services.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
          <li><strong>AI Doctor:</strong> Our AI Chat is designed strictly for informational guidance. It does not diagnose, treat, or legally prescribe medications.</li>
          <li><strong>Consultations:</strong> Any advice received from human doctors on our platform is provided by independent licensed practitioners and not by MedsZop directly.</li>
          <li><strong>Prescriptions:</strong> You must always rely on real medical advice from qualified healthcare providers before starting or altering any medicinal dosage.</li>
        </ul>
      </>
    )
  },
  {
    icon: Truck,
    color: "text-purple-500",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    title: "4. Ordering, Delivery & Prescriptions",
    content: (
      <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
        <li>Certain medications require a valid, government-recognized digital or scanned prescription uploaded by the user. Orders will be summarily rejected if the prescription is invalid or fraudulent.</li>
        <li>While we intend to fulfill orders within expected timelines, delivery times are simply estimates dependent strictly on the local pharmacy's stock and uncontrollable environmental conditions.</li>
      </ul>
    )
  },
  {
    icon: Ban,
    color: "text-rose-500",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    title: "5. Prohibited Activities",
    content: (
      <>
        <p className="text-slate-600 dark:text-slate-300 mb-3">
          As a user of MedsZop, you strictly agree <strong>not</strong> to:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
          <li>Upload falsified, forged, or unauthorized medical prescriptions to purchase restricted drugs.</li>
          <li>Attempt to exploit, hack, or disrupt the platform’s security networks or user databases.</li>
          <li>Resell, distribute, or use medicines purchased on MedsZop for unauthorized commercial purposes.</li>
        </ul>
      </>
    )
  },
  {
    icon: Edit,
    color: "text-cyan-500",
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    title: "6. Modifications to Terms",
    content: (
      <p className="text-slate-600 dark:text-slate-300">
        MedsZop exclusively reserves the right to appropriately revise these Terms of Service at any given time without prior notice. Any significant changes will be visibly published on this page. Your continued use of the platform after updates signifies your total acceptance of the new terms.
      </p>
    )
  }
];

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Navbar />

      {/* Hero Header Section */}
      <div className="bg-primary/95 pt-20 pb-20 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-primary-foreground/90">
            Please read these terms carefully before utilizing MedsZop's healthcare ecosystem.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 -mt-10 pb-16 flex-grow w-full relative z-10">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 p-6 md:p-10 space-y-12">

          <div className="text-sm text-slate-500 dark:text-slate-400 mb-8 pb-8 border-b border-slate-100 dark:border-slate-700">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>

          {terms.map((term, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-6 items-start border-b border-slate-100 dark:border-slate-700 pb-10 last:border-0 last:pb-0">
              <div className={`p-4 rounded-xl shrink-0 ${term.bg} ${term.color}`}>
                <term.icon className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  {term.title}
                </h2>
                <div className="leading-relaxed">
                  {term.content}
                </div>
              </div>
            </div>
          ))}

        </div>

        {/* Support Section */}
        <div className="mt-10 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Have questions about our terms?</h2>
            <p className="text-slate-600 dark:text-slate-300">
              Our support team is here to clarify any confusion regarding our service agreements.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
            <a href="mailto:support@medszop.site" className="flex items-center justify-center sm:justify-start gap-2 px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-sm font-medium">
              <Mail className="h-4 w-4 text-primary" />
              <span>Email Support</span>
            </a>
            <a href="tel:+917354255105" className="flex items-center justify-center sm:justify-start gap-2 px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-sm font-medium">
              <Phone className="h-4 w-4 text-primary" />
              <span>Call Us</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsPage;
