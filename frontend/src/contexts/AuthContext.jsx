import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

axios.defaults.timeout = 15000;

const API_URL = import.meta.env.VITE_API_URL;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // ✅ Run only ONCE when app loads
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }

  }, []);

  // ✅ Fetch user safely
  const fetchUser = async (authToken) => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      setUser(res.data);

    } catch (err) {

      // ✅ Only logout if token is invalid
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      }

    } finally {
      setLoading(false);
    }
  };

  // ✅ LOGIN FIXED
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { access_token, user: userData } = res.data;

      // Save token
      localStorage.setItem("token", access_token);

      // Set axios global header
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      setToken(access_token);
      setUser(userData);

      return userData;

    } catch (err) {
      throw err.response?.data?.message || "Login failed";
    }
  };

  // ✅ REGISTER FIXED
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

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
