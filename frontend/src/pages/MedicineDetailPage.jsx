import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Separator } from "../components/ui/separator";
import { GlassCard, GlassButton } from "../components/glass";
import {
  ShoppingCart,
  ArrowLeft,
  Plus,
  Minus,
  Shield,
  Truck,
  Clock,
  Package,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

const MedicineDetailPage = () => {
  const { t } = useTranslation(['catalog', 'common']);
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/medicines/${id}`);
        setMedicine(response.data);
      } catch (error) {
        console.error("Error fetching medicine:", error);
        toast.error("Medicine not found");
        navigate("/medicines");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(medicine.id, quantity);
      toast.success(`Added ${quantity} ${medicine.name} to cart`);
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-[400px] rounded-3xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!medicine) return null;

  const finalPrice = medicine.discount_price || medicine.price;
  const discount = medicine.discount_price
    ? Math.round((1 - medicine.discount_price / medicine.price) * 100)
    : 0;

  return (
    <div className="min-h-screen glass-ambient-mesh flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 md:pb-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="pl-3 pr-3 h-8 rounded-full backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-xs font-semibold gap-1.5 shadow-xs"
            aria-label="Return to previous page"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("detail.back_to_medicines", "Back to Medicines")}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Image Section */}
          <div className="relative">
            <div className="md:sticky md:top-24">
              <div className="relative rounded-3xl overflow-hidden backdrop-blur-md bg-white/75 dark:bg-slate-900/75 border border-white/80 dark:border-white/10 shadow-glass aspect-square sm:aspect-4/3 md:aspect-square max-h-[440px]">
                <img
                  src={medicine.image_url || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800"}
                  alt={medicine.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                {medicine.requires_prescription && (
                  <Badge className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 bg-amber-500 hover:bg-amber-600 text-white shadow-sm text-xs font-semibold px-3 py-1">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    {t("medicine_card.rx_needed", "Prescription Required")}
                  </Badge>
                )}
                {discount > 0 && (
                  <Badge className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-3 py-1 shadow-sm">
                    {discount}% OFF
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-3 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25">
                {medicine.category}
              </Badge>

              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-foreground tracking-tight" data-testid="medicine-name">
                {medicine.name}
              </h1>

              <p className="text-base sm:text-lg font-medium text-muted-foreground">{medicine.brand}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Generic: <span className="font-medium text-foreground">{medicine.generic_name}</span> • {medicine.strength}
              </p>
            </div>

            {/* Price Card */}
            <GlassCard variant="elevated" className="rounded-3xl p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline gap-3 sm:gap-4 mb-2">
                <span className="font-heading font-extrabold text-3xl sm:text-4xl text-emerald-600 dark:text-emerald-400 tabular-nums" data-testid="medicine-price">
                  ₹{finalPrice}
                </span>
                {medicine.discount_price && (
                  <>
                    <span className="text-lg sm:text-xl text-muted-foreground line-through tabular-nums">
                      ₹{medicine.price}
                    </span>
                    <Badge className="bg-emerald-600 text-white text-xs font-semibold">
                      Save ₹{medicine.price - medicine.discount_price}
                    </Badge>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Inclusive of all taxes • 100% Genuine product</p>
            </GlassCard>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-4 sm:gap-6 py-2">
              <span className="text-sm font-semibold text-foreground">{t("detail.quantity", "Quantity")}:</span>
              <div className="flex items-center gap-2 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-foreground"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  data-testid="qty-decrease"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-10 text-center font-bold text-base sm:text-lg tabular-nums text-foreground select-none" data-testid="qty-value">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-foreground"
                  onClick={() => setQuantity(quantity + 1)}
                  data-testid="qty-increase"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-1">
              <GlassButton
                size="lg"
                variant="primary"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={addingToCart || medicine.stock === 0}
                data-testid="add-to-cart-btn"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {medicine.stock === 0
                  ? t("medicine_card.out_of_stock", "Out of Stock")
                  : (addingToCart ? t("medicine_card.adding", "Adding...") : t("medicine_card.add_to_cart", "Add to Cart"))}
              </GlassButton>
              <Link to="/cart" className="flex-1">
                <GlassButton
                  size="lg"
                  variant="secondary"
                  className="w-full"
                >
                  {t("detail.view_cart", "Go to Cart")}
                </GlassButton>
              </Link>
            </div>

            <Separator className="my-6" />

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-heading font-bold text-base sm:text-lg text-foreground">Description</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {medicine.description}
              </p>
            </div>

            {/* Product Details Grid */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-base sm:text-lg text-foreground">Product Details</h3>
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground text-xs block mb-0.5">Dosage Form</span>
                  <p className="font-semibold text-foreground">{medicine.dosage_form}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground text-xs block mb-0.5">Strength</span>
                  <p className="font-semibold text-foreground">{medicine.strength}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground text-xs block mb-0.5">Manufacturer</span>
                  <p className="font-semibold text-foreground truncate">{medicine.manufacturer}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-muted-foreground text-xs block mb-0.5">Availability</span>
                  <p className={`font-semibold ${medicine.stock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    {medicine.stock > 0 ? `${medicine.stock} units in stock` : "Out of Stock"}
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { icon: Shield, label: "100% Genuine" },
                { icon: Truck, label: "Cold-chain Delivery" },
                { icon: Clock, label: "Express 28m" },
                { icon: Package, label: "Tamper-proof Seal" }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <item.icon className="h-5 w-5 text-primary mb-1.5" />
                  <span className="text-[11px] font-semibold text-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Sticky Add-to-Cart Bar (Screens < 768px) */}
        <aside
          aria-label="Mobile add to cart bar"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 pb-safe shadow-2xl"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Price</div>
              <div className="font-heading font-bold text-lg sm:text-xl text-primary tabular-nums">
                ₹{(finalPrice * quantity).toFixed(2)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="h-12 px-5 sm:px-6 rounded-xl font-bold shadow-md shadow-primary/20 text-xs sm:text-sm active-press"
                onClick={handleAddToCart}
                disabled={addingToCart || medicine.stock === 0}
              >
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                {medicine.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
};

export default MedicineDetailPage;
