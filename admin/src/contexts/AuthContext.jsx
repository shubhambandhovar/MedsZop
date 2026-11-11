import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

axios.defaults.timeout = 30000;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Safe logout with cross-tab synchronization
  const logout = useCallback(
    async (broadcast = true, reason = null) => {
      const currentToken = localStorage.getItem("token");

      if (currentToken) {
        try {
          await axios.post(
            `${API_URL}/auth/logout`,
            {},
            { headers: { Authorization: `Bearer ${currentToken}` } }
          );
        } catch {
          // ignore network failure during logout
        }
      }

      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      setToken(null);
      setUser(null);

      if (broadcast) {
        localStorage.setItem("medszop_logout_event", JSON.stringify({ time: Date.now(), reason }));
      }
    },
    []
  );

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      if (res.data?.role !== "admin") {
        // Enforce strict admin role verification
        await logout(true, "UNAUTHORIZED_ROLE");
        return;
      }
      setUser(res.data);
    } catch (err) {
      await logout(false);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Validate session on mount & setup cross-tab synchronization
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      fetchUser();
    } else {
      setLoading(false);
    }

    // Cross-tab logout listener
    const handleStorageChange = (e) => {
      if (e.key === "medszop_logout_event" && e.newValue) {
        logout(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchUser, logout]);

  // Global Axios interceptor for automatic 401 session expiration handling
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const code = error.response.data?.code;
          if (
            code === "SESSION_IDLE_TIMEOUT" ||
            code === "SESSION_ABSOLUTE_TIMEOUT" ||
            code === "SESSION_REVOKED" ||
            code === "ACCOUNT_DELETED"
          ) {
            logout(true, code);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [logout]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { access_token, user: userData } = res.data;

      if (userData?.role !== "admin") {
        throw new Error("Access Denied: Only administrator accounts can access this portal.");
      }

      localStorage.setItem("token", access_token);
      localStorage.setItem("medszop_admin_last_activity", Date.now().toString());
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      setToken(access_token);
      setUser(userData);

      return userData;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your credentials.";
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token && !!user && user.role === "admin",
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
