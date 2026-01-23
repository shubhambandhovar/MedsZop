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
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
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

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />

            <Route path="/cart" element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            } />

            <Route path="/checkout" element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            } />

            <Route path="/orders" element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } />

            <Route path="/orders/:id" element={
              <ProtectedRoute>
                <OrderTrackingPage />
              </ProtectedRoute>
            } />

            <Route path="/prescription-scan" element={
              <ProtectedRoute>
                <PrescriptionScanPage />
              </ProtectedRoute>
            } />

            <Route path="/doctor-chat" element={
              <ProtectedRoute>
                <DoctorChatPage />
              </ProtectedRoute>
            } />

            <Route path="/pharmacy" element={
              <ProtectedRoute allowedRoles={["pharmacy", "admin"]}>
                <PharmacyDashboardPage />
              </ProtectedRoute>
            } />

            <Route path="/delivery" element={
              <ProtectedRoute allowedRoles={["delivery", "admin"]}>
                <DeliveryDashboardPage />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } />
          </Routes>

          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
