import { ChevronLeft, Camera, Upload, Check, Clock, FileText, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Language, Prescription } from '../types';
import { useState, useRef, useEffect } from 'react';

interface PrescriptionUploadProps {
  onBack: () => void;
  onUploadComplete: (prescriptionId: string) => void;
  savedPrescriptions: Prescription[];
  language: Language;
}

export function PrescriptionUpload({
  onBack,
  onUploadComplete,
  savedPrescriptions,
  language,
}: PrescriptionUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup camera stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setShowCamera(true);
      
      // Wait for video element to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions or use gallery upload.');
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
            handleFileSelected(file);
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

  const handleGalleryUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileSelected(file);
      }
    };
    input.click();
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setUploading(true);
    // Simulate upload
    setTimeout(() => {
      setUploading(false);
      setUploaded(true);
      setTimeout(() => {
        onUploadComplete('new-prescription-id');
      }, 1500);
    }, 2000);
  };

  const handleFileUpload = () => {
    setUploading(true);
    // Simulate upload
    setTimeout(() => {
      setUploading(false);
      setUploaded(true);
      setTimeout(() => {
        onUploadComplete('new-prescription-id');
      }, 1500);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-8 transition-colors duration-300">
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black dark:bg-black">
          <button
            onClick={closeCamera}
            className="absolute top-4 right-4 z-10 rounded-full bg-white dark:bg-slate-800 dark:border dark:border-slate-700 p-2 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700"
          >
            <X className="h-6 w-6" />
          </button>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <button
              onClick={capturePhoto}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-lg hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <div className="h-14 w-14 rounded-full border-4 border-black dark:border-white"></div>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-16 z-40 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="hover:bg-gray-100"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-semibold">
              {language === 'en' ? 'Upload Prescription' : 'प्रिस्क्रिप्शन अपलोड करें'}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {!uploaded ? (
          <>
            {/* Upload Options */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  {language === 'en' ? 'Upload New Prescription' : 'नया प्रिस्क्रिप्शन अपलोड करें'}
                </h2>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="h-16 w-full justify-start gap-4 border-2 border-dashed"
                    onClick={handleCameraCapture}
                    disabled={uploading}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-blue-light)]">
                      <Camera className="h-6 w-6 text-[var(--health-blue)]" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">
                        {language === 'en' ? 'Take Photo' : 'फोटो लें'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Click from camera' : 'कैमरे से क्लिक करें'}
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-16 w-full justify-start gap-4 border-2 border-dashed"
                    onClick={handleGalleryUpload}
                    disabled={uploading}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-green-light)]">
                      <Upload className="h-6 w-6 text-[var(--health-green)]" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">
                        {language === 'en' ? 'Upload from Gallery' : 'गैलरी से अपलोड करें'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Choose from photos' : 'फोटो से चुनें'}
                      </div>
                    </div>
                  </Button>
                </div>

                {uploading && (
                  <div className="mt-6 text-center">
                    <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-[var(--health-blue)] border-t-transparent"></div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Uploading prescription...' : 'प्रिस्क्रिप्शन अपलोड हो रहा है...'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mb-6 border-[var(--health-blue)]">
              <CardContent className="p-6">
                <h3 className="mb-3 font-semibold text-[var(--health-blue)]">
                  {language === 'en' ? 'How it works?' : 'यह कैसे काम करता है?'}
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--health-blue-light)] text-xs font-semibold text-[var(--health-blue)]">
                      1
                    </div>
                    <p className="text-muted-foreground">
                      {language === 'en'
                        ? 'Upload clear photo of your prescription'
                        : 'अपने प्रिस्क्रिप्शन की स्पष्ट फोटो अपलोड करें'}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--health-blue-light)] text-xs font-semibold text-[var(--health-blue)]">
                      2
                    </div>
                    <p className="text-muted-foreground">
                      {language === 'en'
                        ? 'Our pharmacist will verify it (takes 2-5 mins)'
                        : 'हमारा फार्मासिस्ट इसे सत्यापित करेगा (2-5 मिनट)'}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--health-blue-light)] text-xs font-semibold text-[var(--health-blue)]">
                      3
                    </div>
                    <p className="text-muted-foreground">
                      {language === 'en'
                        ? 'Medicines will be added to cart automatically'
                        : 'दवाएं स्वचालित रूप से कार्ट में जोड़ दी जाएंगी'}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--health-blue-light)] text-xs font-semibold text-[var(--health-blue)]">
                      4
                    </div>
                    <p className="text-muted-foreground">
                      {language === 'en'
                        ? 'Complete order and get delivery in 60 mins'
                        : 'ऑर्डर पूरा करें और 60 मिनट में डिलीवरी पाएं'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Saved Prescriptions */}
            {savedPrescriptions.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-semibold">
                  {language === 'en' ? 'Saved Prescriptions' : 'सेव किए गए प्रिस्क्रिप्शन'}
                </h2>
                <div className="space-y-3">
                  {savedPrescriptions.map((prescription) => (
                    <Card
                      key={prescription.id}
                      className="cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => onUploadComplete(prescription.id)}
                    >
                      <CardContent className="flex gap-4 p-4">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <img
                            src={prescription.imageUrl}
                            alt="Prescription"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(prescription.uploadDate).toLocaleDateString()}
                            </span>
                            {prescription.verified && (
                              <Badge className="bg-[var(--health-green)]">
                                <Check className="mr-1 h-3 w-3" />
                                {language === 'en' ? 'Verified' : 'सत्यापित'}
                              </Badge>
                            )}
                          </div>
                          {prescription.doctorName && (
                            <p className="mb-1 text-sm font-medium">
                              {language === 'en' ? 'By' : 'द्वारा'} {prescription.doctorName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {prescription.medicines.length}{' '}
                            {language === 'en' ? 'medicines' : 'दवाएं'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Upload Success */
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--health-green-light)]">
              <Check className="h-10 w-10 text-[var(--health-green)]" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-[var(--health-green)]">
              {language === 'en' ? 'Upload Successful!' : 'अपलोड सफल!'}
            </h2>
            <p className="mb-6 text-muted-foreground">
              {language === 'en'
                ? 'Our pharmacist will verify your prescription shortly'
                : 'हमारा फार्मासिस्ट शीघ्र ही आपके प्रिस्क्रिप्शन को सत्यापित करेगा'}
            </p>
            <div className="mx-auto flex max-w-sm items-center gap-2 rounded-lg bg-[var(--health-blue-light)] p-4">
              <Clock className="h-5 w-5 text-[var(--health-blue)]" />
              <p className="text-sm text-[var(--health-blue)]">
                {language === 'en'
                  ? 'Verification usually takes 2-5 minutes'
                  : 'सत्यापन में आमतौर पर 2-5 मिनट लगते हैं'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
