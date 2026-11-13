import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Package,
  FileText,
  Stethoscope,
  CreditCard,
  ShieldCheck,
  Truck,
  Search,
  Pill,
  MessageSquare,
  UserPlus,
  Mail,
  Phone
} from "lucide-react";

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../../components/ui/accordion";

const helpCategories = [
  {
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    title: "Orders & Delivery",
    questions: [
      {
        q: "How do I order medicines on MedsZop?",
        a: "Simply search for your medicines, add them to your cart, and proceed to checkout. If your medicines require a prescription, you’ll be prompted to upload it before completing the order."
      },
      {
        q: "How fast will I get my medicines?",
        a: "We aim for lightning-fast delivery! Most orders are delivered to your doorstep within 30 to 60 minutes, depending on the availability at our verified local partner pharmacies."
      },
      {
        q: "How can I track my order?",
        a: "You can track your order in real-time by visiting the Track Order section in your account. We will also send you email notifications at every step—from order confirmation to final delivery."
      },
      {
        q: "Can I cancel my order?",
        a: "Yes, you can cancel your order as long as it has not been accepted and processed by our pharmacy partner. Once the order is packed or out for delivery, cancellations are no longer possible."
      }
    ]
  },
  {
    icon: FileText,
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "Prescription & Medicines",
    questions: [
      {
        q: "Why do I need to upload a prescription?",
        a: "Government regulations require a valid doctor’s prescription for certain scheduled medicines. For over-the-counter (OTC) products and general healthcare items, no prescription is required."
      },
      {
        q: "How do I upload my prescription?",
        a: "You can easily click a clear photo or upload a scanned copy of your prescription during the checkout process, or by visiting our dedicated Upload Prescription page."
      },
      {
        q: "Are the medicines genuine?",
        a: "Absolutely. We partner only with verified, licensed local pharmacies that meet strict safety standards. Every medicine delivered to you is 100% genuine and safe."
      }
    ]
  },
  {
    icon: Stethoscope,
    color: "text-purple-500",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    title: "AI Doctor & Doctor Consultation",
    questions: [
      {
        q: "What is the AI Doctor and how can it help me?",
        a: "Our AI Doctor is a 24/7 intelligent chat assistant designed to answer general health queries, explain medicine side effects, and provide helpful guidance based on your symptoms."
      },
      {
        q: "Can the AI Doctor write a prescription for me?",
        a: "No. The AI Doctor is strictly for informational guidance and cannot replace a real diagnosis. It cannot prescribe medicines or provide professional medical advice."
      },
      {
        q: "How do I consult a human doctor?",
        a: "If you need a professional diagnosis, a personalized treatment plan, or a valid prescription, you can easily connect with a certified healthcare professional through our Consult Doctor section."
      }
    ]
  },
  {
    icon: CreditCard,
    color: "text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    title: "Payments & Refunds",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major secure payment methods, including credit/debit cards, UPI, net banking, and popular mobile wallets."
      },
      {
        q: "How do refunds work if my order is cancelled?",
        a: "If an order is cancelled or fails, we automatically initiate a full refund. The amount will reflect in your original payment method within 3 to 5 business days, depending on your bank."
      },
      {
        q: "Are my payment details secure?",
        a: "Yes. We use industry-standard encryption and highly secure payment gateways to ensure your financial information is completely protected."
      }
    ]
  },
  {
    icon: ShieldCheck,
    color: "text-rose-500",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    title: "Account & Security",
    questions: [
      {
        q: "How do I create an account?",
        a: "Creating an account is fast and easy. Click on the profile icon at the top of the page and sign up using your email address or Google account."
      },
      {
        q: "Is my personal health data safe with MedsZop?",
        a: "Your privacy is our top priority. All personal information and uploaded prescriptions are encrypted and securely stored. We ensure your data is only shared with verified partners required to fulfill your order."
      }
    ]
  },
  {
    icon: Truck,
    color: "text-cyan-500",
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    title: "Pharmacy & Delivery Partner Help",
    questions: [
      {
        q: "How are pharmacies and delivery partners verified?",
        a: "Every pharmacy must pass a stringent background check and hold valid medical licenses to join our network. Similarly, our delivery partners are carefully vetted and trained to handle medical packages safely."
      },
      {
        q: "I want to join MedsZop as a partner. How do I apply?",
        a: "We’re always looking to expand our trusted ecosystem! Visit the Partner with Us section at the bottom of the page to apply as a Pharmacy or a Delivery Partner."
      }
    ]
  }
];

const quickLinks = [
  { icon: Search, label: "Browse Medicines", to: "/medicines" },
  { icon: FileText, label: "Upload Prescription", to: "/prescription-scan" },
  { icon: Package, label: "Track Order", to: "/orders" },
  { icon: MessageSquare, label: "AI Doctor Chat", to: "/doctor-chat" },
  { icon: Stethoscope, label: "Consult Doctor", to: "/consult" },
  { icon: UserPlus, label: "Partner with Us", to: "/partner" }
];

const HelpCenterPage = () => {
  const { t } = useTranslation(['support', 'common']);
  return (
    <div className="min-h-screen glass-ambient-mesh flex flex-col">
      <Navbar />

      {/* Header Section */}
      <div className="relative overflow-hidden pt-16 pb-20 text-center px-4 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 text-white border-b border-white/10 shadow-xl">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight font-heading">
            {t("help_center.title", "Help Center")}
          </h1>
          <p className="text-sm sm:text-base text-primary-foreground/90 max-w-xl mx-auto">
            {t("help_center.subtitle", "Find answers to common questions and get support for your orders, payments, and account.")}
          </p>

          {/* Quick Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-8 sm:mt-10 max-w-4xl mx-auto">
            {quickLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.to}
                className="bg-white/10 hover:bg-white/20 border border-white/20 transition-all rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 text-white group active-press"
              >
                <link.icon className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 -mt-8 pb-16 flex-grow w-full relative z-10">
        <div className="bg-card text-foreground rounded-2xl shadow-sm border border-border p-5 sm:p-8">

          <div className="space-y-10 sm:space-y-12">
            {helpCategories.map((category, idx) => (
              <div key={idx} id={`category-${idx}`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`p-2.5 sm:p-3 rounded-xl ${category.bg} ${category.color}`}>
                    <category.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-foreground">
                    {category.title}
                  </h2>
                </div>

                <Accordion type="multiple" className="w-full space-y-2">
                  {category.questions.map((item, qIdx) => (
                    <AccordionItem
                      key={qIdx}
                      value={`${idx}-${qIdx}`}
                      className="border border-border/70 rounded-xl px-4 bg-muted/30"
                    >
                      <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline hover:text-primary transition-colors py-3.5">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-4 leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

        </div>

        {/* Support Contact Section */}
        <div className="mt-8 sm:mt-10 bg-card rounded-2xl shadow-xs border border-border p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold font-heading mb-2 text-foreground">Still Need Help?</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
            Our dedicated support team is here for you. If you couldn't find the answer you were looking for, don't hesitate to reach out!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:support@medszop.site" className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-blue-500/10 text-primary hover:bg-primary/20 transition-colors text-xs sm:text-sm font-semibold active-press">
              <Mail className="h-4 w-4" />
              <span>support@medszop.site</span>
            </a>

            <a href="tel:+917354255105" className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs sm:text-sm font-semibold active-press">
              <Phone className="h-4 w-4" />
              <span>+91 7354255105</span>
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-5">🕒 24/7 Digital Health Support</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HelpCenterPage;
