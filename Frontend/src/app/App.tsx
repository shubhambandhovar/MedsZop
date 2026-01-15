import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { MedicineSearch } from './components/MedicineSearch';
import { MedicineDetail } from './components/MedicineDetail';
import { PrescriptionUpload } from './components/PrescriptionUpload';
import { PrescriptionScanner } from './components/PrescriptionScanner';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { OrderTracking } from './components/OrderTracking';
import { UserProfile } from './components/UserProfile';
import { Login } from './components/Login';
import { AIChatbot } from './components/AIChatbot';
import { EditProfileModal } from './components/EditProfileModal';
import { PharmacyDashboard } from './components/PharmacyDashboard';
import { AdminDashboard } from './components/AdminDashboardEnhanced';
import { AdminLogin } from './components/AdminLogin';
import { AdminSetPassword } from './components/AdminSetPassword';
import { HealthDashboard } from './components/HealthDashboard';
import { OrderSuccess } from './components/OrderSuccess';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { SubscriptionManager } from './components/SubscriptionManager';
import { DoctorConsultationUI } from './components/DoctorConsultation';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import { UserSubscription } from '../services/subscriptionService';
import { cloudSyncService } from '../services/cloudSyncService';
import {
  ViewType,
  Language,
  Medicine,
  CartItem,
  Order,
  User,
  Address,
} from './types';
import {
  mockMedicines,
  mockUser,
  mockOrders,
  mockPrescriptions,
  mockPharmacies,
  mockPharmacyOrders,
  mockHealthProfile,
} from './data/mockData';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [language, setLanguage] = useState<Language>('en');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User>(mockUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);

  // View Mode (user, pharmacy, admin)
  const [viewMode, setViewMode] = useState<'user' | 'pharmacy' | 'admin'>('user');

  // Basic path-based routing for admin flows
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(Boolean);
  const isAdminLoginPath = path === '/admin/login' || path === '/admin';
  const isAdminSetPasswordPath = path.startsWith('/admin/set-password');
  const isAdminDashboardPath = path.startsWith('/admin/dashboard');
  const adminInviteToken = isAdminSetPasswordPath ? (pathParts[2] || '') : '';

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      setIsLoggedIn(true);
      
      // Route to appropriate dashboard based on role
      if (storedUser.role === 'admin') {
        setViewMode('admin');
        if (!isAdminSetPasswordPath && !isAdminLoginPath) {
          window.history.replaceState(null, '', '/admin/dashboard');
        }
      } else if (storedUser.role === 'pharmacy') {
        setViewMode('pharmacy');
      } else {
        setViewMode('user');
        setCurrentView('home');
      }
    }
  }, []);

  // Auto-save cart to cloud when cart items change
  useEffect(() => {
    if (isLoggedIn && user.id && cartItems.length > 0) {
      cloudSyncService.saveCartToCloud(user.id, cartItems).catch(error => {
        console.error('Error auto-saving cart to cloud:', error);
      });
    }
  }, [cartItems, isLoggedIn, user.id]);

  const handleLanguageToggle = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
    toast.success(
      language === 'en'
        ? 'भाषा बदल दी गई'
        : 'Language changed to English'
    );
  };

  const handleLogin = async (user: User) => {
    setIsLoggedIn(true);
    setUser(user);
    setCartItems([]);
    
    // Sync data from cloud based on user role
    try {
      if (user.role === 'pharmacy') {
        await cloudSyncService.syncPharmacyDataOnLogin(user.id);
        setViewMode('pharmacy');
        toast.success(language === 'en' ? 'Welcome Pharmacy! Data synced from cloud.' : 'फार्मेसी स्वागत है! क्लाउड से डेटा सिंक हो गया।');
      } else if (user.role === 'admin') {
        setViewMode('admin');
        window.history.replaceState(null, '', '/admin/dashboard');
        toast.success(language === 'en' ? 'Welcome Admin!' : 'व्यवस्थापक स्वागत है!');
      } else {
        // Regular user - sync orders, prescriptions, subscriptions, profile
        const syncResult = await cloudSyncService.syncUserDataOnLogin(user.id);
        if (syncResult) {
          toast.success(language === 'en' ? 'Login successful! Data synced from cloud.' : 'लॉगिन सफल! क्लाउड से डेटा सिंक हो गया।');
        } else {
          toast.warning(language === 'en' ? 'Login successful! Using offline data.' : 'लॉगिन सफल! ऑफ़लाइन डेटा उपयोग कर रहे हैं।');
        }
        setViewMode('user');
        setCurrentView('home');
      }
    } catch (error) {
      console.error('Error syncing data from cloud:', error);
      toast.warning(language === 'en' ? 'Synced with offline data. Some data may be outdated.' : 'ऑफ़लाइन डेटा से सिंक किया गया। कुछ डेटा पुराना हो सकता है।');
      
      // Set view mode even if sync fails
      if (user.role === 'admin') {
        setViewMode('admin');
        window.history.replaceState(null, '', '/admin/dashboard');
      } else if (user.role === 'pharmacy') {
        setViewMode('pharmacy');
      } else {
        setViewMode('user');
        setCurrentView('home');
      }
    }
  };

  const handleLogout = () => {
    // Clear local cache (preserves pharmacy medicines)
    cloudSyncService.clearLocalCache();
    
    authService.logout();
    setIsLoggedIn(false);
    setUser(mockUser);
    setCurrentView('login');
    setViewMode('user');
    setCartItems([]);
    if (path.startsWith('/admin')) {
      window.history.replaceState(null, '', '/');
    }
    toast.success(language === 'en' ? 'Logged out successfully' : 'लॉगआउट सफल');
  };

  const handleUpdateProfile = async (updatedUser: User) => {
    setUser(updatedUser);
    authService.saveCurrentUser(updatedUser);
    
    // Sync updated profile to cloud
    try {
      await cloudSyncService.updateProfileInCloud(updatedUser);
      toast.success(language === 'en' ? 'Profile updated and synced to cloud!' : 'प्रोफ़ाइल अपडेट हो गया और क्लाउड में सिंक हो गया!');
    } catch (error) {
      console.error('Error syncing profile to cloud:', error);
      toast.warning(language === 'en' ? 'Profile saved locally. Will sync when online.' : 'प्रोफ़ाइल स्थानीय रूप से सहेजा गया। ऑनलाइन होने पर सिंक होगा।');
    }
  };

  const handleAddToCart = (medicine: Medicine, quantity: number) => {
    const existingItem = cartItems.find((item) => item.id === medicine.id);

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.id === medicine.id ? { ...item, quantity: item.quantity + quantity } : item
        )
      );
    } else {
      setCartItems([...cartItems, { ...medicine, quantity }]);
    }

    toast.success(
      language === 'en'
        ? `${medicine.brand} added to cart`
        : `${medicine.brand} कार्ट में जोड़ा गया`
    );
    setCurrentView('cart');
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCartItems(cartItems.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
    toast.success(language === 'en' ? 'Item removed from cart' : 'आइटम कार्ट से हटाया गया');
  };

  const handleAddAddress = (address: Address) => {
    // Check if address already exists (edit case) or is new (add case)
    const existingIndex = user.addresses.findIndex(a => a.id === address.id);
    if (existingIndex >= 0) {
      // Update existing address
      const updatedAddresses = [...user.addresses];
      updatedAddresses[existingIndex] = address;
      setUser({ ...user, addresses: updatedAddresses });
    } else {
      // Add new address
      setUser({ ...user, addresses: [...user.addresses, address] });
    }
  };

  const handlePlaceOrder = async (addressId: string, paymentMethod: string) => {
    // Try to find address in user's addresses, otherwise use from allAddresses in Checkout
    let address = user.addresses.find((a) => a.id === addressId);
    
    // If address not found in user addresses, it might be newly added in Checkout
    // Create a fallback order with basic info
    if (!address) {
      console.log('Address not found in user.addresses, using fallback');
      address = {
        id: addressId,
        type: 'home' as const,
        name: user.name,
        phone: user.phone,
        street: 'Address details',
        city: 'City',
        state: 'State',
        pincode: '000000',
        landmark: '',
        isDefault: false
      };
    }

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber: `MZ${Date.now().toString().slice(-8)}`,
      date: new Date().toISOString(),
      items: cartItems,
      total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'confirmed',
      deliveryAddress: address,
      estimatedDeliveryTime: cartItems.length > 0 ? Math.max(...cartItems.map((item) => item.estimatedDeliveryTime)) : 60,
      paymentMethod,
      prescriptionRequired: cartItems.some((item) => item.requiresPrescription),
      prescriptionVerified: true,
    };

    // Save order to cloud
    try {
      const savedOrder = await cloudSyncService.saveOrderToCloud(newOrder);
      if (savedOrder) {
        setOrders([savedOrder, ...orders]);
        setSelectedOrder(savedOrder);
        toast.success(language === 'en' ? 'Order placed and saved to cloud!' : 'ऑर्डर प्लेस किया गया और क्लाउड में सेव हो गया!');
      } else {
        // Fallback to local storage if cloud save fails
        setOrders([newOrder, ...orders]);
        setSelectedOrder(newOrder);
        toast.warning(language === 'en' ? 'Order placed locally. Will sync when online.' : 'ऑर्डर स्थानीय रूप से प्लेस किया गया। ऑनलाइन होने पर सिंक होगा।');
      }
    } catch (error) {
      console.error('Error saving order to cloud:', error);
      setOrders([newOrder, ...orders]);
      setSelectedOrder(newOrder);
      toast.warning(language === 'en' ? 'Order placed locally. Will sync when online.' : 'ऑर्डर स्थानीय रूप से प्लेस किया गया। ऑनलाइन होने पर सिंक होगा।');
    }
    
    setCartItems([]);
    setCurrentView('order-success');

    // Simulate order status updates
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) => (o.id === newOrder.id ? { ...o, status: 'packed' } : o))
      );
      toast.info(language === 'en' ? '📦 Your order is being packed' : '📦 आपका ऑर्डर पैक किया जा रहा है');
    }, 10000);

    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) => (o.id === newOrder.id ? { ...o, status: 'out_for_delivery' } : o))
      );
      toast.info(language === 'en' ? '🚚 Your order is out for delivery' : '🚚 आपका ऑर्डर डिलीवरी के लिए निकल गया है');
    }, 20000);
  };

  const handleMedicineClick = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setCurrentView('medicine-detail');
  };

  const handleUploadPrescription = () => {
    setCurrentView('prescription');
  };

  const handlePrescriptionUploadComplete = () => {
    toast.success(
      language === 'en'
        ? 'Prescription uploaded successfully!'
        : 'प्रिस्क्रिप्शन सफलतापूर्वक अपलोड किया गया!'
    );
    setCurrentView('home');
  };

  const handleSearchSubmit = () => {
    setCurrentView('search');
  };

  const handleAcceptOrder = () => {
    toast.success('Order accepted and assigned to delivery partner');
  };

  const handleRejectOrder = () => {
    toast.error('Order rejected');
  };

  const renderAdminLogin = () => (
    <div className="min-h-screen">
      <AdminLogin
        onLoginSuccess={(admin) => {
          handleLogin(admin as User);
          window.history.replaceState(null, '', '/admin/dashboard');
        }}
      />
      <Toaster position="top-right" richColors />
    </div>
  );

  if (isAdminSetPasswordPath) {
    return (
      <div className="min-h-screen">
        <AdminSetPassword
          token={adminInviteToken}
          onSuccess={() => window.location.replace('/admin/login')}
        />
        <Toaster position="top-right" richColors />
      </div>
    );
  }

  if (isAdminLoginPath && !isLoggedIn) {
    return renderAdminLogin();
  }

  if (isAdminDashboardPath) {
    if (!isLoggedIn || viewMode !== 'admin') {
      return renderAdminLogin();
    }
  }

  // Render login page if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen">
        <Login onLogin={handleLogin} onBack={() => setCurrentView('login')} language={language} />
        <Toaster position="top-right" richColors />
      </div>
    );
  }

  // Render pharmacy dashboard
  if (viewMode === 'pharmacy') {
    return (
      <div className="min-h-screen">
        <PharmacyDashboard
          pharmacyName={mockPharmacies[0].name}
          orders={mockPharmacyOrders}
          inventory={mockMedicines}
          onAcceptOrder={handleAcceptOrder}
          onRejectOrder={handleRejectOrder}
          onLogout={handleLogout}
        />
        <Toaster position="top-right" />
      </div>
    );
  }

  // Render admin dashboard
  if (viewMode === 'admin') {
    return (
      <div className="min-h-screen">
        <AdminDashboard onLogout={handleLogout} />
        <Toaster position="top-right" />
      </div>
    );
  }

  // Render user view (main app)
  return (
    <div className="min-h-screen">
      {currentView !== 'login' && (
        <Header
          cartCount={cartItems.length}
          onCartClick={() => setCurrentView('cart')}
          onProfileClick={() => setCurrentView('profile')}
          onChatbotClick={() => setShowChatbot(true)}
          onLoginClick={() => setCurrentView('login')}
          onHomeClick={() => setCurrentView('home')}
          isLoggedIn={isLoggedIn}
          language={language}
          onLanguageToggle={handleLanguageToggle}
        />
      )}

      {currentView === 'home' && (
        <HomePage
          medicines={mockMedicines}
          onMedicineClick={handleMedicineClick}
          onUploadPrescription={handleUploadPrescription}
          onScanPrescription={() => setCurrentView('prescription-scanner')}
          onDoctorConsultation={() => {
            if (!isLoggedIn) {
              toast.info(language === 'en' ? 'Please login to continue' : 'कृपया जारी रखने के लिए लॉगिन करें');
              setCurrentView('login');
              return;
            }
            // Navigate to subscription plans so user can subscribe and access consultations
            setCurrentView('subscription-plans');
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          language={language}
        />
      )}

      {currentView === 'search' && (
        <MedicineSearch
          medicines={mockMedicines}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onMedicineClick={handleMedicineClick}
          onBack={() => setCurrentView('home')}
          language={language}
        />
      )}

      {currentView === 'medicine-detail' && selectedMedicine && (
        <MedicineDetail
          medicine={selectedMedicine}
          onBack={() => setCurrentView('search')}
          onAddToCart={handleAddToCart}
          language={language}
        />
      )}

      {currentView === 'prescription' && (
        <PrescriptionUpload
          onBack={() => setCurrentView('home')}
          onUploadComplete={handlePrescriptionUploadComplete}
          savedPrescriptions={mockPrescriptions}
          language={language}
        />
      )}

      {currentView === 'prescription-scanner' && (
        <PrescriptionScanner
          onBack={() => setCurrentView('home')}
          medicines={mockMedicines}
          onAddToCart={handleAddToCart}
          language={language}
        />
      )}

      {currentView === 'cart' && (
        <Cart
          items={cartItems}
          onBack={() => setCurrentView('home')}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={() => setCurrentView('checkout')}
          language={language}
        />
      )}

      {currentView === 'checkout' && (
        <Checkout
          items={cartItems}
          addresses={user.addresses}
          onBack={() => setCurrentView('cart')}
          onPlaceOrder={handlePlaceOrder}
          onAddAddress={handleAddAddress}
          language={language}
        />
      )}

      {currentView === 'order-success' && selectedOrder && (
        <OrderSuccess
          orderNumber={selectedOrder.orderNumber}
          deliveryAddress={selectedOrder.deliveryAddress}
          estimatedDelivery="Fri, Jan 16th '26"
          onContinueShopping={() => setCurrentView('home')}
          onViewOrders={() => setCurrentView('order-tracking')}
          language={language}
        />
      )}

      {currentView === 'order-tracking' && selectedOrder && (
        <OrderTracking
          order={selectedOrder}
          onBack={() => setCurrentView('home')}
          language={language}
        />
      )}

      {currentView === 'profile' && (
        <UserProfile
          user={user}
          orders={orders}
          onBack={() => setCurrentView('home')}
          onLogout={handleLogout}
          onViewOrders={() => {
            if (orders.length > 0) {
              setSelectedOrder(orders[0]);
              setCurrentView('order-tracking');
            }
          }}
          onEditProfile={() => setShowEditProfile(true)}
          onViewHealthDashboard={() => setCurrentView('health-dashboard')}
          language={language}
        />
      )}

      {currentView === 'health-dashboard' && (
        <HealthDashboard
          healthProfile={mockHealthProfile}
          language={language}
          onBack={() => setCurrentView('home')}
        />
      )}

      {currentView === 'subscription-plans' && (
        <SubscriptionPlans
          user={user}
          language={language}
          onSubscriptionCreated={(subscription) => {
            setUserSubscription(subscription);
            setCurrentView('subscription-manager');
          }}
          onBack={() => setCurrentView('home')}
        />
      )}

      {currentView === 'subscription-manager' && userSubscription && (
        <SubscriptionManager
          user={user}
          language={language}
          onBack={() => setCurrentView('home')}
        />
      )}

      {currentView === 'doctor-consultation' && userSubscription && (
        <DoctorConsultationUI
          user={user}
          subscription={userSubscription}
          language={language}
          onBack={() => setCurrentView('home')}
        />
      )}

      {isLoggedIn && (
        <EditProfileModal
          user={user}
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSave={handleUpdateProfile}
          language={language}
        />
      )}

      {showChatbot && <AIChatbot onClose={() => setShowChatbot(false)} language={language} />}

      {/* Beta Badge */}
      <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded text-xs font-semibold z-40">
        MedsZop v0.8 (Beta)
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
