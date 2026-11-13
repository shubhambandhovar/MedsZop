import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Separator } from "../components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "../components/ui/dialog";
import { MapPin, Plus, CreditCard, Wallet, Loader2, CheckCircle, Navigation, Home, Briefcase, Map as MapIcon, Edit2, Search } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";

// Fix leaflet icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const API_URL = import.meta.env.VITE_API_URL;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const { t } = useTranslation(['checkout', 'common']);
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { cart, refreshCart } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    mobile: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    addressType: "Home",
    coordinates: { lat: 12.9716, lon: 77.5946 }
  });
  const [addressStep, setAddressStep] = useState("map"); // 'map' or 'form'
  const [mapPosition, setMapPosition] = useState([12.9716, 77.5946]);
  const [suggestions, setSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Prescription Logic
  const [prescriptionUrl, setPrescriptionUrl] = useState("");
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const requiresPrescription = cart.items.some(
    (item) => item.medicine.requires_prescription || item.medicine.requiresPrescription
  );

  const handlePrescriptionUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP, and PDF files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingPrescription(true);
    try {
      const res = await axios.post(`${API_URL}/prescriptions/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        setPrescriptionUrl(res.data.filePath);
        toast.success("Prescription uploaded successfully!");
      }
    } catch (err) {
      console.error("Prescription upload error:", err);
      toast.error("Failed to upload prescription. Please try again.");
    } finally {
      setUploadingPrescription(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // 🔥 DEPLOYMENT FIX: Call OSM directly from Frontend to bypass Render Backend IP blocks
          // 🔥 DEPLOYMENT FIX: Call OSM directly from Frontend. Browsers send their own UA.
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await res.json();

          const addr = data.address;
          setNewAddress(prev => ({
            ...prev,
            addressLine1: data.display_name.split(',')[0] || addr.road || addr.suburb || "",
            city: addr.city || addr.town || addr.village || addr.district || "",
            state: addr.state || "",
            pincode: addr.postcode || "",
            coordinates: { lat: latitude, lon: longitude }
          }));
          setMapPosition([latitude, longitude]);
          toast.success("Location detected!");
          setAddressStep('form');
        } catch (error) {
          console.error("Location detection error:", error);
          toast.error("Could not auto-detect address. Please enter details manually.");
          setAddressStep('form'); // Let user type manually if auto-detection fails
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        toast.error("Location access denied or unavailable");
        setGettingLocation(false);
      }
    );
  };

  // Debounced address search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (addressStep === 'map' && newAddress.addressLine1.length > 3) {
        searchAddress(newAddress.addressLine1);
      } else {
        setSuggestions([]);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [newAddress.addressLine1, addressStep]);

  const searchAddress = async (query) => {
    try {
      setSearchingAddress(true);
      // 🔥 DEPLOYMENT FIX: Call OSM directly from Frontend
      // 🔥 DEPLOYMENT FIX: Call OSM directly from Frontend
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&addressdetails=1&limit=10`);
      const data = await res.json();
      setSuggestions(data);
      setShowAddressSuggestions(true);
    } catch (error) {
      console.error("Address search error:", error);
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error("Search timed out. Please try again.");
      }
      setSuggestions([]);
    } finally {
      setSearchingAddress(false);
    }
  };

  const selectSuggestion = (s) => {
    const addr = s.address;
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);

    setMapPosition([lat, lon]);
    const city = addr.city || addr.town || addr.village || addr.suburb || addr.district || "";
    const state = addr.state || "";
    const pincode = addr.postcode || "";

    setNewAddress(prev => ({
      ...prev,
      addressLine1: s.display_name.split(',')[0],
      city: city,
      state: state,
      pincode: pincode || prev.pincode,
      coordinates: { lat, lon }
    }));
    setSuggestions([]);
    setShowAddressSuggestions(false);
    setAddressStep('form');
  };

  const handleMapMove = async (lat, lon) => {
    try {
      setMapPosition([lat, lon]);
      // 🔥 DEPLOYMENT FIX: Call OSM directly from Frontend
      // 🔥 DEPLOYMENT FIX: Call OSM directly from Frontend
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
      const data = await res.json();
      const addr = data.address;
      setNewAddress(prev => ({
        ...prev,
        addressLine1: data.display_name.split(',')[0] || addr.road || addr.suburb || "",
        city: addr.city || addr.town || addr.village || addr.district || "",
        state: addr.state || "",
        pincode: addr.postcode || "",
        coordinates: { lat, lon }
      }));
    } catch (error) {
      console.error("Map reverse geocode error:", error);
    }
  };

  function LocationMarker() {
    useMapEvents({
      dragend: (e) => {
        const center = e.target.getCenter();
        handleMapMove(center.lat, center.lng);
      },
    });
    return <Marker position={mapPosition} />;
  }

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`${API_URL}/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddresses(response.data);
      if (response.data.length > 0) {
        setSelectedAddress(response.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [token]);

  useEffect(() => {
    if (newAddress.pincode.length === 6) {
      lookupPincode(newAddress.pincode);
    }
  }, [newAddress.pincode]);

  const lookupPincode = async (pincode) => {
    try {
      // ✅ Back to Backend: The Pincode API does not support CORS (Frontend calls block it)
      const response = await axios.get(`${API_URL}/addresses/pincode?pincode=${pincode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;

      if (data && data[0].Status === "Success") {
        const postOffice = data[0].PostOffice[0];
        setNewAddress((prev) => ({
          ...prev,
          addressLine1: postOffice.Name,
          city: postOffice.District,
          state: postOffice.State,
        }));
        toast.success("Area details fetched successfully");
      } else {
        toast.error("Invalid Pincode");
      }
    } catch (error) {
      console.error("Error fetching pincode details:", error);
    }
  };

  useEffect(() => {
    if (cart.items.length === 0) {
      navigate("/cart");
    }
  }, [cart.items, navigate]);

  const handleAddAddress = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/addresses`, newAddress, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Address added successfully");
      setShowAddressForm(false);
      setNewAddress({
        name: "",
        mobile: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        addressType: "Home",
        coordinates: { lat: 12.9716, lon: 77.5946 }
      });
      setAddressStep("map");
      fetchAddresses();
      setSelectedAddress(response.data._id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add address");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    setLoading(true);
    try {
      // Create order
      const orderData = {
        address_id: selectedAddress,
        payment_method: paymentMethod === "razorpay" ? "online" : "cod"
      };

      if (requiresPrescription) {
        if (!prescriptionUrl) {
          toast.error("Please upload a prescription to proceed");
          setLoading(false);
          return;
        }
        orderData.prescription_url = prescriptionUrl;
      }

      const orderResponse = await axios.post(`${API_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (paymentMethod === "razorpay") {
        const res = await loadRazorpayScript();
        if (!res) {
          toast.error("Razorpay SDK failed to load. Are you online?");
          setLoading(false);
          return;
        }

        // Initialize Razorpay payment
        const paymentResponse = await axios.post(`${API_URL}/payments/create-order`, {
          order_id: orderResponse.data.order_id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const { amount, pg_order_id, key_id } = paymentResponse.data;

        const options = {
          key: key_id,
          amount: amount.toString(),
          currency: "INR",
          name: "MedsZop",
          description: "Order Payment",
          order_id: pg_order_id,
          handler: async function (response) {
            try {
              const verifyRes = await axios.post(`${API_URL}/payments/verify`, {
                order_id: orderResponse.data.order_id,
                pg_order_id: response.razorpay_order_id,
                pg_payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });

              if (verifyRes.data.verified) {
                toast.success("Payment Successful!");
                refreshCart();
                navigate(`/orders/${orderResponse.data.order_id}`);
              }
            } catch (err) {
              toast.error("Payment verification failed");
            }
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: user?.mobile || ""
          },
          theme: {
            color: "#16a34a"
          }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.on('payment.failed', function (response) {
          toast.error(response.error.description || "Payment Failed");
        });
        paymentObject.open();

      } else {
        // COD order
        toast.success("Order placed successfully!");
        refreshCart();
        navigate(`/orders/${orderResponse.data.order_id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-foreground tracking-tight" data-testid="checkout-title">
          {t("checkout:checkout.title")}
        </h1>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address Card */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="font-heading text-lg sm:text-xl flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  {t("checkout:checkout.delivery_address_title")}
                </CardTitle>
                <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl font-semibold h-9 px-3.5 text-xs gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Add New
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg w-full max-h-[90dvh] p-0 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col bg-white dark:bg-slate-900">
                    <DialogHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                      <DialogTitle className="flex items-center gap-2 font-heading text-lg sm:text-xl text-foreground">
                        {addressStep === 'map' ? 'Select Delivery Location' : 'Enter Address Details'}
                      </DialogTitle>
                      <DialogDescription className="sr-only">
                        {addressStep === 'map'
                          ? 'Use the map to pick your exact delivery location'
                          : 'Provide building name and contact information for your delivery'}
                      </DialogDescription>
                    </DialogHeader>

                    {addressStep === 'map' ? (
                      <div className="flex flex-col h-[min(540px,78dvh)]">
                        {/* Map Area */}
                        <div className="flex-1 relative min-h-0">
                          <MapContainer
                            center={mapPosition}
                            zoom={15}
                            zoomControl={false}
                            style={{ height: '100%', width: '100%' }}
                            key={`${mapPosition[0]}-${mapPosition[1]}`}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            />
                            <LocationMarker />
                          </MapContainer>

                          {/* Float Search Bar */}
                          <div className="absolute top-3 sm:top-4 left-3 right-3 sm:left-4 sm:right-4 z-[1000]">
                            <div className="relative">
                              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input
                                placeholder="Search by area, street, or landmark..."
                                className="pl-10 h-12 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-xl rounded-2xl text-xs sm:text-sm placeholder:text-slate-400 focus-visible:ring-primary text-foreground"
                                value={newAddress.addressLine1}
                                onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                                onFocus={() => setShowAddressSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                              />
                              {showAddressSuggestions && searchingAddress && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-4 z-[2000] border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3">
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  <span className="text-xs sm:text-sm font-medium text-slate-500">Searching locations...</span>
                                </div>
                              )}
                              {showAddressSuggestions && !searchingAddress && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-h-[200px] overflow-y-auto z-[2000] border border-slate-200 dark:border-slate-800 p-1">
                                  {suggestions.map((s, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors border-b border-slate-100 dark:border-slate-800/60 last:border-0"
                                      onClick={() => selectSuggestion(s)}
                                    >
                                      <div className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">{s.display_name.split(',').slice(0, 2).join(', ')}</div>
                                      <div className="text-[10px] text-slate-500 truncate">{s.display_name}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Current Location Overlay Button */}
                          <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-2xl px-4 sm:px-5 py-2 sm:py-2.5 rounded-full flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-xs sm:text-sm text-primary group active-press"
                          >
                            <div className={`p-1 rounded-full ${gettingLocation ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`}>
                              <Navigation className="h-3.5 w-3.5 fill-primary text-primary" />
                            </div>
                            {gettingLocation ? 'Detecting...' : 'Use current location'}
                          </button>
                        </div>

                        {/* Summarized Address Overlay */}
                        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-3 sm:space-y-4 border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] shrink-0">
                          <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl mt-0.5 text-primary shrink-0">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-0.5">Deliver To</h4>
                              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{newAddress.addressLine1 || "Select a location on map"}</p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {newAddress.city ? `${newAddress.city}, ${newAddress.state} ${newAddress.pincode}` : "Move pin to get details"}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl font-bold h-7 px-2.5 text-xs shrink-0"
                              onClick={() => setNewAddress({ ...newAddress, addressLine1: "" })}
                            >
                              Change
                            </Button>
                          </div>

                          <Button
                            className="w-full h-12 rounded-xl font-bold text-sm sm:text-base transition-all shadow-md shadow-primary/20 active-press"
                            onClick={() => setAddressStep('form')}
                            disabled={!newAddress.addressLine1 || gettingLocation}
                          >
                            Add Address Details
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-[min(580px,82dvh)]">
                        <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto no-scrollbar">
                          {/* Info Alert */}
                          <div className="bg-amber-50 dark:bg-amber-950/40 p-3 sm:p-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-800/60 flex gap-3">
                            <div className="p-1 bg-amber-100 dark:bg-amber-900/50 rounded-lg h-fit text-amber-600 shrink-0">
                              <Navigation className="h-3 w-3" />
                            </div>
                            <p className="text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed text-start">
                              Ensure your building name and contact details are accurate for smooth delivery.
                            </p>
                          </div>

                          <div className="space-y-4">
                            {/* Building Info */}
                            <div>
                              <Label className="text-xs font-semibold mb-1.5 block text-foreground">Flat / House / Building Name *</Label>
                              <Input
                                placeholder="e.g. Flat 402, Green Glen Apartments"
                                className="h-11 rounded-xl text-sm px-3.5"
                                value={newAddress.addressLine2}
                                onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                              />
                            </div>

                            {/* Mapping Summary Inline */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                              <div className="text-start overflow-hidden mr-3">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mb-0.5">{newAddress.addressLine1}</p>
                                <p className="text-[11px] text-slate-500 truncate">{newAddress.city}, {newAddress.state}, {newAddress.pincode}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="rounded-lg text-primary font-bold hover:bg-primary/5 shrink-0 h-7 text-xs px-2" onClick={() => setAddressStep('map')}>
                                Change
                              </Button>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs font-semibold mb-1.5 block text-foreground">Full Name *</Label>
                                <Input
                                  placeholder="Recipient's full name"
                                  className="h-11 rounded-xl px-3.5 text-sm"
                                  value={newAddress.name}
                                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label className="text-xs font-semibold mb-1.5 block text-foreground">10-Digit Mobile Number *</Label>
                                <Input
                                  placeholder="10-digit mobile number"
                                  className="h-11 rounded-xl px-3.5 text-sm"
                                  value={newAddress.mobile}
                                  onChange={(e) => setNewAddress({ ...newAddress, mobile: e.target.value })}
                                  maxLength={10}
                                />
                              </div>
                              <div>
                                <Label className="text-xs font-semibold mb-1.5 block text-foreground">Landmark (Optional)</Label>
                                <Input
                                  placeholder="e.g. Near Metro Station / Park"
                                  className="h-11 rounded-xl px-3.5 text-sm"
                                  value={newAddress.landmark}
                                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Address Type</Label>
                              <div className="flex gap-3">
                                {['Home', 'Work'].map(type => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => setNewAddress({ ...newAddress, addressType: type })}
                                    className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border-2 transition-all font-semibold text-xs sm:text-sm active-press ${newAddress.addressType === type
                                      ? 'bg-primary/10 border-primary text-primary shadow-xs'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-slate-300'
                                      }`}
                                  >
                                    {type === 'Home' ? <Home className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                                    {type}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                          <Button
                            className="w-full h-12 rounded-xl font-bold text-base shadow-md shadow-primary/20 active-press"
                            onClick={() => handleAddAddress()}
                            disabled={!newAddress.name || !newAddress.mobile || !newAddress.addressLine2 || loading}
                          >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Address'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {addresses.length === 0 ? (
                  <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-foreground text-sm">No saved addresses</p>
                    <p className="text-muted-foreground text-xs mt-1 mb-4">Add your delivery location to proceed with order.</p>
                    <Button variant="outline" size="sm" onClick={() => setShowAddressForm(true)} className="rounded-xl">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Delivery Address
                    </Button>
                  </div>
                ) : (
                  <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <div
                          key={address._id}
                          className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedAddress === address._id
                            ? "border-primary bg-primary/5 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 hover:border-primary/40 bg-card"
                            }`}
                          onClick={() => setSelectedAddress(address._id)}
                        >
                          <RadioGroupItem value={address._id} id={address._id} className="mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                {address.addressType === 'Home' ? <Home className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}
                                {address.addressType || 'Other'}
                              </span>
                              <span className="font-bold text-sm text-foreground">{address.name}</span>
                              <span className="text-xs text-muted-foreground">{address.mobile}</span>
                            </div>
                            <p className="font-medium text-xs sm:text-sm text-foreground">{address.addressLine1}</p>
                            {address.addressLine2 && <p className="text-xs sm:text-sm text-muted-foreground">{address.addressLine2}</p>}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                            {address.landmark && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Near: {address.landmark}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            {/* Payment Method Card */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="font-heading text-lg sm:text-xl flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  {t("checkout:checkout.payment_method_title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    <div
                      className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === "cod"
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:border-primary/40 bg-card"
                        }`}
                      onClick={() => setPaymentMethod("cod")}
                    >
                      <RadioGroupItem value="cod" id="cod" />
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">{t("checkout:checkout.cash_on_delivery")}</p>
                        <p className="text-xs text-muted-foreground">{t("checkout:checkout.cash_on_delivery_desc")}</p>
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === "razorpay"
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:border-primary/40 bg-card"
                        }`}
                      onClick={() => setPaymentMethod("razorpay")}
                    >
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">Pay Online (Razorpay)</p>
                        <p className="text-xs text-muted-foreground">Instant UPI, Cards, Net Banking & Wallets</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Prescription Upload Section (Required Logic) */}
            {requiresPrescription && (
              <Card className="rounded-2xl border-amber-300/80 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/30 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b border-amber-200/50 dark:border-amber-900/50">
                  <CardTitle className="font-heading text-lg sm:text-xl flex items-center gap-2 text-amber-900 dark:text-amber-200">
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/60 rounded-lg text-amber-700 dark:text-amber-300">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    Prescription Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                    One or more items in your cart require a valid doctor prescription. Our certified pharmacists will verify it before dispensing.
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handlePrescriptionUpload}
                      className="bg-white dark:bg-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer h-11"
                    />
                    {uploadingPrescription && (
                      <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold">
                        <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                      </div>
                    )}
                  </div>

                  {prescriptionUrl && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-semibold">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>Prescription uploaded and attached to order</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Desktop Order Summary Sidebar */}
          <div className="hidden lg:block">
            <Card className="sticky top-24 rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="font-heading text-lg font-bold">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                  {cart.items.map((item) => (
                    <div key={item.medicine.id} className="flex justify-between items-start text-xs sm:text-sm gap-2">
                      <span className="text-muted-foreground truncate">
                        {item.medicine.name} × {item.quantity}
                      </span>
                      <span className="font-medium shrink-0 tabular-nums">
                        ₹{((item.medicine.discount_price || item.medicine.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium tabular-nums">₹{cart.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">FREE</span>
                </div>
                <Separator />
                <div className="flex justify-between items-baseline">
                  <span className="font-heading font-bold text-base">{t("checkout:summary.total_amount")}</span>
                  <span className="font-heading font-extrabold text-2xl text-primary tabular-nums">
                    ₹{cart.total.toFixed(2)}
                  </span>
                </div>

                <Button
                  className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20 active-press"
                  onClick={handlePlaceOrder}
                  disabled={loading || addresses.length === 0 || (requiresPrescription && !prescriptionUrl)}
                  data-testid="place-order-btn"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {t("checkout:summary.place_order")}
                    </>
                  )}
                </Button>

                {addresses.length === 0 && (
                  <p className="text-center text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Please select or add a delivery address to place order.
                  </p>
                )}
                {requiresPrescription && !prescriptionUrl && (
                  <p className="text-center text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Please upload a prescription to continue.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Sticky Order Bar (Fixed at bottom on screens < 1024px) */}
        <aside
          aria-label="Mobile place order bar"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 pb-safe shadow-2xl"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Total Payable</div>
              <div className="font-heading font-bold text-xl text-primary tabular-nums">
                ₹{cart.total.toFixed(2)}
              </div>
            </div>
            <Button
              className="h-12 px-6 rounded-xl font-bold shadow-md shadow-primary/20 text-sm active-press"
              onClick={handlePlaceOrder}
              disabled={loading || addresses.length === 0 || (requiresPrescription && !prescriptionUrl)}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="mr-1.5 h-4 w-4" />
                  Place Order
                </>
              )}
            </Button>
          </div>
        </aside>
      </main>

      <Footer />
    </div >
  );
};

export default CheckoutPage;
