import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DeliveryLoginPage from "./pages/DeliveryLoginPage";
import DeliveryDashboardPage from "./pages/DeliveryDashboardPage";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<DeliveryLoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DeliveryDashboardPage />} />
            <Route path="/delivery" element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

