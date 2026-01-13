import { Check, Share2, Package } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Language, Address } from '../types';

interface OrderSuccessProps {
  orderNumber?: string;
  deliveryAddress?: Address;
  estimatedDelivery?: string;
  onContinueShopping: () => void;
  onViewOrders: () => void;
  language: Language;
}

export function OrderSuccess({
  orderNumber,
  deliveryAddress,
  estimatedDelivery = 'Fri, Jan 16th \'26',
  onContinueShopping,
  onViewOrders,
  language
}: OrderSuccessProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Section - Order Success */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* Success Icon */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-20"></div>
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-12 w-12 text-green-600" />
                    </div>
                    <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="h-4 w-4 text-white">✨</div>
                    </div>
                    <div className="absolute -left-2 -bottom-2 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="h-4 w-4 text-white">✨</div>
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
                  {language === 'en' ? 'Thanks for shopping with us!' : 'हमारे साथ खरीदारी के लिए धन्यवाद!'}
                </h1>
                
                <p className="mb-4 text-center text-lg text-gray-600">
                  {language === 'en' ? 'Delivery by' : 'डिलीवरी'} {estimatedDelivery}
                </p>

                {/* Cashback Info */}
                <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <span className="text-2xl">🪙</span>
                    <span className="font-semibold">
                      {language === 'en' ? '8 ZopCoins Cashback' : '8 ZopCoins कैशबैक'} 
                    </span>
                    <span className="text-yellow-600">›</span>
                  </div>
                </div>

                {/* Track Order Link */}
                <button 
                  onClick={onViewOrders}
                  className="mb-6 w-full text-left text-blue-600 font-semibold hover:underline"
                >
                  {language === 'en' ? 'Track & manage order' : 'ऑर्डर ट्रैक और प्रबंधित करें'}
                </button>

                {/* Delivery Info */}
                <div className="mb-6 border-t pt-6">
                  <p className="mb-4 text-lg font-semibold text-gray-900">
                    {language === 'en' ? 'Delivery by' : 'डिलीवरी'} {estimatedDelivery}
                  </p>
                </div>

                {/* Continue Shopping Button */}
                <Button
                  className="h-12 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg"
                  onClick={onContinueShopping}
                >
                  {language === 'en' ? 'Continue Shopping' : 'खरीदारी जारी रखें'}
                </Button>

                {/* Share Order Details */}
                <button className="mt-4 flex w-full items-center justify-between rounded-lg border border-gray-300 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Share2 className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold text-gray-700">
                      {language === 'en' ? 'Send Order Details' : 'ऑर्डर विवरण भेजें'}
                    </span>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Right Section - Delivery Address & Quick Actions */}
          <div className="space-y-4">
            {/* Go to My Orders */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6 text-center">
                <div className="mb-3 flex justify-center">
                  <div className="rounded-lg bg-white p-3">
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="mb-2 font-semibold">
                  {language === 'en' ? 'Why call? Just click!' : 'कॉल क्यों करें? बस क्लिक करें!'}
                </h3>
                <Button
                  className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                  onClick={onViewOrders}
                >
                  {language === 'en' ? 'Go to My Orders' : 'मेरे ऑर्डर पर जाएं'}
                </Button>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            {deliveryAddress && (
              <Card>
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">{deliveryAddress.name}</h3>
                    <button className="text-sm text-blue-600 font-semibold hover:underline">
                      {language === 'en' ? 'Change' : 'बदलें'}
                    </button>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="text-gray-900 font-medium">{deliveryAddress.street}</p>
                    <p>{deliveryAddress.landmark}</p>
                    <p>
                      {deliveryAddress.city}, {deliveryAddress.state}
                    </p>
                    <p>{deliveryAddress.pincode}</p>
                    {deliveryAddress.phone && (
                      <>
                        <p className="mt-3 font-semibold text-gray-900">
                          {language === 'en' ? 'Phone number:' : 'फ़ोन नंबर:'} {deliveryAddress.phone}
                        </p>
                        <button className="text-blue-600 hover:underline">
                          {language === 'en' ? 'Change or Add number' : 'नंबर बदलें या जोड़ें'}
                        </button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
