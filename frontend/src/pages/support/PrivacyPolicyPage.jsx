import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import {
  Database,
  Eye,
  Shield,
  Share2,
  UserCheck,
  Mail,
  Phone
} from "lucide-react";

const policies = [
  {
    icon: Database,
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    title: "1. Information We Collect",
    content: (
      <>
        <p className="text-slate-600 dark:text-slate-300 mb-3">
          We collect information to provide better healthcare services to all our users. The types of personal information we securely collect include:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
          <li><strong>Account Details:</strong> Name, Email Address, and Phone Number when you register an account.</li>
          <li><strong>Health & Medical Data:</strong> Prescription copies you upload, and any chat history with our AI Doctor feature.</li>
          <li><strong>Transaction Information:</strong> Details regarding medicines ordered, delivery addresses, and payment history.</li>
        </ul>
      </>
    )
  },
  {
    icon: Eye,
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "2. How We Use Your Information",
    content: (
      <>
        <p className="text-slate-600 dark:text-slate-300 mb-3">
          We use your secure data strictly to operate and improve the MedsZop platform:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
          <li>To successfully process your medicine orders and verify digital prescriptions.</li>
          <li>To facilitate communication between you and your delivery partner.</li>
          <li>To personalize AI Doctor interactions and improve medical guidance accuracy.</li>
          <li>To provide real-time updates regarding order tracking and platform changes.</li>
        </ul>
      </>
    )
  },
  {
    icon: Share2,
    color: "text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    title: "3. Third-Party Data Sharing",
    content: (
      <>
        <p className="text-slate-600 dark:text-slate-300 mb-3">
          <strong>We never sell your personal data.</strong> However, to fulfill our services, we share necessary data with trusted partners:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
          <li><strong>Partner Pharmacies:</strong> Only relevant order details and verified prescriptions are shared to dispense your medicine.</li>
          <li><strong>Delivery Partners:</strong> Only your name, phone number, and delivery address are provided strictly for order fulfillment.</li>
          <li><strong>Payment Processors:</strong> We use securely encrypted third-party gateways; we do not store your raw credit card data.</li>
        </ul>
      </>
    )
  },
  {
    icon: Shield,
    color: "text-purple-500",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    title: "4. Data Security",
    content: (
      <p className="text-slate-600 dark:text-slate-300">
        Your security is our absolute priority. We implement strict, industry-standard encryption protocols (SSL/TLS) to secure all data transitions. Additionally, all user passwords and uploaded medical prescriptions are housed in heavily encrypted, isolated environments to strictly prevent unauthorized access.
      </p>
    )
  },
  {
    icon: UserCheck,
    color: "text-rose-500",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    title: "5. Your Privacy Rights",
    content: (
      <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
        <li><strong>Right to Access:</strong> You can review and modify your account information at any time from your settings.</li>
        <li><strong>Right to Deletion:</strong> You have the legal right to request complete deletion of your account and associated personal data by contacting support.</li>
        <li><strong>Opt-Out Options:</strong> You may unsubscribe from marketing emails directly from your profile settings or by clicking 'unsubscribe' at the bottom of our emails.</li>
      </ul>
    )
  }
];

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Navbar />

      {/* Hero Header Section */}
      <div className="bg-primary/95 pt-20 pb-20 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-primary-foreground/90">
            We value your trust. Your medical and personal data is securely stored, heavily encrypted, and never sold.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 -mt-10 pb-16 flex-grow w-full relative z-10">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 p-6 md:p-10 space-y-12">

          <div className="text-sm text-slate-500 dark:text-slate-400 mb-8 pb-8 border-b border-slate-100 dark:border-slate-700">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>

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
            <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Questions about your privacy?</h2>
            <p className="text-slate-600 dark:text-slate-300">
              Our support team is perfectly equipped to assist you with any privacy or data concerns.
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

export default PrivacyPolicyPage;
