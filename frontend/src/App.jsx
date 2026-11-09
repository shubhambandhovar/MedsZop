import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { CartProvider } from "./contexts/CartContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

// Eager load LandingPage for instant initial render and optimal FCP
import LandingPage from "./pages/LandingPage.jsx";

// Lazy load secondary and specialist routes
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage.jsx"));
const RegisterPage = lazy(() => import("./pages/RegisterPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const MedicinesPage = lazy(() => import("./pages/MedicinesPage.jsx"));
const MedicineDetailPage = lazy(() => import("./pages/MedicineDetailPage.jsx"));
const CartPage = lazy(() => import("./pages/CartPage.jsx"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage.jsx"));
const OrdersPage = lazy(() => import("./pages/OrdersPage.jsx"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage.jsx"));
const PrescriptionScanPage = lazy(() => import("./pages/PrescriptionScanPage.jsx"));
const AIDoctorPage = lazy(() => import("./pages/AIDoctorPage.jsx"));
const ConsultDoctorPage = lazy(() => import("./pages/ConsultDoctorPage.jsx"));
const VideoCallPage = lazy(() => import("./pages/VideoCallPage.jsx"));
const PharmacyDashboardPage = lazy(() => import("./pages/PharmacyDashboardPage.jsx"));
const DeliveryDashboardPage = lazy(() => import("./pages/DeliveryDashboardPage.jsx"));
const DoctorDashboardPage = lazy(() => import("./pages/DoctorDashboardPage.jsx"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage.jsx"));
const SettingsPage = lazy(() => import("./pages/SettingsPage.jsx"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage.jsx"));

// Lazy load support pages
const HelpCenterPage = lazy(() => import("./pages/support/HelpCenterPage"));
const FaqsPage = lazy(() => import("./pages/support/FaqsPage"));
const RefundPolicyPage = lazy(() => import("./pages/support/RefundPolicyPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/support/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/support/TermsPage"));

// Lazy load onboarding application forms
const DoctorApplicationPage = lazy(() => import("./pages/onboarding/DoctorApplicationPage"));
const PharmacistApplicationPage = lazy(() => import("./pages/onboarding/PharmacistApplicationPage"));
const DeliveryApplicationPage = lazy(() => import("./pages/onboarding/DeliveryApplicationPage"));
const ApplicationStatusPage = lazy(() => import("./pages/onboarding/ApplicationStatusPage"));

// Accessible Suspense fallback
const PageLoadingFallback = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Loading healthcare services"
    className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-4"
  >
    <div className="relative flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      <div className="absolute h-4 w-4 rounded-full bg-primary/10 animate-ping" />
    </div>
    <p className="text-xs font-medium text-muted-foreground animate-pulse">
      Loading healthcare services...
    </p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
                    <AIDoctorPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/consult-doctor"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <ConsultDoctorPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/video-call/:id"
                element={
                  <ProtectedRoute allowedRoles={["customer", "doctor"]}>
                    <VideoCallPage />
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
          </Suspense>

          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
