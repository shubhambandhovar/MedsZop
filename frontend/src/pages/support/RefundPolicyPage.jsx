import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";



import { useTranslation } from "react-i18next";
const RefundPolicyPage = () => {
  const { t } = useTranslation();
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">{t("support.refund.title")}</h1>
        <p className="text-muted-foreground">
          {t("support.refund.desc")}
        </p>
      </main>
      <Footer />
    </>
  );
};

export default RefundPolicyPage;
