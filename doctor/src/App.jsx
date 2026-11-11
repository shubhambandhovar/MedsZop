import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DoctorLoginPage from "./pages/DoctorLoginPage";
import DoctorDashboardPage from "./pages/DoctorDashboardPage";
import VideoCallPage from "./pages/VideoCallPage";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<DoctorLoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DoctorDashboardPage />} />
            <Route path="/doctor-dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/video-call/:id" element={<VideoCallPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

