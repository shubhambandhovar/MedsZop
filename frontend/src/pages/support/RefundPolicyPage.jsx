import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";



const RefundPolicyPage = () => {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Refund Policy</h1>
        <p className="text-muted-foreground">
          Refunds are processed for damaged or incorrect medicines as per policy.
        </p>
      </main>
      <Footer />
    </>
  );
};

export default RefundPolicyPage;
