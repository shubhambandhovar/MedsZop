import { ChevronLeft, Package, CheckCircle, Truck, MapPin, Phone, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Order, Language } from '../types';
import { useEffect, useState } from 'react';

interface OrderTrackingProps {
  order: Order;
  onBack: () => void;
  language: Language;
}

export function OrderTracking({ order, onBack, language }: OrderTrackingProps) {
  const [timeRemaining, setTimeRemaining] = useState(order.estimatedDeliveryTime);

  useEffect(() => {
    if (order.status === 'out_for_delivery' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 60000); // Update every minute
      return () => clearInterval(timer);
    }
  }, [order.status, timeRemaining]);

  const getStatusSteps = () => {
    const steps = [
      { key: 'confirmed', label: language === 'en' ? 'Order Confirmed' : 'ऑर्डर कन्फर्म', icon: CheckCircle },
      { key: 'packed', label: language === 'en' ? 'Packed' : 'पैक किया गया', icon: Package },
      { key: 'out_for_delivery', label: language === 'en' ? 'Out for Delivery' : 'डिलीवरी के लिए निकला', icon: Truck },
      { key: 'delivered', label: language === 'en' ? 'Delivered' : 'डिलीवर हो गया', icon: CheckCircle },
    ];

    const statusOrder = ['confirmed', 'packed', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const statusSteps = getStatusSteps();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-8 transition-colors duration-300">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm dark:shadow-md border-b dark:border-slate-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {language === 'en' ? 'Track Order' : 'ऑर्डर ट्रैक करें'}
              </h1>
              <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Delivery Timer */}
        {order.status === 'out_for_delivery' && timeRemaining > 0 && (
          <Card className="mb-4 border-[var(--health-green)] bg-gradient-to-r from-[var(--health-green-light)] to-white">
            <CardContent className="p-6 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <Clock className="h-8 w-8 text-[var(--health-green)]" />
              </div>
              <h2 className="mb-1 text-3xl font-bold text-[var(--health-green-dark)]">
                {timeRemaining} {language === 'en' ? 'mins' : 'मिनट'}
              </h2>
              <p className="text-sm text-[var(--health-green-dark)]">
                {language === 'en' ? 'Expected delivery time' : 'अपेक्षित डिलीवरी समय'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Order Status */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {language === 'en' ? 'Order Status' : 'ऑर्डर स्थिति'}
            </h2>

            <div className="relative">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
                    {/* Vertical Line */}
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`absolute left-5 top-10 h-full w-0.5 ${
                          step.completed ? 'bg-[var(--health-green)]' : 'bg-gray-300'
                        }`}
                      />
                    )}

                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${
                        step.completed
                          ? 'bg-[var(--health-green)] text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3
                        className={`font-semibold ${
                          step.active ? 'text-[var(--health-green)]' : ''
                        }`}
                      >
                        {step.label}
                      </h3>
                      {step.completed && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.date).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Active Badge */}
                    {step.active && (
                      <Badge className="bg-[var(--health-green)]">
                        {language === 'en' ? 'In Progress' : 'प्रगति में'}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <h2 className="mb-3 text-lg font-semibold">
              {language === 'en' ? 'Delivery Address' : 'डिलीवरी पता'}
            </h2>
            <div className="flex gap-3">
              <MapPin className="h-5 w-5 text-[var(--health-blue)]" />
              <div>
                <p className="font-medium capitalize">{order.deliveryAddress.type}</p>
                <p className="text-sm text-muted-foreground">
                  {order.deliveryAddress.street}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
                  {order.deliveryAddress.pincode}
                </p>
                {order.deliveryAddress.landmark && (
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Landmark' : 'लैंडमार्क'}:{' '}
                    {order.deliveryAddress.landmark}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <h2 className="mb-3 text-lg font-semibold">
              {language === 'en' ? 'Order Items' : 'ऑर्डर आइटम'} ({order.items.length})
            </h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.brand}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.packSize} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>{language === 'en' ? 'Total Amount' : 'कुल राशि'}</span>
                <span className="text-[var(--health-blue)]">₹{order.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-lg font-semibold">
              {language === 'en' ? 'Need Help?' : 'मदद चाहिए?'}
            </h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Phone className="h-5 w-5 text-[var(--health-blue)]" />
                {language === 'en' ? 'Contact Support' : 'सपोर्ट से संपर्क करें'}
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3">
                <Package className="h-5 w-5 text-[var(--health-blue)]" />
                {language === 'en' ? 'Report an Issue' : 'समस्या की रिपोर्ट करें'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
