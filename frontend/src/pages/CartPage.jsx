import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";

const CartPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { cart, loading, updateCart, clearCart } = useCart();
  const [updating, setUpdating] = useState(false);

  const handleQuantityChange = async (medicineId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      setUpdating(true);
      const updatedItems = cart.items.map(item => ({
        medicine_id: item.medicine.id,
        quantity: item.medicine.id === medicineId ? newQuantity : item.quantity
      }));
      await updateCart(updatedItems);
    } catch (error) {
      toast.error("Failed to update cart");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (medicineId) => {
    try {
      setUpdating(true);
      const updatedItems = cart.items
        .filter(item => item.medicine.id !== medicineId)
        .map(item => ({
          medicine_id: item.medicine.id,
          quantity: item.quantity
        }));
      await updateCart(updatedItems);
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setUpdating(false);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success("Cart cleared");
    } catch (error) {
      toast.error("Failed to clear cart");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold flex items-center gap-3" data-testid="cart-title">
              <ShoppingCart className="h-8 w-8 text-primary" />
              Shopping Cart
            </h1>
            <p className="text-muted-foreground mt-1">
              {cart.items.length} {cart.items.length === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          {cart.items.length > 0 && (
            <Button variant="outline" onClick={handleClearCart} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        {cart.items.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">Looks like you haven't added any medicines yet</p>
              <Link to="/medicines">
                <Button>Browse Medicines</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const price = item.medicine.discount_price || item.medicine.price;
                return (
                  <Card key={item.medicine.id} className="overflow-hidden" data-testid={`cart-item-${item.medicine.id}`}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <Link to={`/medicines/${item.medicine.id}`}>
                          <div className="h-24 w-24 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                            <img
                              src={item.medicine.image_url || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200"}
                              alt={item.medicine.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/medicines/${item.medicine.id}`}>
                            <h3 className="font-semibold hover:text-primary transition-colors">
                              {item.medicine.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground">{item.medicine.brand}</p>
                          <p className="text-sm text-muted-foreground">{item.medicine.strength}</p>
                          {item.medicine.requires_prescription && (
                            <Badge variant="outline" className="mt-1 text-amber-600 border-amber-200">
                              Rx Required
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-primary">
                            ₹{(price * item.quantity).toFixed(2)}
                          </div>
                          {item.medicine.discount_price && (
                            <div className="text-sm text-muted-foreground line-through">
                              ₹{(item.medicine.price * item.quantity).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.medicine.id, item.quantity - 1)}
                            disabled={updating || item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.medicine.id, item.quantity + 1)}
                            disabled={updating}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveItem(item.medicine.id)}
                          disabled={updating}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="font-heading">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{cart.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>Included</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary" data-testid="cart-total">₹{cart.total.toFixed(2)}</span>
                  </div>
                  
                  <Button
                    className="w-full h-12 rounded-xl text-base"
                    onClick={() => navigate("/checkout")}
                    data-testid="proceed-to-checkout"
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Link to="/medicines" className="block">
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
