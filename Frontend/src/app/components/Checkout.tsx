import { ChevronLeft, MapPin, CreditCard, Wallet, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { CartItem, Address, Language } from '../types';
import { useState } from 'react';

interface CheckoutProps {
  items: CartItem[];
  addresses: Address[];
  onBack: () => void;
  onPlaceOrder: (addressId: string, paymentMethod: string) => void;
  language: Language;
}

export function Checkout({ items, addresses, onBack, onPlaceOrder, language }: CheckoutProps) {
  const [selectedAddress, setSelectedAddress] = useState(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || ''
  );
  const [paymentMethod, setPaymentMethod] = useState('upi');

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 0; // Free delivery
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = () => {
    onPlaceOrder(selectedAddress, paymentMethod);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white shadow-sm">
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
        {/* Delivery Address */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {language === 'en' ? 'Delivery Address' : 'डिलीवरी पता'}
            </h2>

            <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`flex items-start gap-3 rounded-lg border-2 p-4 transition-colors ${
                      selectedAddress === address.id
                        ? 'border-[var(--health-blue)] bg-[var(--health-blue-light)]'
                        : 'border-gray-200'
                    }`}
                  >
                    <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                    <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                      <div className="mb-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[var(--health-blue)]" />
                        <span className="font-semibold capitalize">{address.type}</span>
                        {address.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            {language === 'en' ? 'Default' : 'डिफ़ॉल्ट'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {address.street}, {address.city}, {address.state} - {address.pincode}
                      </p>
                      {address.landmark && (
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' ? 'Landmark' : 'लैंडमार्क'}: {address.landmark}
                        </p>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <Button variant="outline" className="mt-4 w-full">
              {language === 'en' ? '+ Add New Address' : '+ नया पता जोड़ें'}
            </Button>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {language === 'en' ? 'Payment Method' : 'भुगतान विधि'}
            </h2>

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

        {/* Order Summary */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {language === 'en' ? 'Order Summary' : 'ऑर्डर सारांश'}
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
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <Button
            className="h-12 w-full bg-[var(--health-green)] hover:bg-[var(--health-green-dark)] text-lg"
            onClick={handlePlaceOrder}
            disabled={!selectedAddress}
          >
            <Check className="mr-2 h-5 w-5" />
            {language === 'en' ? 'Place Order' : 'ऑर्डर करें'}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {language === 'en'
              ? 'By placing order, you agree to our Terms & Conditions'
              : 'ऑर्डर देकर, आप हमारे नियम और शर्तों से सहमत हैं'}
          </p>
        </div>
      </div>
    </div>
  );
}
