import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PharmacyLoginPage from "./pages/PharmacyLoginPage";
import PharmacyDashboardPage from "./pages/PharmacyDashboardPage";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PharmacyLoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<PharmacyDashboardPage />} />
            <Route path="/pharmacy" element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

