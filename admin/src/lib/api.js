import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminApi = {
  // 1. Overview & Analytics
  getStats: () => api.get("/admin/stats").then((r) => r.data),
  getAnalytics: (range = "7d") => api.get(`/admin/analytics?range=${range}`).then((r) => r.data),

  // 2. Orders
  getOrders: (params) => api.get("/admin/orders", { params }).then((r) => r.data),
  getOrderById: (id) => api.get(`/admin/orders/${id}`).then((r) => r.data),
  updateOrderStatus: (id, payload) => api.patch(`/admin/orders/${id}/status`, payload).then((r) => r.data),

  // 3. Medicines
  getMedicines: (params) => api.get("/admin/medicines", { params }).then((r) => r.data),
  createMedicine: (data) => api.post("/admin/medicines", data).then((r) => r.data),
  updateMedicine: (id, data) => api.put(`/admin/medicines/${id}`, data).then((r) => r.data),
  deleteMedicine: (id) => api.delete(`/admin/medicines/${id}`).then((r) => r.data),

  // 4. Users
  getUsers: (params) => api.get("/admin/users", { params }).then((r) => r.data),
  getUserById: (id) => api.get(`/admin/users/${id}`).then((r) => r.data),
  createUser: (data) => api.post("/admin/create-user", data).then((r) => r.data),
  updateUserRole: (id, payload) => api.patch(`/admin/users/${id}/role`, payload).then((r) => r.data),
  updateUserStatus: (id, payload) => api.patch(`/admin/users/${id}/status`, payload).then((r) => r.data),
  checkUserDeletionDependencies: (id) => api.get(`/admin/users/${id}/deletion-check`).then((r) => r.data),
  deleteUser: (id, payload) => api.delete(`/admin/users/${id}`, { data: payload }).then((r) => r.data),

  // 5. Pharmacies
  getPharmacies: () => api.get("/admin/pharmacies").then((r) => r.data),
  verifyPharmacy: (id, verified) => api.put(`/admin/pharmacies/${id}/verify`, { verified }).then((r) => r.data),

  // 6. Healthcare
  getPrescriptions: (params) => api.get("/admin/prescriptions", { params }).then((r) => r.data),
  updatePrescriptionStatus: (id, payload) => api.patch(`/admin/prescriptions/${id}/status`, payload).then((r) => r.data),
  getConsultations: (params) => api.get("/admin/consultations", { params }).then((r) => r.data),

  // 7. Operations
  getDeliveries: () => api.get("/admin/deliveries").then((r) => r.data),
  getPartnerApplications: (params) => api.get("/admin/partner-applications", { params }).then((r) => r.data),
  reviewPartnerApplication: (type, id, payload) => api.post(`/admin/partner-applications/${type}/${id}/review`, payload).then((r) => r.data),

  // 8. Business
  getPayments: (params) => api.get("/admin/payments", { params }).then((r) => r.data),
  getRefunds: (params) => api.get("/admin/refunds", { params }).then((r) => r.data),

  // 9. System
  getAuditLogs: (params) => api.get("/admin/audit-logs", { params }).then((r) => r.data),
  getSystemHealth: () => api.get("/admin/system-health").then((r) => r.data),
};

export default api;

