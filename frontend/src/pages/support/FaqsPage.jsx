import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";



import { useTranslation } from "react-i18next";
const FaqsPage = () => {
  const { t } = useTranslation();
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">{t("support.faqs.title")}</h1>

        <div className="space-y-4">
          <p><strong>Q:</strong> {t("support.faqs.q1")}</p>
          <p><strong>A:</strong> {t("support.faqs.a1")}</p>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default FaqsPage;
