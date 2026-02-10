import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";



const FaqsPage = () => {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>

        <div className="space-y-4">
          <p><strong>Q:</strong> How long does delivery take?</p>
          <p><strong>A:</strong> Usually within 30–60 minutes.</p>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default FaqsPage;
