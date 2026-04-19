import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// ==================== Auth API ====================
export const authApi = {
  register: (data: any) => api.post("/auth/register", data),
  login: (data: any) => api.post("/auth/login", data),
  verifyEmail: (data: { code: string }) => api.post("/auth/verify-email", data),
  resendOtp: () => api.post("/auth/resend-email-otp"),
  refresh: (refreshToken: string) => api.post("/auth/refresh", { refreshToken }),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// ==================== Users API ====================
export const usersApi = {
  getAll: (params?: any) => api.get("/users", { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: any) => api.put("/users/me/profile", data),
  changePassword: (data: any) => api.patch("/users/me/password", data),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
  updateStatus: (id: string, status: string) => api.patch(`/users/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/users/${id}`),
  getStats: () => api.get("/users/stats"),
};

// ==================== Offices API ====================
export const officesApi = {
  create: (data: any) => api.post("/offices", data),
  getAll: (params?: any) => api.get("/offices", { params }),
  getById: (id: string) => api.get(`/offices/${id}`),
  getByCity: (city: string) => api.get(`/offices/city/${city}`),
  update: (id: string, data: any) => api.patch(`/offices/${id}`, data),
  delete: (id: string) => api.delete(`/offices/${id}`),
  getStats: (id: string) => api.get(`/offices/${id}/stats`),
  getCounters: (id: string) => api.get(`/offices/${id}/counters`),
  createCounter: (id: string, data: any) => api.post(`/offices/${id}/counters`, data),
  updateCounter: (officeId: string, counterId: string, data: any) =>
    api.patch(`/offices/${officeId}/counters/${counterId}`, data),
  assignOfficer: (officeId: string, counterId: string, data: any) =>
    api.patch(`/offices/${officeId}/counters/${counterId}/assign`, data),
};

// ==================== Services API ====================
export const servicesApi = {
  create: (data: any) => api.post("/services", data),
  getAll: (params?: any) => api.get("/services", { params }),
  getByOffice: (officeId: string, params?: any) =>
    api.get(`/services/office/${officeId}`, { params }),
  getById: (id: string) => api.get(`/services/${id}`),
  update: (id: string, data: any) => api.patch(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

// ==================== Appointments API ====================
export const appointmentsApi = {
  create: (data: any) => api.post("/appointments", data),
  getAll: (params?: any) => api.get("/appointments", { params }),
  getMy: (params?: any) => api.get("/appointments/my", { params }),
  getByOffice: (officeId: string, params?: any) =>
    api.get(`/appointments/office/${officeId}`, { params }),
  getSlots: (officeId: string, serviceId: string, date: string) =>
    api.get(`/appointments/slots/${officeId}/${serviceId}/${date}`),
  getById: (id: string) => api.get(`/appointments/${id}`),
  cancel: (id: string, data: { reason: string }) =>
    api.patch(`/appointments/${id}/cancel`, data),
  reschedule: (id: string, data: any) =>
    api.patch(`/appointments/${id}/reschedule`, data),
  checkIn: (id: string) => api.patch(`/appointments/${id}/checkin`),
  complete: (id: string) => api.patch(`/appointments/${id}/complete`),
  getTodayStats: (officeId: string) =>
    api.get(`/appointments/office/${officeId}/today-stats`),
};

// ==================== Tokens API ====================
export const tokensApi = {
  generate: (data: any) => api.post("/tokens", data),
  getMy: (params?: any) => api.get("/tokens/my", { params }),
  getQueue: (officeId: string, serviceId?: string) =>
    api.get(`/tokens/queue/${officeId}`, { params: serviceId ? { serviceId } : {} }),
  getStatus: (officeId: string, serviceId?: string) =>
    api.get(`/tokens/status/${officeId}`, { params: serviceId ? { serviceId } : {} }),
  getById: (id: string) => api.get(`/tokens/${id}`),
  getPosition: (id: string) => api.get(`/tokens/${id}/position`),
  callNext: (officeId: string, data: any) =>
    api.patch(`/tokens/call-next/${officeId}`, data),
  startService: (id: string, data: any) =>
    api.patch(`/tokens/${id}/start-service`, data),
  complete: (id: string) => api.patch(`/tokens/${id}/complete`),
  cancel: (id: string, reason?: string) =>
    api.patch(`/tokens/${id}/cancel`, { reason }),
  noShow: (id: string) => api.patch(`/tokens/${id}/no-show`),
};

// ==================== Analytics API ====================
export const analyticsApi = {
  getDashboard: (officeId?: string) =>
    api.get("/analytics/dashboard", { params: officeId ? { officeId } : {} }),
  getQueue: (officeId: string, startDate: string, endDate: string) =>
    api.get("/analytics/queue", { params: { officeId, startDate, endDate } }),
  getServices: (params?: any) => api.get("/analytics/services", { params }),
  getAppointments: (params?: any) => api.get("/analytics/appointments", { params }),
  getPeakHours: (officeId: string, params?: any) =>
    api.get("/analytics/peak-hours", { params: { officeId, ...params } }),
  getOfficeSummary: (officeId: string) =>
    api.get(`/analytics/office/${officeId}/summary`),
};

// ==================== Notifications API ====================
export const notificationsApi = {
  getMy: (params?: any) => api.get("/notifications/my", { params }),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  getAll: (params?: any) => api.get("/notifications/admin", { params }),
};

export default api;
