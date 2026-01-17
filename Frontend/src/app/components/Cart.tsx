import { ChevronLeft, Minus, Plus, Trash2, Clock, ShoppingBag } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { CartItem, Language } from '../types';
import { translations } from '../data/mockData';

interface CartProps {
  items: CartItem[];
  onBack: () => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  language: Language;
}

export function Cart({
  items,
  onBack,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  language,
}: CartProps) {
  const t = translations[language];

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? 0 : 0; // Free delivery
  const total = subtotal + deliveryFee;

  const estimatedDeliveryTime = items.length > 0
    ? Math.max(...items.map((item) => item.estimatedDeliveryTime))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-32 transition-colors duration-300">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm dark:shadow-md border-b dark:border-slate-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onBack} className="dark:hover:bg-slate-700 dark:text-slate-200">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold dark:text-white">
                {t.cart} ({items.length})
              </h1>
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        /* Empty Cart */
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
            <ShoppingBag className="h-12 w-12 text-muted-foreground dark:text-slate-400" />
          </div>
          <h2 className="mb-2 text-xl font-semibold dark:text-white">
            {language === 'en' ? 'Your cart is empty' : 'आपका कार्ट खाली है'}
          </h2>
          <p className="mb-6 text-muted-foreground dark:text-slate-400">
            {language === 'en' ? 'Add medicines to get started' : 'शुरू करने के लिए दवाएं जोड़ें'}
          </p>
          <Button onClick={onBack} className="bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)]">
            {language === 'en' ? 'Browse Medicines' : 'दवाएं ब्राउज़ करें'}
          </Button>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-4">
          {/* Delivery Time Banner */}
          <Card className="mb-4 border-[var(--health-green)] dark:border-green-600 bg-[var(--health-green-light)] dark:bg-green-900/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-green)] dark:bg-green-600">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--health-green-dark)] dark:text-green-300">
                  {language === 'en' ? 'Delivery Time' : 'डिलीवरी समय'}
                </h3>
                <p className="text-sm text-[var(--health-green-dark)] dark:text-green-200">
                  {language === 'en'
                    ? `Expected in ${estimatedDeliveryTime} minutes`
                    : `${estimatedDeliveryTime} मिनट में अपेक्षित`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cart Items */}
          <div className="mb-4 space-y-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold">{item.brand}</h3>
                      <p className="mb-2 text-sm text-muted-foreground">{item.packSize}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-[var(--health-blue)]">
                          ₹{item.price * item.quantity}
                        </span>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>

                  {item.requiresPrescription && (
                    <div className="mt-3 rounded-lg bg-orange-50 p-2 text-sm text-orange-700">
                      {language === 'en'
                        ? '⚠️ Prescription required for this medicine'
                        : '⚠️ इस दवा के लिए प्रिस्क्रिप्शन आवश्यक है'}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bill Summary */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold">
                {language === 'en' ? 'Bill Summary' : 'बिल सारांश'}
              </h2>

              <div className="space-y-3 text-sm">
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

                <div className="border-t dark:border-slate-700 pt-3">
                  <div className="flex justify-between text-base">
                    <span className="font-semibold dark:text-white">
                      {language === 'en' ? 'Total Amount' : 'कुल राशि'}
                    </span>
                    <span className="font-bold text-[var(--health-blue)] dark:text-blue-400">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Action Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg dark:shadow-2xl">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  {language === 'en' ? 'Total Amount' : 'कुल राशि'}
                </p>
                <p className="text-2xl font-bold text-[var(--health-blue)] dark:text-blue-400">₹{total.toFixed(2)}</p>
              </div>
              <Button
                className="h-12 flex-1 bg-[var(--health-green)] hover:bg-[var(--health-green-dark)] text-lg dark:bg-green-600 dark:hover:bg-green-700"
                onClick={onCheckout}
              >
                {t.checkout}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
