import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";



const TermsPage = () => {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground">
          By using MedsZop, you agree to our terms and conditions.
        </p>
      </main>
      <Footer />
    </>
  );
};

export default TermsPage;
