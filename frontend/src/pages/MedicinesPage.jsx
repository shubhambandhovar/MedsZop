import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { GlassCard, GlassButton, GlassSkeleton } from "../components/glass";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Search, Filter, ShoppingCart, Pill, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const MedicinesPage = () => {
  const { t } = useTranslation(['catalog', 'common']);
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  // Search debounce and stale-request protection refs
  const searchTimeoutRef = useRef(null);
  const searchRequestIdRef = useRef(0);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory) params.append("category", selectedCategory);
      
      const response = await axios.get(`${API_URL}/medicines?${params.toString()}`);
      setMedicines(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/medicines/categories`);
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchMedicines();
    fetchCategories();
  }, [selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    // Invalidate inflight suggestions
    searchRequestIdRef.current++;
    setShowSuggestions(false);
    fetchMedicines();
  };

  const handleSearchChange = (value) => {
    setSearch(value);

    // Cancel pending debounce timer
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setShowSuggestions(false);
      setSearchResults([]);
      return;
    }

    // Debounce search by 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      // Increment request ID for stale-request protection
      const currentRequestId = ++searchRequestIdRef.current;
      try {
        const response = await axios.get(
          `${API_URL}/medicines?search=${encodeURIComponent(trimmed)}`
        );
        // Only accept if this is still the latest active request
        if (currentRequestId === searchRequestIdRef.current) {
          setSearchResults(Array.isArray(response.data) ? response.data : []);
          setShowSuggestions(true);
        }
      } catch (error) {
        if (currentRequestId === searchRequestIdRef.current) {
          console.error("Error searching medicines:", error);
        }
      }
    }, 300);
  };

  const handleAddToCart = async (medicine) => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }
    try {
      await addToCart(medicine.id, 1);
      toast.success(`${medicine.name} added to cart`);
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  return (
    <div className="min-h-screen glass-ambient-mesh flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 sm:mb-8">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground" data-testid="medicines-title">
              {t("catalog:title")}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              {t("catalog:subtitle")}
            </p>
          </div>
          {!loading && medicines.length > 0 && (
            <p className="text-xs sm:text-sm text-muted-foreground font-medium shrink-0">
              Showing <span className="font-semibold text-foreground">{medicines.length}</span> {medicines.length === 1 ? "medicine" : "medicines"}
            </p>
          )}
        </div>

        {/* Search and Filters Bar */}
        <div className="space-y-4 mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <Input
                  placeholder={t("catalog:search_placeholder")}
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-11 pr-10 h-12 rounded-2xl border-slate-200/90 dark:border-slate-800/90 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md shadow-xs text-sm placeholder:text-muted-foreground focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-foreground"
                  aria-label="Search medicines, brands, or generic names"
                  data-testid="medicine-search"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setShowSuggestions(false);
                      setSearchResults([]);
                      fetchMedicines();
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full text-xs"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchResults.length > 0 && (
                <Card className="absolute top-full left-0 right-0 z-30 mt-2 shadow-2xl rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl max-h-[280px] overflow-y-auto no-scrollbar p-1.5">
                  <CardContent className="p-0 space-y-1">
                    {searchResults.map((med) => (
                      <Link
                        key={med.id}
                        to={`/medicines/${med.id}`}
                        className="flex items-center gap-3 p-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800/70 rounded-xl transition-colors"
                        onClick={() => setShowSuggestions(false)}
                      >
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Pill className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{med.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{med.generic_name} • {med.brand}</p>
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">₹{med.price}</span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </form>

            <Select
              value={selectedCategory || "all"}
              onValueChange={(val) => setSelectedCategory(val === "all" ? "" : val)}
            >
              <SelectTrigger
                className="w-full md:w-[220px] h-12 rounded-2xl border-slate-200/90 dark:border-slate-800/90 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md shadow-xs text-sm font-medium"
                data-testid="category-filter"
                aria-label="Filter by category"
              >
                <Filter className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl max-h-[300px] backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800/80">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5">
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active-press ${!selectedCategory
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-glow-sm"
                  : "backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-slate-800"
                  }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active-press ${selectedCategory === cat
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-glow-sm"
                    : "backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-slate-800"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Medicine Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 gap-4 sm:gap-6" role="status" aria-label="Loading medicines">
            {[...Array(8)].map((_, i) => (
              <GlassSkeleton key={i} variant="card" className="h-72 w-full rounded-2xl" />
            ))}
          </div>
        ) : medicines.length === 0 ? (
          <GlassCard variant="elevated" className="text-center py-16 px-4 rounded-3xl max-w-lg mx-auto my-8">
            <div className="space-y-4">
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="h-8 w-8" aria-hidden="true" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground">No medicines found</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                We couldn't find any medicines matching your search or active category filters.
              </p>
              <div className="pt-2">
                <GlassButton
                  variant="primary"
                  className="rounded-xl px-6 h-11 font-semibold"
                  onClick={() => { setSearch(""); setSelectedCategory(""); }}
                >
                  Clear Filters
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6"
          >
            {medicines.map((medicine, index) => (
              <motion.div
                key={medicine.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
              >
                <GlassCard
                  interactive
                  variant="default"
                  className="overflow-hidden group flex flex-col h-full rounded-2xl"
                  data-testid={`medicine-card-${medicine.id}`}
                >
                  <Link to={`/medicines/${medicine.id}`} className="block relative overflow-hidden">
                    <div className="relative aspect-4/3 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                      <img
                        src={medicine.image_url || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400"}
                        alt={medicine.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {medicine.requires_prescription && (
                        <Badge className="absolute top-2.5 left-2.5 bg-amber-500 text-white font-semibold text-[10px] px-2 py-0.5 shadow-xs">
                          Rx Required
                        </Badge>
                      )}
                      {medicine.discount_price && (
                        <Badge className="absolute top-2.5 right-2.5 bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 shadow-xs">
                          {Math.round((1 - medicine.discount_price / medicine.price) * 100)}% OFF
                        </Badge>
                      )}
                    </div>
                  </Link>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide truncate" title={medicine.generic_name}>
                        SALT: {medicine.generic_name || "Verified Salt IP"}
                      </div>
                      <Link to={`/medicines/${medicine.id}`}>
                        <h3 className="font-heading font-bold text-sm sm:text-base mt-1 line-clamp-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-foreground">
                          {medicine.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{medicine.brand || "Licensed Manufacturer"}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div>
                        {medicine.discount_price ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-mono font-bold text-base sm:text-lg text-foreground tabular-nums">
                              ₹{medicine.discount_price}
                            </span>
                            <span className="text-xs text-muted-foreground line-through tabular-nums font-mono">
                              ₹{medicine.price}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-base sm:text-lg text-foreground tabular-nums">
                            ₹{medicine.price}
                          </span>
                        )}
                      </div>
                      <GlassButton
                        size="icon"
                        variant="primary"
                        onClick={() => handleAddToCart(medicine)}
                        aria-label={`Add ${medicine.name} to cart`}
                        data-testid={`add-to-cart-${medicine.id}`}
                      >
                        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                      </GlassButton>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MedicinesPage;
