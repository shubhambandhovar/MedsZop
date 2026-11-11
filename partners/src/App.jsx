import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import PartnerLandingPage from "./pages/PartnerLandingPage";
import DoctorApplicationPage from "./pages/DoctorApplicationPage";
import PharmacistApplicationPage from "./pages/PharmacistApplicationPage";
import DeliveryApplicationPage from "./pages/DeliveryApplicationPage";
import ApplicationStatusPage from "./pages/ApplicationStatusPage";

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PartnerLandingPage />} />
          <Route path="/apply/doctor" element={<DoctorApplicationPage />} />
          <Route path="/apply/pharmacy" element={<PharmacistApplicationPage />} />
          <Route path="/apply/pharmacist" element={<PharmacistApplicationPage />} />
          <Route path="/apply/delivery" element={<DeliveryApplicationPage />} />
          <Route path="/application-status" element={<ApplicationStatusPage />} />
          <Route path="/application-status/:id" element={<ApplicationStatusPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

