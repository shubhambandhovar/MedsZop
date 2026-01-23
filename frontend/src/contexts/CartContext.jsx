import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();

  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  // 🔁 Fetch cart when user logs in
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchCart();
    } else {
      setCart({ items: [], total: 0 });
    }
  }, [isAuthenticated, token]);

  // 🛒 Fetch cart
  const fetchCart = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCart(res.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // ➕ Add to cart
  const addToCart = async (medicineId, quantity = 1) => {
    if (!token) throw new Error("Not authenticated");

    try {
      await axios.post(
        `${API_URL}/cart/add`,
        { medicine_id: medicineId, quantity },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      await fetchCart();
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  };

  // 🔄 Update cart
  const updateCart = async (items) => {
    if (!token) throw new Error("Not authenticated");

    try {
      await axios.put(
        `${API_URL}/cart/update`,
        { items },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      await fetchCart();
    } catch (error) {
      console.error("Error updating cart:", error);
      throw error;
    }
  };

  // 🧹 Clear cart
  const clearCart = async () => {
    if (!token) return;

    try {
      await axios.delete(`${API_URL}/cart/clear`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCart({ items: [], total: 0 });
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  // 🔢 Cart count
  const cartCount = Array.isArray(cart.items)
    ? cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        cartCount,
        addToCart,
        updateCart,
        clearCart,
        refreshCart: fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
