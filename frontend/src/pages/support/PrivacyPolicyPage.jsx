import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";



const PrivacyPolicyPage = () => {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground">
          Your personal and medical data is securely stored and never shared.
        </p>
      </main>
      <Footer />
    </>
  );
};

export default PrivacyPolicyPage;
