import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import PartnersNavbar from "./components/PartnersNavbar";
import PartnersFooter from "./components/PartnersFooter";
import PartnerLandingPage from "./pages/PartnerLandingPage";
import PharmacyOnboardingPage from "./pages/PharmacyOnboardingPage";
import DoctorOnboardingPage from "./pages/DoctorOnboardingPage";
import DeliveryOnboardingPage from "./pages/DeliveryOnboardingPage";
import ApplicationStatusPage from "./pages/ApplicationStatusPage";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">
        <PartnersNavbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<PartnerLandingPage />} />
            <Route path="/apply/pharmacist" element={<PharmacyOnboardingPage />} />
            <Route path="/apply/doctor" element={<DoctorOnboardingPage />} />
            <Route path="/apply/delivery" element={<DeliveryOnboardingPage />} />
            <Route path="/status" element={<ApplicationStatusPage />} />
            <Route path="/status/:id" element={<ApplicationStatusPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <PartnersFooter />
      </div>
    </BrowserRouter>
  );
}

export default App;

