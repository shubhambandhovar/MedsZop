import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
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

const API_URL = import.meta.env.VITE_API_URL;

const MedicinesPage = () => {
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
      setMedicines(response.data);
    } catch (error) {
      console.error("Error fetching medicines:", error);
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
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2 tracking-tight text-foreground" data-testid="medicines-title">
            Browse Medicines
          </h1>
          <p className="text-muted-foreground">
            Find and order from our wide range of genuine medicines
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search medicines, brands, or generic names..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-11 h-12 rounded-xl"
                aria-label="Search medicines, brands, or generic names"
                data-testid="medicine-search"
              />
            </div>

            {/* Search Suggestions */}
            {showSuggestions && searchResults.length > 0 && (
              <Card className="absolute top-full left-0 right-0 z-10 mt-2 shadow-xl border-slate-200 dark:border-slate-800">
                <CardContent className="p-2">
                  {searchResults.map((med) => (
                    <Link
                      key={med.id}
                      to={`/medicines/${med.id}`}
                      className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors"
                      onClick={() => setShowSuggestions(false)}
                    >
                      <Pill className="h-4 w-4 text-primary" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-sm">{med.name}</p>
                        <p className="text-xs text-muted-foreground">{med.generic_name} • {med.brand}</p>
                      </div>
                      <span className="ml-auto font-semibold text-sm">₹{med.price}</span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </form>

          <Select value={selectedCategory || "all"} onValueChange={(val) => setSelectedCategory(val === "all" ? "" : val)}>
            <SelectTrigger className="w-full md:w-[200px] h-12 rounded-xl" data-testid="category-filter" aria-label="Filter by category">
              <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Medicine Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="status" aria-label="Loading medicines">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden rounded-2xl">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <Skeleton className="h-6 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
            <h3 className="font-heading text-xl font-semibold mb-2">No medicines found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <Button
              className="rounded-full px-6 shadow-sm hover:shadow transition-all"
              onClick={() => { setSearch(""); setSelectedCategory(""); }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {medicines.map((medicine, index) => (
              <motion.div
                key={medicine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 rounded-2xl border-slate-200 dark:border-slate-800" data-testid={`medicine-card-${medicine.id}`}>
                  <Link to={`/medicines/${medicine.id}`}>
                    <div className="relative h-48 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                      <img
                        src={medicine.image_url || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400"}
                        alt={medicine.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {medicine.requires_prescription && (
                        <Badge className="absolute top-3 left-3 bg-amber-500 text-white font-medium text-xs">
                          Rx Required
                        </Badge>
                      )}
                      {medicine.discount_price && (
                        <Badge className="absolute top-3 right-3 bg-emerald-500 text-white font-medium text-xs">
                          {Math.round((1 - medicine.discount_price / medicine.price) * 100)}% OFF
                        </Badge>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link to={`/medicines/${medicine.id}`}>
                      <h3 className="font-semibold text-base mb-1 line-clamp-1 hover:text-primary transition-colors text-foreground">
                        {medicine.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mb-1">{medicine.brand}</p>
                    <p className="text-xs text-muted-foreground mb-3">{medicine.generic_name}</p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        {medicine.discount_price ? (
                          <>
                            <span className="font-bold text-lg text-primary">₹{medicine.discount_price}</span>
                            <span className="text-sm text-muted-foreground line-through ml-2">₹{medicine.price}</span>
                          </>
                        ) : (
                          <span className="font-bold text-lg text-primary">₹{medicine.price}</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="rounded-full h-9 w-9 p-0"
                        onClick={() => handleAddToCart(medicine)}
                        aria-label={`Add ${medicine.name} to cart`}
                        data-testid={`add-to-cart-${medicine.id}`}
                      >
                        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
