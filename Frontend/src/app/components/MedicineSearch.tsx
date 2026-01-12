import { Search, Filter, MapPin, Clock, ChevronLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Medicine, Language } from '../types';
import { translations } from '../data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface MedicineSearchProps {
  medicines: Medicine[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMedicineClick: (medicine: Medicine) => void;
  onBack: () => void;
  language: Language;
}

export function MedicineSearch({
  medicines,
  searchQuery,
  onSearchChange,
  onMedicineClick,
  onBack,
  language,
}: MedicineSearchProps) {
  const t = translations[language];
  
  // Filter medicines based on search
  const filteredMedicines = medicines.filter(
    (med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Search Header */}
      <div className="sticky top-16 z-40 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-12 rounded-full pl-12 pr-4"
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-36">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'en' ? 'All' : 'सभी'}</SelectItem>
                <SelectItem value="pain">{language === 'en' ? 'Pain Relief' : 'दर्द निवारक'}</SelectItem>
                <SelectItem value="antibiotic">{language === 'en' ? 'Antibiotics' : 'एंटीबायोटिक्स'}</SelectItem>
                <SelectItem value="diabetes">{language === 'en' ? 'Diabetes' : 'मधुमेह'}</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="nearby">
              <SelectTrigger className="w-36">
                <MapPin className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nearby">{language === 'en' ? 'Nearby' : 'आसपास'}</SelectItem>
                <SelectItem value="all">{language === 'en' ? 'All Stores' : 'सभी स्टोर'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 pt-4">
        <p className="mb-4 text-sm text-muted-foreground">
          {filteredMedicines.length} {language === 'en' ? 'results found' : 'परिणाम मिले'}
        </p>

        <div className="space-y-3">
          {filteredMedicines.map((medicine) => (
            <Card
              key={medicine.id}
              className="cursor-pointer overflow-hidden shadow-sm transition-all hover:shadow-md"
              onClick={() => onMedicineClick(medicine)}
            >
              <CardContent className="flex gap-4 p-4">
                {/* Image */}
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={medicine.imageUrl}
                    alt={medicine.name}
                    className="h-full w-full object-cover"
                  />
                  {medicine.discount > 0 && (
                    <Badge className="absolute right-1 top-1 bg-[var(--health-green)] text-xs">
                      {medicine.discount}%
                    </Badge>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold">{medicine.brand}</h3>
                  <p className="mb-2 text-sm text-muted-foreground">{medicine.genericName}</p>
                  
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-[var(--health-blue)]">
                      ₹{medicine.price}
                    </span>
                    {medicine.discount > 0 && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{medicine.mrp}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">• {medicine.packSize}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {medicine.nearbyAvailability ? (
                      <Badge variant="outline" className="border-[var(--health-green)] text-[var(--health-green)]">
                        <Clock className="mr-1 h-3 w-3" />
                        {medicine.estimatedDeliveryTime} {t.minutes}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-orange-500 text-orange-500">
                        {language === 'en' ? '55+ mins' : '55+ मिनट'}
                      </Badge>
                    )}

                    {medicine.requiresPrescription && (
                      <Badge variant="outline" className="text-xs">
                        {language === 'en' ? 'Rx' : 'Rx'}
                      </Badge>
                    )}

                    {medicine.inStock ? (
                      <Badge variant="outline" className="border-[var(--health-green)] text-[var(--health-green)] text-xs">
                        {t.inStock}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500 text-red-500 text-xs">
                        {t.outOfStock}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Add Button */}
                <div className="flex items-center">
                  <Button
                    size="sm"
                    className="bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)]"
                  >
                    {language === 'en' ? 'Add' : 'जोड़ें'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMedicines.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">
              {language === 'en' ? 'No medicines found' : 'कोई दवा नहीं मिली'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {language === 'en' ? 'Try different keywords' : 'विभिन्न खोजशब्द आज़माएं'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
