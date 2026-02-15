import HelpCenterPage from "./pages/support/HelpCenterPage";
import FaqsPage from "./pages/support/FaqsPage";
import RefundPolicyPage from "./pages/support/RefundPolicyPage";
import PrivacyPolicyPage from "./pages/support/PrivacyPolicyPage";
import TermsPage from "./pages/support/TermsPage";

import DoctorApplicationPage from "./pages/onboarding/DoctorApplicationPage";
import PharmacistApplicationPage from "./pages/onboarding/PharmacistApplicationPage";
import DeliveryApplicationPage from "./pages/onboarding/DeliveryApplicationPage";
import ApplicationStatusPage from "./pages/onboarding/ApplicationStatusPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { CartProvider } from "./contexts/CartContext.jsx";

import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import MedicinesPage from "./pages/MedicinesPage.jsx";
import MedicineDetailPage from "./pages/MedicineDetailPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import OrderTrackingPage from "./pages/OrderTrackingPage.jsx";
import PrescriptionScanPage from "./pages/PrescriptionScanPage.jsx";
import DoctorChatPage from "./pages/DoctorChatPage.jsx";
import PharmacyDashboardPage from "./pages/PharmacyDashboardPage.jsx";
import DeliveryDashboardPage from "./pages/DeliveryDashboardPage.jsx";
import DoctorDashboardPage from "./pages/DoctorDashboardPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/medicines" element={<MedicinesPage />} />
            <Route path="/medicines/:id" element={<MedicineDetailPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/faqs" element={<FaqsPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Application Routes */}
            <Route path="/apply/doctor" element={<DoctorApplicationPage />} />
            <Route path="/apply/pharmacist" element={<PharmacistApplicationPage />} />
            <Route path="/apply/delivery" element={<DeliveryApplicationPage />} />
            <Route path="/application-status/:id" element={<ApplicationStatusPage />} />

            {/* Change Password Route */}
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cart"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CartPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <OrderTrackingPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/prescription-scan"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <PrescriptionScanPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor-chat"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <DoctorChatPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacy"
              element={
                <ProtectedRoute allowedRoles={["pharmacy"]}>
                  <PharmacyDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/delivery"
              element={
                <ProtectedRoute allowedRoles={["delivery"]}>
                  <DeliveryDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor-dashboard"
              element={
                <ProtectedRoute allowedRoles={["doctor"]}>
                  <DoctorDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={["customer", "pharmacy", "delivery", "admin", "doctor"]}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Routes>

          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
