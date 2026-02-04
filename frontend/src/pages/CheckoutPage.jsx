import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
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
          const res = await axios.get(`${API_URL}/addresses/reverse?lat=${latitude}&lon=${longitude}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 20000 // Match/Exceed backend timeout for slow OSM responses
          });

          const addr = res.data.address;
          setNewAddress(prev => ({
            ...prev,
            addressLine1: res.data.display_name.split(',')[0] || addr.road || addr.suburb || "",
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
      const res = await axios.get(`${API_URL}/addresses/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      setSuggestions(res.data);
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
      const res = await axios.get(`${API_URL}/addresses/reverse?lat=${lat}&lon=${lon}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      const addr = res.data.address;
      setNewAddress(prev => ({
        ...prev,
        addressLine1: res.data.display_name.split(',')[0] || addr.road || addr.suburb || "",
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
      const orderResponse = await axios.post(`${API_URL}/orders`, {
        address_id: selectedAddress,
        payment_method: paymentMethod
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (paymentMethod === "razorpay") {
        // Initialize Razorpay payment
        const paymentResponse = await axios.post(`${API_URL}/payments/create-order`, {
          order_id: orderResponse.data.order_id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // For demo, skip actual Razorpay integration
        toast.success("Order placed successfully!");
        navigate(`/orders/${orderResponse.data.order_id}`);
      } else {
        // COD order
        toast.success("Order placed successfully!");
        navigate(`/orders/${orderResponse.data.order_id}`);
      }

      refreshCart();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-3xl font-bold mb-8" data-testid="checkout-title">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Delivery Address
                </CardTitle>
                <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add New
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <DialogHeader className="p-4 border-b bg-white">
                      <DialogTitle className="flex items-center gap-2 font-heading text-xl">
                        {addressStep === 'map' ? 'Select Delivery Location' : 'Enter Address Details'}
                      </DialogTitle>
                      <DialogDescription className="sr-only">
                        {addressStep === 'map'
                          ? 'Use the map to pick your exact delivery location'
                          : 'Provide building name and contact information for your delivery'}
                      </DialogDescription>
                    </DialogHeader>
                    {addressStep === 'map' ? (
                      <div className="flex flex-col h-[520px]">
                        {/* Map Area */}
                        <div className="flex-1 relative">
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
                          <div className="absolute top-4 left-4 right-4 z-[1000]">
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input
                                placeholder="Search by area, street, or landmark..."
                                className="pl-12 h-14 bg-white/95 backdrop-blur-md border-none shadow-xl rounded-2xl text-base placeholder:text-slate-400 focus-visible:ring-primary"
                                value={newAddress.addressLine1}
                                onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                                onFocus={() => setShowAddressSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                              />
                              {showAddressSuggestions && searchingAddress && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl p-4 z-[2000] border flex items-center justify-center gap-3">
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  <span className="text-sm font-medium text-slate-500">Searching locations...</span>
                                </div>
                              )}
                              {showAddressSuggestions && !searchingAddress && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl max-h-[220px] overflow-y-auto z-[2000] border p-1">
                                  {suggestions.map((s, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0"
                                      onClick={() => selectSuggestion(s)}
                                    >
                                      <div className="font-bold text-slate-800 text-sm">{s.display_name.split(',').slice(0, 2).join(', ')}</div>
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
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-white border border-slate-100 shadow-2xl px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-slate-50 transition-all font-bold text-sm text-primary group"
                          >
                            <div className={`p-1 rounded-full ${gettingLocation ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`}>
                              <Navigation className="h-4 w-4 fill-primary text-primary" />
                            </div>
                            {gettingLocation ? 'Detecting...' : 'Use my current location'}
                          </button>
                        </div>

                        {/* Summarized Address Overlay */}
                        <div className="p-5 bg-white space-y-4 border-t shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group transition-all hover:bg-slate-100">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-primary/10 rounded-xl mt-0.5">
                                <MapPin className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Deliver To</h4>
                                <p className="text-sm font-bold text-slate-900 line-clamp-1">{newAddress.addressLine1 || "Select a location on map"}</p>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  {newAddress.city ? `${newAddress.city}, ${newAddress.state} ${newAddress.pincode}` : "Move pin to get details"}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl font-bold h-8 text-xs border-slate-200"
                                onClick={() => setNewAddress({ ...newAddress, addressLine1: "" })}
                              >
                                Change
                              </Button>
                            </div>
                          </div>

                          <Button
                            className="w-full h-14 rounded-2xl font-bold text-base transition-all shadow-xl shadow-primary/20"
                            onClick={() => setAddressStep('form')}
                            disabled={!newAddress.addressLine1 || gettingLocation}
                          >
                            Add address Details
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-[580px]">
                        <div className="flex-1 p-5 space-y-6 overflow-y-auto scrollbar-hide">
                          {/* Info Alert */}
                          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-4">
                            <div className="p-1.5 bg-amber-100 rounded-lg h-fit">
                              <Navigation className="h-3 w-3 text-amber-600" />
                            </div>
                            <p className="text-xs font-semibold text-amber-800 leading-normal text-start">
                              Ensure your address details are accurate for a smooth delivery experience
                            </p>
                          </div>

                          <div className="space-y-6">
                            {/* Building Info */}
                            <div className="space-y-2">
                              <Input
                                placeholder="Flat / House / Building Name *"
                                className="h-14 rounded-2xl border-slate-200 focus-visible:ring-primary text-base px-5"
                                value={newAddress.addressLine2}
                                onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                              />
                            </div>

                            {/* Mapping Summary Inline */}
                            <div className="group relative">
                              <div className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest z-10">Area / Sector / Locality</div>
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div className="text-start overflow-hidden mr-4">
                                  <p className="text-sm font-bold text-slate-800 truncate mb-0.5">{newAddress.addressLine1}</p>
                                  <p className="text-xs text-slate-500 font-medium truncate">{newAddress.city}, {newAddress.state}, {newAddress.pincode}</p>
                                </div>
                                <Button variant="ghost" size="sm" className="rounded-xl text-primary font-bold hover:bg-primary/5 shrink-0" onClick={() => setAddressStep('map')}>Change</Button>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <Input
                                placeholder="Enter your full name *"
                                className="h-14 rounded-2xl border-slate-200 px-5 text-base"
                                value={newAddress.name}
                                onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                              />
                              <Input
                                placeholder="10-digit mobile number *"
                                className="h-14 rounded-2xl border-slate-200 px-5 text-base"
                                value={newAddress.mobile}
                                onChange={(e) => setNewAddress({ ...newAddress, mobile: e.target.value })}
                                maxLength={10}
                              />
                              <Input
                                placeholder="Alternate phone number (Optional)"
                                className="h-14 rounded-2xl border-slate-200 px-5 text-base"
                                value={newAddress.landmark}
                                onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                              />
                            </div>

                            <div className="space-y-3">
                              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1 text-center">Type of address</h5>
                              <div className="flex gap-4">
                                {['Home', 'Work'].map(type => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => setNewAddress({ ...newAddress, addressType: type })}
                                    className={`flex-1 flex items-center justify-center gap-3 h-12 rounded-2xl border-2 transition-all font-bold text-sm ${newAddress.addressType === type
                                      ? 'bg-primary/5 border-primary text-primary shadow-sm'
                                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
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

                        <div className="p-5 border-t bg-white">
                          <Button
                            className="w-full h-14 rounded-2xl font-bold text-lg shadow-2xl shadow-primary/25 transition-transform active:scale-[0.98]"
                            onClick={() => handleAddAddress()}
                            disabled={!newAddress.name || !newAddress.mobile || !newAddress.addressLine2 || loading}
                          >
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Save address'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No addresses found. Add a new address to continue.
                  </p>
                ) : (
                  <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <div
                          key={address._id}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedAddress === address._id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                          onClick={() => setSelectedAddress(address._id)}
                        >
                          <RadioGroupItem value={address._id} id={address._id} />
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase text-slate-500">
                                {address.addressType === 'Home' ? <Home className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}
                                {address.addressType || 'Other'}
                              </div>
                              <span className="font-bold">{address.name}</span>
                              <span className="text-xs text-slate-400 font-medium">{address.mobile}</span>
                            </div>
                            <p className="font-medium text-sm">{address.addressLine1}</p>
                            {address.addressLine2 && <p className="text-sm">{address.addressLine2}</p>}
                            <p className="text-sm text-muted-foreground">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                            {address.landmark && (
                              <p className="text-sm text-muted-foreground">
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

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    <div
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === "cod"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                      onClick={() => setPaymentMethod("cod")}
                    >
                      <RadioGroupItem value="cod" id="cod" />
                      <Wallet className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-sm text-muted-foreground">Pay when you receive</p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === "razorpay"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                      onClick={() => setPaymentMethod("razorpay")}
                    >
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Pay Online</p>
                        <p className="text-sm text-muted-foreground">UPI, Cards, Net Banking, Wallets</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="font-heading">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.medicine.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.medicine.name} x {item.quantity}
                    </span>
                    <span>₹{((item.medicine.discount_price || item.medicine.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{cart.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-emerald-600">FREE</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">₹{cart.total.toFixed(2)}</span>
                </div>

                <Button
                  className="w-full h-12 rounded-xl text-base"
                  onClick={handlePlaceOrder}
                  disabled={loading || addresses.length === 0}
                  data-testid="place-order-btn"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Place Order
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
