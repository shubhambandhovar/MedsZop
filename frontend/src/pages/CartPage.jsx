import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Sparkles
} from "lucide-react";
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
          <div className="space-y-4 max-w-4xl">
            <Skeleton className="h-10 w-48 rounded-xl mb-6" />
            {[1, 2, 3].map(i => (
              <Card key={i} className="rounded-2xl border-slate-200 dark:border-slate-800 p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/3 rounded-lg" />
                    <Skeleton className="h-4 w-1/4 rounded-lg" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  const itemsCount = cart.items?.length || 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-8">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to="/medicines"
                className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Continue Shopping
              </Link>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-3 text-foreground tracking-tight" data-testid="cart-title">
              <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary">
                <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              Shopping Cart
              <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {itemsCount} {itemsCount === 1 ? "item" : "items"}
              </Badge>
            </h1>
          </div>
          {itemsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCart}
              className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive self-start sm:self-auto rounded-xl h-9 px-3.5 text-xs font-semibold transition-all"
              aria-label="Clear all items from shopping cart"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Clear Cart
            </Button>
          )}
        </div>

        {!itemsCount ? (
          <Card className="text-center py-16 px-4 rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto my-8">
            <CardContent className="space-y-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Your cart is empty</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                Looks like you haven't added any medicines or healthcare essentials yet.
              </p>
              <div className="pt-2">
                <Link to="/medicines">
                  <Button className="rounded-xl px-7 h-12 font-semibold shadow-md shadow-primary/20 active-press">
                    Browse Medicines
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const price = item.medicine.discount_price || item.medicine.price;
                const hasDiscount = Boolean(item.medicine.discount_price);
                return (
                  <Card
                    key={item.medicine.id}
                    className="overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs hover:border-primary/40 transition-colors"
                    data-testid={`cart-item-${item.medicine.id}`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex gap-3.5 sm:gap-4">
                        {/* Medicine Thumbnail */}
                        <Link
                          to={`/medicines/${item.medicine.id}`}
                          className="shrink-0 group"
                          aria-label={`View details of ${item.medicine.name}`}
                        >
                          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl bg-slate-100 dark:bg-slate-800/80 overflow-hidden shrink-0 border border-slate-200/70 dark:border-slate-700/70">
                            <img
                              src={item.medicine.image_url || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200"}
                              alt={item.medicine.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        </Link>

                        {/* Medicine Meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link to={`/medicines/${item.medicine.id}`}>
                                <h3 className="font-semibold text-sm sm:text-base hover:text-primary transition-colors text-foreground line-clamp-2">
                                  {item.medicine.name}
                                </h3>
                              </Link>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{item.medicine.brand}</p>
                              {item.medicine.strength && (
                                <p className="text-xs text-muted-foreground truncate">{item.medicine.strength}</p>
                              )}
                            </div>

                            {/* Price Block */}
                            <div className="text-right shrink-0">
                              <div className="font-heading font-bold text-base sm:text-lg text-primary tabular-nums">
                                ₹{(price * item.quantity).toFixed(2)}
                              </div>
                              {hasDiscount && (
                                <div className="text-xs text-muted-foreground line-through tabular-nums">
                                  ₹{(item.medicine.price * item.quantity).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>

                          {item.medicine.requires_prescription && (
                            <Badge
                              variant="outline"
                              className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40"
                            >
                              Rx Required
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Item Bottom Actions: Quantity Stepper & Remove */}
                      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:h-8 sm:w-8 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-foreground"
                            onClick={() => handleQuantityChange(item.medicine.id, item.quantity - 1)}
                            disabled={updating || item.quantity <= 1}
                            aria-label={`Decrease quantity of ${item.medicine.name}`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-8 text-center font-semibold text-sm tabular-nums text-foreground select-none">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:h-8 sm:w-8 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-foreground"
                            onClick={() => handleQuantityChange(item.medicine.id, item.quantity + 1)}
                            disabled={updating}
                            aria-label={`Increase quantity of ${item.medicine.name}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl text-xs sm:text-sm px-2.5 sm:px-3 h-8"
                          onClick={() => handleRemoveItem(item.medicine.id)}
                          disabled={updating}
                          aria-label={`Remove ${item.medicine.name} from cart`}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Desktop Order Summary Sidebar */}
            <div className="hidden lg:block">
              <Card className="sticky top-24 rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="font-heading text-lg font-bold">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium tabular-nums">₹{cart.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" /> FREE
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="text-muted-foreground text-xs">Included in price</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-baseline">
                    <span className="font-heading font-bold text-base">Total</span>
                    <span className="font-heading font-extrabold text-2xl text-primary tabular-nums" data-testid="cart-total">
                      ₹{cart.total.toFixed(2)}
                    </span>
                  </div>

                  <Button
                    className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20 active-press"
                    onClick={() => navigate("/checkout")}
                    data-testid="proceed-to-checkout"
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Link to="/medicines" className="block">
                    <Button variant="outline" className="w-full rounded-xl text-sm h-11">
                      Continue Shopping
                    </Button>
                  </Link>

                  {/* Trust assurance micro-badges */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>100% Genuine, verified medicines</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary shrink-0" />
                      <span>Cold-chain delivery guaranteed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Mobile Sticky Checkout Bar (Fixed at bottom on screens < 1024px) */}
        {itemsCount > 0 && (
          <aside
            aria-label="Mobile checkout bar"
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 pb-safe shadow-2xl"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Total Amount</div>
                <div className="font-heading font-bold text-xl text-primary tabular-nums">
                  ₹{cart.total.toFixed(2)}
                </div>
              </div>
              <Button
                className="h-12 px-6 rounded-xl font-bold shadow-md shadow-primary/20 text-sm active-press"
                onClick={() => navigate("/checkout")}
              >
                Checkout
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </aside>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
