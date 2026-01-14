import { useState, useEffect } from 'react';
import { Search, Clock, Shield, Pill, Upload, Stethoscope, Bell, ChevronRight, Loader2, Scan } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Medicine, Language } from '../types';
import { translations } from '../data/mockData';
import { medicineService } from '../../services/medicineService';
import { toast } from 'sonner';

interface HomePageProps {
  medicines: Medicine[];
  onMedicineClick: (medicine: Medicine) => void;
  onUploadPrescription: () => void;
  onScanPrescription?: () => void;
  onDoctorConsultation: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  language: Language;
}

export function HomePage({
  medicines,
  onMedicineClick,
  onUploadPrescription,
  onScanPrescription,
  onDoctorConsultation,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  language,
}: HomePageProps) {
  const t = translations[language];
  const [isLoading, setIsLoading] = useState(true);
  const [displayMedicines, setDisplayMedicines] = useState<Medicine[]>(medicines);

  // Fetch medicines from backend on mount
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setIsLoading(true);
        const response = await medicineService.getMedicines({
          limit: 6,
          page: 1
        });
        if (response.success) {
          // Merge with pharmacy-added medicines from localStorage
          const pharmacyMedicines = JSON.parse(localStorage.getItem('pharmacyMedicines') || '[]');
          const merged = [...pharmacyMedicines, ...response.data].slice(0, 6);
          setDisplayMedicines(merged);
        }
      } catch (error: any) {
        // Fall back to mock data + pharmacy medicines if API fails
        const pharmacyMedicines = JSON.parse(localStorage.getItem('pharmacyMedicines') || '[]');
        const merged = [...pharmacyMedicines, ...medicines].slice(0, 6);
        setDisplayMedicines(merged);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  const popularMedicines = (displayMedicines && displayMedicines.length > 0) ? displayMedicines : medicines.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--health-blue-light)] to-white pb-8">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)] md:text-4xl">
            {t.welcome}
          </h1>
          <p className="mb-6 text-lg text-muted-foreground md:text-xl">
            {t.tagline}
          </p>

          {/* Search Bar */}
          <div className="mx-auto mb-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
                className="h-14 rounded-full border-2 pl-12 pr-4 text-lg shadow-lg"
              />
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-[var(--health-green)] bg-white shadow-md transition-transform hover:scale-105">
              <CardContent className="flex flex-col items-center p-6">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-green-light)]">
                  <Clock className="h-6 w-6 text-[var(--health-green)]" />
                </div>
                <h3 className="mb-1 font-semibold">60 {t.minutes}</h3>
                <p className="text-center text-sm text-muted-foreground">
                  {language === 'en' ? 'Fast delivery' : 'तेज़ डिलीवरी'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-[var(--trust-blue)] bg-white shadow-md transition-transform hover:scale-105">
              <CardContent className="flex flex-col items-center p-6">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-blue-light)]">
                  <Shield className="h-6 w-6 text-[var(--trust-blue)]" />
                </div>
                <h3 className="mb-1 font-semibold">
                  {language === 'en' ? 'Verified' : 'सत्यापित'}
                </h3>
                <p className="text-center text-sm text-muted-foreground">
                  {language === 'en' ? 'Authentic medicines' : 'प्रामाणिक दवाएं'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-[var(--health-green)] bg-white shadow-md transition-transform hover:scale-105">
              <CardContent className="flex flex-col items-center p-6">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-green-light)]">
                  <Pill className="h-6 w-6 text-[var(--health-green)]" />
                </div>
                <h3 className="mb-1 font-semibold">
                  {language === 'en' ? 'Wide Range' : 'विस्तृत श्रृंखला'}
                </h3>
                <p className="text-center text-sm text-muted-foreground">
                  {language === 'en' ? '10,000+ medicines' : '10,000+ दवाएं'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-[var(--trust-blue)] bg-white shadow-md transition-transform hover:scale-105">
              <CardContent className="flex flex-col items-center p-6">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-blue-light)]">
                  <Bell className="h-6 w-6 text-[var(--trust-blue)]" />
                </div>
                <h3 className="mb-1 font-semibold">
                  {language === 'en' ? 'Reminders' : 'रिमाइंडर'}
                </h3>
                <p className="text-center text-sm text-muted-foreground">
                  {language === 'en' ? 'Never miss a dose' : 'कभी मत भूलें'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card
              className="cursor-pointer border-2 border-[var(--health-blue)] bg-gradient-to-br from-[var(--health-blue-light)] to-white shadow-lg transition-all hover:shadow-xl"
              onClick={onUploadPrescription}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--health-blue)]">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="mb-1 text-lg font-semibold">{t.uploadPrescription}</h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Get medicines delivered' : 'दवाएं घर पर पाएं'}
                  </p>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </CardContent>
            </Card>

            {onScanPrescription && (
              <Card
                className="cursor-pointer border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-white shadow-lg transition-all hover:shadow-xl"
                onClick={onScanPrescription}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500">
                    <Scan className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="mb-1 text-lg font-semibold">
                      {language === 'en' ? 'AI Prescription Scanner' : 'AI प्रिस्क्रिप्शन स्कैनर'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Auto-detect medicines' : 'स्वचालित दवा पहचान'}
                    </p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </CardContent>
              </Card>
            )}

            <Card
              className="cursor-pointer border-2 border-[var(--health-green)] bg-gradient-to-br from-[var(--health-green-light)] to-white shadow-lg transition-all hover:shadow-xl"
              onClick={onDoctorConsultation}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--health-green)]">
                  <Stethoscope className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="mb-1 text-lg font-semibold">
                    {language === 'en' ? 'Doctor Consultation' : 'डॉक्टर परामर्श'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Chat or video call' : 'चैट या वीडियो कॉल'}
                  </p>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Popular Medicines */}
      <div className="container mx-auto px-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {language === 'en' ? 'Popular Medicines' : 'लोकप्रिय दवाएं'}
          </h2>
          <Button variant="ghost" onClick={onSearchSubmit}>
            {language === 'en' ? 'View All' : 'सभी देखें'}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popularMedicines.map((medicine) => (
            <Card
              key={medicine.id}
              className="cursor-pointer overflow-hidden shadow-md transition-all hover:shadow-lg"
              onClick={() => onMedicineClick(medicine)}
            >
              <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                <img
                  src={medicine.imageUrl}
                  alt={medicine.name}
                  className="h-full w-full object-cover"
                />
                {medicine.discount > 0 && (
                  <Badge className="absolute right-2 top-2 bg-[var(--health-green)]">
                    {medicine.discount}% OFF
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="mb-1 font-semibold">{medicine.brand}</h3>
                <p className="mb-2 text-sm text-muted-foreground">{medicine.genericName}</p>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg font-bold text-[var(--health-blue)]">
                    ₹{medicine.price}
                  </span>
                  {medicine.discount > 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{medicine.mrp}
                    </span>
                  )}
                </div>
                {medicine.nearbyAvailability && (
                  <div className="flex items-center gap-1 text-sm text-[var(--health-green)]">
                    <Clock className="h-4 w-4" />
                    <span>
                      {t.deliveryTime} {medicine.estimatedDeliveryTime} {t.minutes}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
