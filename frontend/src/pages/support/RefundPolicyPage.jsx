import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import {
  RefreshCw,
  XCircle,
  Ban,
  CreditCard,
  ShieldCheck,
  Mail,
  Phone
} from "lucide-react";

const policies = [
  {
    icon: XCircle,
    color: "text-rose-500",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    title: "Cancellation Policy",
    content: (
      <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
        <li>Orders can be cancelled at any time <strong>before</strong> they are accepted and packed by our partner pharmacy.</li>
        <li>To cancel an order, please visit the "Track Order" section in your account dashboard.</li>
        <li>Once an order is marked as "Out for Delivery", it cannot be cancelled via the app. In exceptional cases, please contact support.</li>
        <li>If you accidentally placed an incorrect order, please cancel it immediately and place a new one.</li>
      </ul>
    )
  },
  {
    icon: RefreshCw,
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    title: "Return Policy",
    content: (
      <>
        <p className="text-slate-600 dark:text-slate-300 mb-3">
          We accept returns under the following specific circumstances within <strong>3 days</strong> of delivery:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
          <li>The delivered medicine does not match your order (wrong item or incorrect dosage).</li>
          <li>The delivered products have passed or are exceptionally near their expiry date.</li>
          <li>The packaging is significantly damaged or shows signs of tampering upon arrival.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-500 italic border-l-2 border-slate-300 pl-3">
          * Note: Please ensure that returned items are entirely unused and remain in their original packaging with all manufacturer seals fully intact.
        </p>
      </>
    )
  },
  {
    icon: Ban,
    color: "text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    title: "Non-Returnable Items",
    content: (
      <>
        <p className="text-slate-600 dark:text-slate-300 mb-2">
          For health, hygiene, and collective safety reasons, the following products <strong>cannot</strong> be returned once successfully delivered:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
          <li>Injections, vaccines, and any strictly temperature-controlled items.</li>
          <li>Opened, altered, or partially used medicines and syrups.</li>
          <li>Personal care, sanitary, and hygiene-related products.</li>
          <li>Wearable healthcare devices (unless there is a verified and reported manufacturing defect).</li>
        </ul>
      </>
    )
  },
  {
    icon: CreditCard,
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "Refund Process & Timelines",
    content: (
      <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
        <li><strong>Cancelled Orders:</strong> Refunds for cancelled orders are initiated immediately upon successful cancellation.</li>
        <li><strong>Returned Orders:</strong> Refunds are initiated only after the returned item successfully reaches our partner pharmacy and passes a rigorous quality inspection.</li>
        <li><strong>Processing Time:</strong> Once initiated from our end, please allow <strong>3 to 5 business days</strong> for the refund amount to securely reflect in your original payment method.</li>
        <li><strong>Cash on Delivery (COD):</strong> If you paid via COD, the refund will be credited to your MedsZop digital wallet or transferred to a verified bank account you provide.</li>
      </ul>
    )
  },
  {
    icon: ShieldCheck,
    color: "text-purple-500",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    title: "Human Doctor Consultations",
    content: (
      <p className="text-slate-600 dark:text-slate-300">
        If a doctor is unable to attend a scheduled consultation or cancels the appointment, your consultation fee will be refunded in full automatically. Refund requests for completed consultations are subject to review by our medical grievance board.
      </p>
    )
  }
];

const RefundPolicyPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Navbar />

      {/* Hero Header Section */}
      <div className="bg-primary pt-20 pb-20 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Refund & Return Policy
          </h1>
          <p className="text-lg text-primary-foreground/90">
            Clear, transparent processes for cancellations, returns, and refunds ensuring a worry-free experience on MedsZop.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 -mt-10 pb-16 flex-grow w-full relative z-10">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 p-6 md:p-10 space-y-12">

          {policies.map((policy, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-6 items-start border-b border-slate-100 dark:border-slate-700 pb-10 last:border-0 last:pb-0">
              <div className={`p-4 rounded-xl shrink-0 ${policy.bg} ${policy.color}`}>
                <policy.icon className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  {policy.title}
                </h2>
                <div className="leading-relaxed">
                  {policy.content}
                </div>
              </div>
            </div>
          ))}

        </div>

        {/* Support Section */}
        <div className="mt-10 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Need help with a refund?</h2>
            <p className="text-slate-600 dark:text-slate-300">
              Our support team is perfectly equipped to assist you with any return or refund queries.
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

export default RefundPolicyPage;
