import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Camera, Upload, Loader2, Check, X, AlertCircle, ShoppingCart, Sparkles, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Medicine, Language, ScannedMedicine } from '../types';
import { toast } from 'sonner';

interface PrescriptionScannerProps {
  onBack: () => void;
  medicines: Medicine[];
  onAddToCart: (medicine: Medicine, quantity: number) => void;
  language: Language;
}

export function PrescriptionScanner({
  onBack,
  medicines,
  onAddToCart,
  language,
}: PrescriptionScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scannedResults, setScannedResults] = useState<ScannedMedicine[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [ocrRawText, setOcrRawText] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const uploadPrescriptionToBackend = async (file: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('prescription', file);

      const response = await fetch('http://localhost:5000/api/prescription/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Backend OCR error:', error);
      throw new Error(`Failed to process prescription: ${error.message}`);
    }
  };

  const handleImageSelected = async (file: File) => {
    setIsScanning(true);
    setScanProgress(0);
    setScannedResults([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const result = await uploadPrescriptionToBackend(file);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process prescription');
      }

      const data = result.data;
      setOcrRawText(data.rawText);

      const scannedMeds: ScannedMedicine[] = data.detectedMedicines.map((dm: any) => ({
        detectedName: dm.detectedName,
        matchedMedicine: dm.matchedMedicine ? medicines.find(m => m.id === dm.matchedMedicine.id) || dm.matchedMedicine : null,
        confidence: dm.confidence,
        alternatives: dm.alternatives.map((alt: any) => 
          medicines.find(m => m.id === alt.id) || alt
        ),
      }));

      setScannedResults(scannedMeds);
      setScanProgress(100);
      
      toast.success(
        language === 'en'
          ? `Found ${scannedMeds.length} medicines in prescription`
          : `प्रिस्क्रिप्शन में ${scannedMeds.length} दवाएं मिलीं`
      );
    } catch (error) {
      console.error('OCR processing error:', error);
      toast.error(
        language === 'en'
          ? 'Failed to scan prescription. Please try again.'
          : 'प्रिस्क्रिप्शन स्कैन विफल। कृपया पुनः प्रयास करें।'
      );
    } finally {
      setIsScanning(false);
      clearInterval(progressInterval);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      setShowCamera(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      toast.error(
        language === 'en'
          ? 'Unable to access camera. Please check permissions.'
          : 'कैमरा एक्सेस करने में असमर्थ। कृपया अनुमतियां जांचें।'
      );
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'prescription.jpg', { type: 'image/jpeg' });
            handleImageSelected(file);
            closeCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleAddMedicineToCart = (medicine: Medicine) => {
    onAddToCart(medicine, 1);
    toast.success(
      language === 'en'
        ? `${medicine.brand} added to cart`
        : `${medicine.brand} कार्ट में जोड़ा गया`
    );
  };

  const handleAddAllToCart = () => {
    let addedCount = 0;
    scannedResults.forEach(result => {
      if (result.matchedMedicine && result.matchedMedicine.inStock) {
        onAddToCart(result.matchedMedicine, 1);
        addedCount++;
      }
    });
    
    toast.success(
      language === 'en'
        ? `${addedCount} medicines added to cart`
        : `${addedCount} दवाएं कार्ट में जोड़ी गईं`
    );
  };

  if (showCamera) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <div className="relative h-full w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={closeCamera}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                onClick={capturePhoto}
                className="h-16 w-16 rounded-full bg-white hover:bg-gray-100"
              >
                <Camera className="h-6 w-6 text-black" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {language === 'en' ? 'Prescription Scanner' : 'प्रिस्क्रिप्शन स्कैनर'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {language === 'en' ? 'AI-powered medicine detection' : 'AI-संचालित दवा पहचान'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>
              {language === 'en'
                ? 'Important:'
                : 'महत्वपूर्ण:'}
            </strong>{' '}
            {language === 'en'
              ? 'Prescription medicines will be dispensed only after pharmacist verification.'
              : 'प्रिस्क्रिप्शन दवाएं केवल फार्मासिस्ट सत्यापन के बाद दी जाएंगी।'}
          </AlertDescription>
        </Alert>

        <Card className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">
                  {language === 'en' ? 'How it works' : 'यह कैसे काम करता है'}
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">1.</span>
                    <span>{language === 'en' ? 'Upload or capture prescription photo' : 'प्रिस्क्रिप्शन फोटो अपलोड या कैप्चर करें'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">2.</span>
                    <span>{language === 'en' ? 'AI reads handwriting & extracts medicine names' : 'AI हस्तलेखन पढ़ता है और दवा के नाम निकालता है'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">3.</span>
                    <span>{language === 'en' ? 'Matches with inventory & suggests alternatives' : 'इन्वेंटरी से मेल खाता है और विकल्प सुझाता है'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">4.</span>
                    <span>{language === 'en' ? 'Pharmacist verifies before dispatch' : 'फार्मासिस्ट भेजने से पहले सत्यापन करता है'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isScanning && scannedResults.length === 0 && (
          <div className="space-y-3">
            <Button
              className="w-full h-auto py-6 bg-gradient-to-r from-[var(--health-blue)] to-[var(--trust-blue)]"
              onClick={handleCameraCapture}
            >
              <div className="flex items-center gap-3">
                <Camera className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">
                    {language === 'en' ? 'Take Photo' : 'फोटो लें'}
                  </div>
                  <div className="text-xs opacity-90">
                    {language === 'en' ? 'Capture prescription with camera' : 'कैमरे से प्रिस्क्रिप्शन कैप्चर करें'}
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto py-6 border-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex items-center gap-3">
                <Upload className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">
                    {language === 'en' ? 'Upload from Gallery' : 'गैलरी से अपलोड करें'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'en' ? 'Choose existing photo' : 'मौजूदा फोटो चुनें'}
                  </div>
                </div>
              </div>
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelected(file);
              }}
            />
          </div>
        )}

        {isScanning && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {selectedImage && (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                    <img
                      src={selectedImage}
                      alt="Prescription"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-blue-500/20 animate-pulse" />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {language === 'en' ? 'Scanning prescription with AI...' : 'AI से प्रिस्क्रिप्शन स्कैन कर रहे हैं...'}
                    </span>
                    <span className="text-muted-foreground">{scanProgress}%</span>
                  </div>
                  <Progress value={scanProgress} className="h-2" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>
                      {language === 'en'
                        ? 'Reading handwriting & detecting medicines...'
                        : 'हस्तलेखन पढ़ रहे हैं और दवाएं पहचान रहे हैं...'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isScanning && scannedResults.length > 0 && (
          <div className="space-y-4">
            {selectedImage && (
              <Card>
                <CardContent className="p-4">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                    <img
                      src={selectedImage}
                      alt="Prescription"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {ocrRawText && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm">
                    {language === 'en' ? 'Extracted Text' : 'निकाला गया पाठ'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {ocrRawText}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {language === 'en' ? 'Detected Medicines' : 'पहचानी गई दवाएं'}
              </h2>
              <Button
                onClick={handleAddAllToCart}
                className="gap-2"
                disabled={!scannedResults.some(r => r.matchedMedicine?.inStock)}
              >
                <ShoppingCart className="h-4 w-4" />
                {language === 'en' ? 'Add All' : 'सभी जोड़ें'}
              </Button>
            </div>

            <div className="space-y-3">
              {scannedResults.map((result, index) => (
                <Card key={index} className={
                  result.matchedMedicine ? 'border-green-200 bg-green-50/50' : 'border-orange-200 bg-orange-50/50'
                }>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{result.detectedName}</h3>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(result.confidence * 100)}% match
                            </Badge>
                          </div>
                          {result.matchedMedicine && (
                            <p className="text-sm text-muted-foreground">
                              {language === 'en' ? 'Found in inventory' : 'इन्वेंटरी में मिला'}
                            </p>
                          )}
                        </div>
                        {result.matchedMedicine ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        )}
                      </div>

                      {result.matchedMedicine ? (
                        <div className="rounded-lg border bg-white p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{result.matchedMedicine.brand}</h4>
                              <p className="text-sm text-muted-foreground">
                                {result.matchedMedicine.genericName}
                              </p>
                              <div className="mt-2 flex items-center gap-3">
                                <span className="text-lg font-bold text-[var(--health-blue)]">
                                  ₹{result.matchedMedicine.price}
                                </span>
                                {result.matchedMedicine.discount > 0 && (
                                  <Badge className="bg-green-100 text-green-700">
                                    {result.matchedMedicine.discount}% OFF
                                  </Badge>
                                )}
                                {!result.matchedMedicine.inStock && (
                                  <Badge variant="destructive">Out of Stock</Badge>
                                )}
                              </div>
                            </div>
                            {result.matchedMedicine.inStock && (
                              <Button
                                size="sm"
                                onClick={() => handleAddMedicineToCart(result.matchedMedicine!)}
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                          <p className="text-sm text-orange-800">
                            {language === 'en'
                              ? 'Not found in inventory. Check alternatives below:'
                              : 'इन्वेंटरी में नहीं मिला। नीचे विकल्प देखें:'}
                          </p>
                        </div>
                      )}

                      {result.alternatives.length > 0 && (
                        <div>
                          <p className="mb-2 text-sm font-medium text-muted-foreground">
                            {language === 'en' ? 'Alternative Options:' : 'वैकल्पिक विकल्प:'}
                          </p>
                          <div className="space-y-2">
                            {result.alternatives.map((alt) => (
                              <div
                                key={alt.id}
                                className="flex items-center justify-between rounded-lg border bg-white p-2"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{alt.brand}</p>
                                  <p className="text-xs text-muted-foreground">{alt.genericName}</p>
                                  <span className="text-sm font-semibold text-[var(--health-blue)]">
                                    ₹{alt.price}
                                  </span>
                                </div>
                                {alt.inStock && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAddMedicineToCart(alt)}
                                  >
                                    Add
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setScannedResults([]);
                setSelectedImage(null);
              }}
            >
              {language === 'en' ? 'Scan Another Prescription' : 'दूसरा प्रिस्क्रिप्शन स्कैन करें'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
