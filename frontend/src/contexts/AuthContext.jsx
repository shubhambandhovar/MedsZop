import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

axios.defaults.timeout = 30000; // Increased for Render Cold Starts

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // ✅ Run once on app load
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      fetchUser();
    } else {
      setLoading(false);
    }

    // Cross-tab logout synchronization
    const handleStorage = (e) => {
      if (e.key === "medszop_customer_logout" && e.newValue) {
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];
        setToken(null);
        setUser(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ✅ Fetch logged-in user
  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      setUser(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOGIN
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { access_token, user: userData } = res.data;

      localStorage.setItem("token", access_token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      setToken(access_token);
      setUser(userData);

      return userData;
    } catch (err) {
      throw err.response?.data?.message || "Login failed";
    }
  };

  // ✅ GOOGLE LOGIN (existing users only)
  const googleLogin = async (credential) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google/login`, { credential });
      const { access_token, user: userData } = res.data;
      localStorage.setItem("token", access_token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      setToken(access_token);
      setUser(userData);
      return userData;
    } catch (err) {
      throw err.response?.data?.message || "Google login failed";
    }
  };

  // ✅ GOOGLE SIGNUP (new users only)
  const googleSignup = async (credential) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google/signup`, { credential });
      const { access_token, user: userData } = res.data;
      localStorage.setItem("token", access_token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      setToken(access_token);
      setUser(userData);
      return userData;
    } catch (err) {
      throw err.response?.data?.message || "Google signup failed";
    }
  };

  // ✅ REGISTER (customer only)
  const register = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, data);

      const { access_token, user: userData } = res.data;

      localStorage.setItem("token", access_token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      setToken(access_token);
      setUser(userData);

      return userData;
    } catch (err) {
      throw err.response?.data?.message || "Registration failed";
    }
  };

  // ✅ LOGOUT
  const logout = async () => {
    const currentToken = localStorage.getItem("token");
    if (currentToken) {
      try {
        await axios.post(
          `${API_URL}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${currentToken}` } }
        );
      } catch {
        // ignore network error during logout
      }
    }
    localStorage.removeItem("token");
    localStorage.setItem("medszop_customer_logout", Date.now().toString());
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        googleLogin,
        googleSignup,
        register,
        logout,
        isAuthenticated: !!token && !!user && !loading,
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
