import { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, Clock, MessageCircle, Video, FileText, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Language, User } from '../types';
import { subscriptionService, DoctorConsultation, UserSubscription } from '../../services/subscriptionService';
import { toast } from 'sonner';

interface DoctorConsultationProps {
  user: User;
  subscription: UserSubscription;
  language: Language;
  onBack: () => void;
}

export function DoctorConsultationUI({
  user,
  subscription,
  language,
  onBack,
}: DoctorConsultationProps) {
  const [consultations, setConsultations] = useState<DoctorConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [formData, setFormData] = useState({
    consultationType: 'chat' as 'chat' | 'video' | 'text',
    reason: '',
    scheduledDate: '',
  });

  useEffect(() => {
    loadConsultations();
  }, [user.id]);

  const loadConsultations = async () => {
    try {
      const result = await subscriptionService.getUserConsultations(user.id);
      if (result.success) {
        setConsultations(result.consultations);
      }
    } catch (error) {
      toast.error('Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const handleBookConsultation = async () => {
    if (!formData.reason || !formData.scheduledDate) {
      toast.error(language === 'en' ? 'Please fill all fields' : 'कृपया सभी फील्ड भरें');
      return;
    }

    try {
      setBookingLoading(true);
      const result = await subscriptionService.createConsultation(
        subscription._id,
        user.id,
        formData.consultationType,
        formData.reason,
        new Date(formData.scheduledDate)
      );

      if (result.success) {
        setConsultations([...consultations, result.consultation]);
        setShowBookDialog(false);
        setFormData({
          consultationType: 'chat',
          reason: '',
          scheduledDate: '',
        });
        toast.success(
          language === 'en'
            ? 'Consultation booked successfully'
            : 'परामर्श सफलतापूर्वक बुक किया गया'
        );
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelConsultation = async (consultationId: string) => {
    try {
      const result = await subscriptionService.cancelConsultation(consultationId);
      if (result.success) {
        setConsultations(consultations.filter((c) => c._id !== consultationId));
        toast.success(
          language === 'en'
            ? 'Consultation cancelled'
            : 'परामर्श रद्द कर दिया गया'
        );
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">
            {language === 'en' ? 'Loading...' : 'लोड हो रहा है...'}
          </p>
        </div>
      </div>
    );
  }

  const upcomingConsultations = consultations.filter((c) => c.status === 'scheduled');
  const completedConsultations = consultations.filter((c) => c.status === 'completed');
  const remainingConsultations =
    subscription.doctorConsultsLeft - subscription.doctorConsultsUsed;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← {language === 'en' ? 'Back' : 'पीछे'}
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'en' ? 'Doctor Consultations' : 'डॉक्टर परामर्श'}
          </h1>
          <p className="text-gray-600">
            {language === 'en'
              ? 'Book and manage your free doctor consultations'
              : 'अपने मुफ़्त डॉक्टर परामर्श को बुक और प्रबंधित करें'}
          </p>
        </div>

        {/* Quota Card */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Total Consultations/Month' : 'कुल परामर्श/महीना'}
                </p>
                <p className="text-3xl font-bold text-purple-600">{subscription.doctorConsultsLeft}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Used' : 'उपयोग किया'}
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {subscription.doctorConsultsUsed}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Remaining' : 'शेष'}
                </p>
                <p
                  className={`text-3xl font-bold ${
                    remainingConsultations > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {remainingConsultations}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Book Consultation Button */}
        {remainingConsultations > 0 && (
          <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
            <DialogTrigger asChild>
              <Button className="mb-8 bg-purple-600 hover:bg-purple-700">
                {language === 'en' ? '+ Book Consultation' : '+ परामर्श बुक करें'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {language === 'en' ? 'Book Doctor Consultation' : 'डॉक्टर परामर्श बुक करें'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Consultation Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {language === 'en' ? 'Consultation Type' : 'परामर्श का प्रकार'}
                  </label>
                  <div className="space-y-2">
                    {(['chat', 'video', 'text'] as const).map((type) => (
                      <label key={type} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value={type}
                          checked={formData.consultationType === type}
                          onChange={(e) =>
                            setFormData({ ...formData, consultationType: e.target.value as any })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-gray-700">
                          {type === 'chat'
                            ? language === 'en'
                              ? '💬 Chat Consultation'
                              : '💬 चैट परामर्श'
                            : type === 'video'
                              ? language === 'en'
                                ? '📹 Video Call'
                                : '📹 वीडियो कॉल'
                              : language === 'en'
                                ? '📝 Text Consultation'
                                : '📝 पाठ परामर्श'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {language === 'en' ? 'Reason for Consultation' : 'परामर्श का कारण'}
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder={
                      language === 'en'
                        ? 'Describe your health concern...'
                        : 'अपनी स्वास्थ्य समस्या का वर्णन करें...'
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={4}
                  />
                </div>

                {/* Date & Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {language === 'en' ? 'Preferred Date & Time' : 'पसंदीदा तारीख और समय'}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowBookDialog(false)}
                  >
                    {language === 'en' ? 'Cancel' : 'रद्द करें'}
                  </Button>
                  <Button
                    onClick={handleBookConsultation}
                    disabled={bookingLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {bookingLoading
                      ? language === 'en'
                        ? 'Booking...'
                        : 'बुक हो रहा है...'
                      : language === 'en'
                        ? 'Book Consultation'
                        : 'परामर्श बुक करें'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Upcoming Consultations */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {language === 'en' ? 'Upcoming Consultations' : 'आने वाले परामर्श'}
          </h2>
          {upcomingConsultations.length > 0 ? (
            <div className="space-y-4">
              {upcomingConsultations.map((consultation) => (
                <Card key={consultation._id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {consultation.consultationType === 'chat' && (
                            <MessageCircle className="w-5 h-5 text-blue-500" />
                          )}
                          {consultation.consultationType === 'video' && (
                            <Video className="w-5 h-5 text-green-500" />
                          )}
                          {consultation.consultationType === 'text' && (
                            <FileText className="w-5 h-5 text-purple-500" />
                          )}
                          <Badge className="bg-blue-100 text-blue-800">
                            {consultation.consultationType.charAt(0).toUpperCase() +
                              consultation.consultationType.slice(1)}
                          </Badge>
                        </div>
                        <p className="font-semibold text-gray-900 mb-2">
                          {consultation.reason}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(consultation.scheduledDate!).toLocaleDateString(
                              language === 'en' ? 'en-US' : 'hi-IN'
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(consultation.scheduledDate!).toLocaleTimeString(
                              language === 'en' ? 'en-US' : 'hi-IN',
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelConsultation(consultation._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                {language === 'en'
                  ? 'No upcoming consultations'
                  : 'कोई आने वाले परामर्श नहीं'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Completed Consultations */}
        {completedConsultations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {language === 'en' ? 'Completed Consultations' : 'पूर्ण परामर्श'}
            </h2>
            <div className="space-y-4">
              {completedConsultations.map((consultation) => (
                <Card key={consultation._id} className="opacity-75">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {consultation.consultationType === 'chat' && (
                            <MessageCircle className="w-5 h-5 text-blue-500" />
                          )}
                          {consultation.consultationType === 'video' && (
                            <Video className="w-5 h-5 text-green-500" />
                          )}
                          {consultation.consultationType === 'text' && (
                            <FileText className="w-5 h-5 text-purple-500" />
                          )}
                          <Badge className="bg-green-100 text-green-800">
                            {language === 'en' ? 'Completed' : 'पूर्ण'}
                          </Badge>
                        </div>
                        <p className="font-semibold text-gray-900 mb-2">
                          {consultation.reason}
                        </p>
                        {consultation.notes && (
                          <p className="text-sm text-gray-600 mb-2">
                            {language === 'en' ? 'Doctor Notes:' : 'डॉक्टर की नोट्स:'}{' '}
                            {consultation.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(consultation.completedAt!).toLocaleDateString(
                            language === 'en' ? 'en-US' : 'hi-IN'
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
