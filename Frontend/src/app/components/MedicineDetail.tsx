import { ChevronLeft, Clock, Shield, Truck, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Medicine, Language } from '../types';
import { translations } from '../data/mockData';
import { useState } from 'react';

interface MedicineDetailProps {
  medicine: Medicine;
  onBack: () => void;
  onAddToCart: (medicine: Medicine, quantity: number) => void;
  language: Language;
}

export function MedicineDetail({ medicine, onBack, onAddToCart, language }: MedicineDetailProps) {
  const t = translations[language];
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    onAddToCart(medicine, quantity);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Medicine Image */}
      <div className="relative bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="relative mx-auto h-64 w-full max-w-md overflow-hidden rounded-lg bg-gray-100">
            <img
              src={medicine.imageUrl}
              alt={medicine.name}
              className="h-full w-full object-cover"
            />
            {medicine.discount > 0 && (
              <Badge className="absolute right-4 top-4 bg-[var(--health-green)] text-base px-3 py-1">
                {medicine.discount}% OFF
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Medicine Info */}
      <div className="container mx-auto px-4 py-4">
        <Card className="mb-4">
          <CardContent className="p-6">
            <h1 className="mb-2 text-2xl font-bold">{medicine.brand}</h1>
            <p className="mb-4 text-muted-foreground">{medicine.genericName}</p>

            <div className="mb-4 space-y-1 border-b pb-4 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {language === 'en' ? 'Manufacturer' : 'निर्माता'}
                </span>
                <span className="font-medium">: {medicine.manufacturer}</span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {language === 'en' ? 'Pack Size' : 'पैक साइज़'}
                </span>
                <span className="font-medium">: {medicine.packSize}</span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {language === 'en' ? 'Category' : 'श्रेणी'}
                </span>
                <span className="font-medium">: {medicine.category}</span>
              </div>
            </div>

            <div className="mb-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[var(--health-blue)]">
                ₹{medicine.price}
              </span>
              {medicine.discount > 0 && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ₹{medicine.mrp}
                  </span>
                  <span className="text-lg text-[var(--health-green)] font-semibold">
                    Save ₹{(medicine.mrp - medicine.price).toFixed(2)}
                  </span>
                </>
              )}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {medicine.nearbyAvailability ? (
                <Badge className="bg-[var(--health-green-light)] text-[var(--health-green-dark)] border-[var(--health-green)]">
                  <Clock className="mr-1 h-3 w-3" />
                  {language === 'en' ? `Delivery in ${medicine.estimatedDeliveryTime} mins` : `${medicine.estimatedDeliveryTime} मिनट में डिलीवरी`}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-orange-500 text-orange-500">
                  {language === 'en' ? 'Delivery in 55+ mins' : '55+ मिनट में डिलीवरी'}
                </Badge>
              )}

              {medicine.inStock ? (
                <Badge className="bg-[var(--health-green-light)] text-[var(--health-green-dark)] border-[var(--health-green)]">
                  {t.inStock}
                </Badge>
              ) : (
                <Badge variant="destructive">{t.outOfStock}</Badge>
              )}

              {medicine.requiresPrescription && (
                <Badge variant="outline" className="border-[var(--trust-blue)] text-[var(--trust-blue)]">
                  {t.prescriptionRequired}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <h2 className="mb-3 text-lg font-semibold">
              {language === 'en' ? 'Description' : 'विवरण'}
            </h2>
            <p className="text-muted-foreground">{medicine.description}</p>
          </CardContent>
        </Card>

        {/* Delivery Info */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {language === 'en' ? 'Delivery Information' : 'डिलीवरी जानकारी'}
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--health-blue-light)]">
                  <Truck className="h-5 w-5 text-[var(--health-blue)]" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {language === 'en' ? 'Fast Delivery' : 'तेज़ डिलीवरी'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Get it delivered in 60 minutes' : '60 मिनट में प्राप्त करें'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--health-green-light)]">
                  <Shield className="h-5 w-5 text-[var(--health-green)]" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {language === 'en' ? 'Verified Medicine' : 'सत्यापित दवा'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? '100% authentic from licensed pharmacies' : 'लाइसेंस प्राप्त फार्मेसियों से 100% प्रामाणिक'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-semibold">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              className="flex-1 bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)] h-12 text-lg"
              onClick={handleAddToCart}
              disabled={!medicine.inStock}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {t.addToCart}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
