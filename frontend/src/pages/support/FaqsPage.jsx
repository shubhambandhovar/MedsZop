import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../../components/ui/accordion";

const faqs = [
  {
    category: "General Information",
    questions: [
      {
        q: "What is MedsZop?",
        a: "MedsZop is India's smartest health companion, offering fast medicine delivery, prescription upload services, and 24/7 AI-powered health guidance. Our platform connects you with verified local pharmacies for authentic healthcare products."
      },
      {
        q: "How do I order medicines online on MedsZop?",
        a: "You can easily order medicines by searching for your required items, adding them to your cart, and proceeding to checkout. If your medicine requires a prescription, you will be prompted to upload it before completing the order."
      },
      {
        q: "Is MedsZop available 24/7?",
        a: "Yes, our platform and AI Doctor are accessible 24/7. However, actual medicine delivery times rely on the operating hours of your local verified pharmacy partners."
      }
    ]
  },
  {
    category: "Prescription & Compliance",
    questions: [
      {
        q: "Do I need a prescription to buy medicines?",
        a: "Yes, certain schedule medicines legally require a valid doctor's prescription. For over-the-counter (OTC) products and general wellness items, no prescription is needed."
      },
      {
        q: "How can I upload my prescription?",
        a: "You can easily achieve your prescription upload by taking a clear photo or scan of your valid prescription and submitting it securely during checkout or via the dedicated 'Scan Prescription' page."
      },
      {
        q: "Is it safe to upload my medical prescription?",
        a: "Absolutely. Your privacy represents our highest priority. All uploaded prescriptions are encrypted and shared exclusively with our verified network of pharmacy partners strictly for fulfilling your order."
      }
    ]
  },
  {
    category: "Orders & Delivery",
    questions: [
      {
        q: "How fast is the medicine delivery?",
        a: "We pride ourselves on exceptionally fast medicine delivery. Most online medicine delivery orders are fulfilled and brought to your doorstep within 30 to 60 minutes based on your specific location."
      },
      {
        q: "Can I track my order status?",
        a: "Yes, you can track your order in real-time through the 'Track Order' section in your account. You will also automatically receive email updates at every stage of your delivery."
      }
    ]
  },
  {
    category: "AI Doctor vs Human Doctor",
    questions: [
      {
        q: "What is the AI Doctor feature?",
        a: "The AI Doctor is our 24/7 intelligent chat assistant. It can answer general health inquiries, explain medicinal side effects, and provide helpful guidance based on symptoms."
      },
      {
        q: "Can the AI Doctor prescribe medicines?",
        a: "No. The AI Doctor provides informational health guidance only. It does not replace professional medical advice, nor can it issue medical prescriptions."
      },
      {
        q: "How can I book a doctor consultation?",
        a: "You can schedule a professional doctor consultation directly on our platform by navigating to the 'Consult Doctor' section to connect with a certified healthcare professional."
      },
      {
        q: "What is the difference between the AI Doctor and human doctor consultation?",
        a: "The AI Doctor gives immediate, automated answers to general health questions. A human doctor consultation provides personalized medical diagnoses, proper treatment plans, and verified prescriptions."
      }
    ]
  },
  {
    category: "Pharmacy & Delivery Partners",
    questions: [
      {
        q: "Are the pharmacies verified?",
        a: "Yes! Every pharmacy on the MedsZop network undergoes a strict verification process to ensure they hold correct licenses, adhere to safety standards, and offer 100% genuine medical products."
      },
      {
        q: "Who delivers my medicines?",
        a: "Your orders are delivered by our dedicated and verified delivery partners who are specially trained to handle medical packages safely, securely, and confidentially."
      }
    ]
  },
  {
    category: "Account & Security",
    questions: [
      {
        q: "How do I create an account?",
        a: "Simply click the profile icon at the top right of the page and follow the prompt to register quickly using your email or Google account."
      },
      {
        q: "Are my personal health details secure?",
        a: "Yes. We use industry-standard encryption protocols to ensure that all your passwords, health data, and personal information are completely secure across our platform."
      }
    ]
  },
  {
    category: "Payments & Refunds",
    questions: [
      {
        q: "What payment methods are accepted?",
        a: "We accept multiple secure payment methods including credit/debit cards, UPI, and common digital wallets to make your checkout experience as seamless as possible."
      },
      {
        q: "Can I cancel my online medicine order?",
        a: "Yes, you can completely cancel your order as long as the pharmacy partner has not yet accepted and processed it."
      },
      {
        q: "How do refunds work?",
        a: "If your order fails or gets cancelled within the accepted timeframe, the refund is automatically initiated and typically reflects in your original payment method within a few business days."
      }
    ]
  }
];

const FaqsPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-primary/10 py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Find simple, clear answers to common questions about our online medicine delivery, AI consultations, and more.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12 flex-grow w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">

          {faqs.map((section, idx) => (
            <div key={idx} className="mb-10 last:mb-0">
              <h2 className="text-2xl font-semibold mb-6 text-primary border-b pb-2">
                {section.category}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {section.questions.map((item, qIdx) => (
                  <AccordionItem key={qIdx} value={`${idx}-${qIdx}`}>
                    <AccordionTrigger className="text-left text-base font-medium">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

        </div>

        {/* SEO context text (invisible to users but readable by screen readers/crawlers) */}
        <div className="sr-only">
          Keywords: online medicine delivery, fast medicine delivery, prescription upload, doctor consultation, affordable pharmacy, genuine medicines.
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FaqsPage;
