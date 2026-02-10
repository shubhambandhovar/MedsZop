import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";



const HelpCenterPage = () => {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Help Center</h1>
        <p className="text-muted-foreground">
          Find answers to common questions and get support for your orders,
          payments, and account.
        </p>
      </main>
      <Footer />
    </>
  );
};

export default HelpCenterPage;
