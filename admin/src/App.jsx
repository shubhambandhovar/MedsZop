import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";

// Pages
import AdminLoginPage from "./pages/AdminLoginPage";
import ExecutiveDashboardPage from "./pages/ExecutiveDashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import OrdersPage from "./pages/OrdersPage";
import MedicinesPage from "./pages/MedicinesPage";
import PharmaciesPage from "./pages/PharmaciesPage";
import CustomersPage from "./pages/CustomersPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import ConsultationsPage from "./pages/ConsultationsPage";
import DeliveriesPage from "./pages/DeliveriesPage";
import PartnerApplicationsPage from "./pages/PartnerApplicationsPage";
import PaymentsPage from "./pages/PaymentsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminProfilePage from "./pages/AdminProfilePage";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<AdminLoginPage />} />

          {/* Protected Administrator Routes wrapped in Master Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<ExecutiveDashboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/medicines" element={<MedicinesPage />} />
              <Route path="/pharmacies" element={<PharmaciesPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/prescriptions" element={<PrescriptionsPage />} />
              <Route path="/consultations" element={<ConsultationsPage />} />
              <Route path="/deliveries" element={<DeliveriesPage />} />
              <Route path="/partner-applications" element={<PartnerApplicationsPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<AdminProfilePage />} />

              {/* Shortcuts */}
              <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
