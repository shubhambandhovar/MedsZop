import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Separator } from "../components/ui/separator";
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
  const { t } = useTranslation();
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
        toast.error(t("medicine_detail.not_found"));
        navigate("/medicines");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error(t("medicine_detail.login_required"));
      navigate("/login");
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(medicine.id, quantity);
      toast.success(t("medicine_detail.added_to_cart", { quantity, name: medicine.name }));
    } catch (error) {
      toast.error(t("medicine_detail.add_failed"));
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
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("medicine_detail.back_to_medicines")}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="relative">
            <div className="sticky top-24">
              <div className="relative rounded-3xl overflow-hidden bg-slate-100">
                <img
                  src={medicine.image_url || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800"}
                  alt={medicine.name}
                  className="w-full h-[400px] object-cover"
                />
                {medicine.requires_prescription && (
                  <Badge className="absolute top-4 left-4 bg-amber-500 text-white">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {t("medicine_detail.prescription_required")}
                  </Badge>
                )}
                {discount > 0 && (
                  <Badge className="absolute top-4 right-4 bg-emerald-500 text-white text-lg px-4 py-1">
                    {t("medicine_detail.discount", { discount })}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div>
            <Badge variant="outline" className="mb-4">{medicine.category}</Badge>

            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2" data-testid="medicine-name">
              {medicine.name}
            </h1>

            <p className="text-lg text-muted-foreground mb-1">{medicine.brand}</p>
            <p className="text-muted-foreground mb-6">
              Generic: {medicine.generic_name} • {medicine.strength}
            </p>

            {/* Price Section */}
            <Card className="mb-6 bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-end gap-4 mb-4">
                  <span className="text-4xl font-bold text-primary" data-testid="medicine-price">
                    ₹{finalPrice}
                  </span>
                  {medicine.discount_price && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">
                        ₹{medicine.price}
                      </span>
                      <Badge className="bg-emerald-500">Save ₹{medicine.price - medicine.discount_price}</Badge>
                    </>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">{t("medicine_detail.inclusive_taxes")}</p>
              </CardContent>
            </Card>

            {/* Quantity Selector */}
            <div className="flex items-center gap-6 mb-6">
              <span className="font-medium">{t("medicine_detail.quantity")}</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  data-testid="qty-decrease"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-semibold text-lg" data-testid="qty-value">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  data-testid="qty-increase"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <Button
                size="lg"
                className="flex-1 h-14 rounded-xl text-base"
                onClick={handleAddToCart}
                disabled={addingToCart || medicine.stock === 0}
                data-testid="add-to-cart-btn"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {medicine.stock === 0 ? t("medicine_detail.out_of_stock") : t("medicine_detail.add_to_cart")}
              </Button>
              <Link to="/cart" className="flex-1">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-14 rounded-xl text-base"
                >
                  {t("medicine_detail.buy_now")}
                </Button>
              </Link>
            </div>

            <Separator className="my-6" />

            {/* Description */}
            <div className="mb-8">
              <h3 className="font-heading font-semibold text-lg mb-3">{t("medicine_detail.description")}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {medicine.description}
              </p>
            </div>

            {/* Product Details */}
            <div className="mb-8">
              <h3 className="font-heading font-semibold text-lg mb-3">{t("medicine_detail.product_details")}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("medicine_detail.dosage_form")}</span>
                  <p className="font-medium">{medicine.dosage_form}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("medicine_detail.strength")}</span>
                  <p className="font-medium">{medicine.strength}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("medicine_detail.manufacturer")}</span>
                  <p className="font-medium">{medicine.manufacturer}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("medicine_detail.in_stock")}</span>
                  <p className="font-medium">{medicine.stock > 0 ? t("medicine_detail.units", { units: medicine.stock }) : t("medicine_detail.out_of_stock")}</p>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Shield, label: t("medicine_detail.badge_genuine") },
                { icon: Truck, label: t("medicine_detail.badge_delivery") },
                { icon: Clock, label: t("medicine_detail.badge_same_day") },
                { icon: Package, label: t("medicine_detail.badge_returns") }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center text-center p-4 bg-muted rounded-xl">
                  <item.icon className="h-6 w-6 text-primary mb-2" />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MedicineDetailPage;
