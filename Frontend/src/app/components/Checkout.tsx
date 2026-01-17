import { ChevronLeft, MapPin, CreditCard, Wallet, Check, Loader2, Edit2, Upload, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { CartItem, Address, Language } from '../types';
import { useState } from 'react';
import { orderService } from '../../services/orderService';
import { toast } from 'sonner';
import { AddAddressModal } from './AddAddressModal';
import { EditAddressModal } from './EditAddressModal';

interface CheckoutProps {
  items: CartItem[];
  addresses: Address[];
  onBack: () => void;
  onPlaceOrder: (addressId: string, paymentMethod: string) => void;
  onAddAddress?: (address: Address) => void;
  language: Language;
}

export function Checkout({ items, addresses, onBack, onPlaceOrder, onAddAddress, language }: CheckoutProps) {
  // Normalize incoming addresses to avoid runtime errors when data is missing or not an array
  const normalizedAddresses = Array.isArray(addresses) ? addresses : [];

  const [selectedAddress, setSelectedAddress] = useState(
    normalizedAddresses.find((a) => a.isDefault)?.id || normalizedAddresses[0]?.id || ''
  );
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showEditAddressModal, setShowEditAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [allAddresses, setAllAddresses] = useState<Address[]>(normalizedAddresses);
  const [currentStep, setCurrentStep] = useState<'address' | 'summary' | 'payment'>('address');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);

  const requiresPrescription = items.some(item => item.requiresPrescription);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 0; // Free delivery
  const total = subtotal + deliveryFee;

  const handleAddAddress = (newAddress: Address) => {
    setAllAddresses([...allAddresses, newAddress]);
    setSelectedAddress(newAddress.id);
    if (onAddAddress) {
      onAddAddress(newAddress);
    }
  };

  const handleEditAddress = (updatedAddress: Address) => {
    setAllAddresses(
      allAddresses.map((addr) =>
        addr.id === updatedAddress.id ? updatedAddress : addr
      )
    );
    // Also update in parent if onAddAddress exists
    if (onAddAddress) {
      onAddAddress(updatedAddress);
    }
    setEditingAddress(null);
  };

  const openEditModal = (address: Address) => {
    setEditingAddress(address);
    setShowEditAddressModal(true);
  };

  const handleDeliverHere = () => {
    if (!selectedAddress) {
      toast.error(language === 'en' ? 'Please select an address' : 'कृपया पता चुनें');
      return;
    }
    setCurrentStep('summary');
  };

  const handleContinueToPayment = () => {
    setCurrentStep('payment');
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    if (requiresPrescription && !prescriptionFile) {
      toast.error(language === 'en' ? 'Please upload prescription for medicines that require it' : 'कृपया दवाओं के लिए प्रिस्क्रिप्शन अपलोड करें');
      return;
    }

    setIsLoading(true);
    try {
      const address = allAddresses.find(a => a.id === selectedAddress);
      if (!address) {
        toast.error('Invalid address selected');
        return;
      }

      const orderData: any = {
        items: items.map(item => ({
          medicineId: item.id,
          name: item.name,
          brand: item.brand,
          price: item.price,
          quantity: item.quantity
        })),
        deliveryAddress: {
          type: address.type,
          street: address.street,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          landmark: address.landmark || ''
        },
        paymentMethod: paymentMethod === 'cod' ? 'cash_on_delivery' : paymentMethod,
        total: total
      };

      // If prescription is required and uploaded, create a placeholder prescriptionId
      // In production, you would upload the file to the server first and get a real ID
      if (requiresPrescription && prescriptionFile) {
        // For now, we'll create a mock ObjectId (in production, upload file first)
        orderData.prescriptionId = '507f1f77bcf86cd799439011'; // Placeholder
      }

      const result = await orderService.createOrder(orderData);
      if (result.success) {
        // Update user addresses if this is a new address
        if (onAddAddress && !allAddresses.find(a => a.id === selectedAddress)) {
          onAddAddress(address);
        }
        // Small delay to show success message before navigation
        toast.success('Order placed successfully!');
        setTimeout(() => {
          onPlaceOrder(selectedAddress, paymentMethod);
        }, 500);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to place order';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-32 transition-colors duration-300">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm dark:shadow-md border-b dark:border-slate-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">
              {language === 'en' ? 'Checkout' : 'चेकआउट'}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Delivery Address Section */}
        {currentStep === 'address' && (
          <div className="mb-4">
            <div className="mb-3 flex items-center gap-2 rounded-t-lg bg-[var(--health-blue)] px-4 py-3 text-white">
              <MapPin className="h-5 w-5" />
              <h2 className="text-base font-semibold uppercase">
                {language === 'en' ? 'Delivery Address' : 'डिलीवरी पता'}
              </h2>
            </div>

            <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
            <div className="space-y-3">
              {allAddresses.map((address) => (
                <div
                  key={address.id}
                  className={`rounded-lg border transition-all ${
                    selectedAddress === address.id
                      ? 'border-[var(--health-blue)] bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={address.id} id={address.id} />
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-base font-semibold">{address.name}</span>
                            <Badge className="bg-gray-200 text-gray-700 text-xs uppercase px-2 py-0.5">
                              {address.type}
                            </Badge>
                            <span className="text-sm font-medium text-gray-700">{address.phone}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="link"
                        className="text-[var(--health-blue)] font-semibold uppercase text-sm p-0 h-auto"
                        onClick={() => openEditModal(address)}
                      >
                        {language === 'en' ? 'Edit' : 'संपादित करें'}
                      </Button>
                    </div>
                    
                    <div className="ml-9">
                      <p className="text-sm text-gray-700 mb-3 uppercase">
                        {address.street}, {address.city}, {address.landmark ? `${address.landmark}, ` : ''}{address.state} - {address.pincode}
                      </p>
                      
                      {selectedAddress === address.id && (
                        <Button 
                          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold uppercase px-6"
                          onClick={handleDeliverHere}
                        >
                          {language === 'en' ? 'Deliver Here' : 'यहां डिलीवर करें'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>

          <Button 
            variant="outline" 
            className="mt-4 w-full border-[var(--health-green)] text-[var(--health-green)] hover:bg-[var(--health-green-light)]" 
            onClick={() => setShowAddAddressModal(true)}
          >
            {language === 'en' ? '+ Add New Address' : '+ नया पता जोड़ें'}
          </Button>
        </div>
        )}

        {/* Order Summary Section */}
        {currentStep === 'summary' && (
          <div className="mb-4">
            <div className="mb-3 flex items-center gap-2 rounded-t-lg bg-[var(--health-blue)] px-4 py-3 text-white">
              <h2 className="text-base font-semibold uppercase">
                {language === 'en' ? 'Order Summary' : 'ऑर्डर सारांश'}
              </h2>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4 space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.brand} × {item.quantity}
                      </span>
                      <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === 'en' ? 'Item Total' : 'कुल आइटम'}
                    </span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === 'en' ? 'Delivery Fee' : 'डिलीवरी शुल्क'}
                    </span>
                    <span className="font-medium text-[var(--health-green)]">
                      {deliveryFee === 0 ? (language === 'en' ? 'FREE' : 'मुफ़्त') : `₹${deliveryFee}`}
                    </span>
                  </div>

                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">
                        {language === 'en' ? 'Total' : 'कुल'}
                      </span>
                      <span className="font-bold text-[var(--health-blue)]">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="mt-6 w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold uppercase"
                  onClick={handleContinueToPayment}
                >
                  {language === 'en' ? 'Continue' : 'जारी रखें'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Method Section */}
        {currentStep === 'payment' && (
          <>
            {/* Prescription Upload Section - if required */}
            {requiresPrescription && (
              <div className="mb-4">
                <div className="mb-3 flex items-center gap-2 rounded-t-lg bg-orange-500 px-4 py-3 text-white">
                  <FileText className="h-5 w-5" />
                  <h2 className="text-base font-semibold uppercase">
                    {language === 'en' ? 'Upload Prescription' : 'प्रिस्क्रिप्शन अपलोड करें'}
                  </h2>
                </div>

                <Card className="mb-4">
                  <CardContent className="p-6">
                    <div className="mb-4 rounded-lg bg-orange-50 border border-orange-200 p-3 flex items-start gap-2">
                      <div className="text-orange-600 mt-0.5">⚠️</div>
                      <p className="text-sm text-orange-800">
                        {language === 'en' 
                          ? 'This order in your cart require a valid prescription. Please upload a clear image of your prescription.' 
                          : 'आपके कार्ट में इस आइटम के लिए वैध प्रिस्क्रिप्शन की आवश्यकता है। कृपया अपने प्रिस्क्रिप्शन की स्पष्ट छवि अपलोड करें।'}
                      </p>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="prescription-upload"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setPrescriptionFile(file);
                            toast.success(language === 'en' ? 'Prescription uploaded successfully' : 'प्रिस्क्रिप्शन सफलतापूर्वक अपलोड किया गया');
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="prescription-upload"
                        className="cursor-pointer"
                      >
                        {prescriptionFile ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 text-green-600">
                              <Check className="h-5 w-5" />
                              <span className="font-semibold">{prescriptionFile.name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {language === 'en' ? 'Click to change' : 'बदलने के लिए क्लिक करें'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex justify-center">
                              <Upload className="h-12 w-12 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-base font-semibold text-gray-700">
                                {language === 'en' ? 'Click to upload prescription' : 'प्रिस्क्रिप्शन अपलोड करने के लिए क्लिक करें'}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {language === 'en' ? 'JPG, PNG or PDF (Max 5MB)' : 'JPG, PNG या PDF (अधिकतम 5MB)'}
                              </p>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="mb-3 flex items-center gap-2 rounded-t-lg bg-[var(--health-blue)] px-4 py-3 text-white">
              <h2 className="text-base font-semibold uppercase">
                {language === 'en' ? 'Payment Options' : 'भुगतान विकल्प'}
              </h2>
            </div>

            <Card className="mb-4">
          <CardContent className="p-6">

            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-3">
                <div
                  className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                    paymentMethod === 'upi'
                      ? 'border-[var(--health-blue)] bg-[var(--health-blue-light)]'
                      : 'border-gray-200'
                  }`}
                >
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex flex-1 cursor-pointer items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                      <Wallet className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold">
                        {language === 'en' ? 'UPI Payment' : 'UPI भुगतान'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'en'
                          ? 'Google Pay, PhonePe, Paytm'
                          : 'Google Pay, PhonePe, Paytm'}
                      </div>
                    </div>
                  </Label>
                </div>

                <div
                  className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-[var(--health-blue)] bg-[var(--health-blue-light)]'
                      : 'border-gray-200'
                  }`}
                >
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex flex-1 cursor-pointer items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold">
                        {language === 'en' ? 'Credit / Debit Card' : 'क्रेडिट / डेबिट कार्ड'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Visa, Mastercard, Rupay' : 'Visa, Mastercard, Rupay'}
                      </div>
                    </div>
                  </Label>
                </div>

                <div
                  className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                    paymentMethod === 'cod'
                      ? 'border-[var(--health-blue)] bg-[var(--health-blue-light)]'
                      : 'border-gray-200'
                  }`}
                >
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex flex-1 cursor-pointer items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                      <Wallet className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold">
                        {language === 'en' ? 'Cash on Delivery' : 'कैश ऑन डिलीवरी'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Pay when you receive' : 'प्राप्त होने पर भुगतान करें'}
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Order Summary - shown on payment step only */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {language === 'en' ? 'Price Details' : 'मूल्य विवरण'}
            </h2>

            <div className="mb-4 space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.brand} × {item.quantity}
                  </span>
                  <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'en' ? 'Item Total' : 'कुल आइटम'}
                </span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'en' ? 'Delivery Fee' : 'डिलीवरी शुल्क'}
                </span>
                <span className="font-medium text-[var(--health-green)]">
                  {deliveryFee === 0 ? (language === 'en' ? 'FREE' : 'मुफ़्त') : `₹${deliveryFee}`}
                </span>
              </div>

              <div className="border-t pt-2">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">
                    {language === 'en' ? 'Total' : 'कुल'}
                  </span>
                  <span className="font-bold text-[var(--health-blue)]">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* Bottom Action Bar - only shown on payment step */}
      {currentStep === 'payment' && (
        <div className="container mx-auto px-4 py-4">
          <Button
            className="h-12 w-full bg-[var(--health-green)] hover:bg-[var(--health-green-dark)] text-lg"
            onClick={handlePlaceOrder}
            disabled={!selectedAddress || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {language === 'en' ? 'Placing Order...' : 'ऑर्डर दे रहे हैं...'}
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                {language === 'en' ? 'Place Order' : 'ऑर्डर करें'}
              </>
            )}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {language === 'en'
              ? 'By placing order, you agree to our Terms & Conditions'
              : 'ऑर्डर देकर, आप हमारे नियम और शर्तों से सहमत हैं'}
          </p>
        </div>
      )}

      <AddAddressModal
        isOpen={showAddAddressModal}
        onClose={() => setShowAddAddressModal(false)}
        onAddAddress={handleAddAddress}
        language={language}
      />

      <EditAddressModal
        isOpen={showEditAddressModal}
        address={editingAddress}
        onClose={() => {
          setShowEditAddressModal(false);
          setEditingAddress(null);
        }}
        onSave={handleEditAddress}
        language={language}
      />
    </div>
  );
}
