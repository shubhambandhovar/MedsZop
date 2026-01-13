import { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, Pause, Play, Trash2, AlertCircle, Clock } from 'lucide-react';
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
import { subscriptionService, UserSubscription } from '../../services/subscriptionService';
import { toast } from 'sonner';

interface SubscriptionManagerProps {
  user: User;
  language: Language;
  onBack: () => void;
}

export function SubscriptionManager({ user, language, onBack }: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadSubscription();
  }, [user.id]);

  const loadSubscription = async () => {
    try {
      const result = await subscriptionService.getUserSubscription(user.id);
      if (result.success) {
        setSubscription(result.subscription);
      }
    } catch (error) {
      toast.error('Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!subscription) return;
    try {
      setActionLoading(true);
      const pauseUntil = new Date();
      pauseUntil.setMonth(pauseUntil.getMonth() + 1);

      const result = await subscriptionService.pauseSubscription(subscription._id, pauseUntil);
      if (result.success) {
        setSubscription(result.subscription);
        toast.success(
          language === 'en'
            ? 'Subscription paused'
            : 'सदस्यता रोक दी गई है'
        );
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!subscription) return;
    try {
      setActionLoading(true);
      const result = await subscriptionService.resumeSubscription(subscription._id);
      if (result.success) {
        setSubscription(result.subscription);
        toast.success(
          language === 'en'
            ? 'Subscription resumed'
            : 'सदस्यता फिर से शुरू की गई है'
        );
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipMonth = async () => {
    if (!subscription) return;
    try {
      setActionLoading(true);
      const result = await subscriptionService.skipMonth(subscription._id);
      if (result.success) {
        setSubscription(result.subscription);
        toast.success(
          language === 'en'
            ? 'Month skipped successfully'
            : 'महीना सफलतापूर्वक छोड़ दिया गया है'
        );
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;
    try {
      setActionLoading(true);
      const result = await subscriptionService.cancelSubscription(
        subscription._id,
        cancelReason
      );
      if (result.success) {
        setSubscription(result.subscription);
        setShowCancelDialog(false);
        setCancelReason('');
        toast.success(
          language === 'en'
            ? 'Subscription cancelled'
            : 'सदस्यता रद्द कर दी गई है'
        );
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
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

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            ← {language === 'en' ? 'Back' : 'पीछे'}
          </Button>
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {language === 'en'
                ? 'No active subscription found'
                : 'कोई सक्रिय सदस्यता नहीं मिली'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const billingDate = new Date(subscription.nextBillingDate);
  const daysUntilBilling = Math.ceil(
    (billingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← {language === 'en' ? 'Back' : 'पीछे'}
        </Button>

        {/* Status Alert */}
        <Alert className={`mb-8 ${
          subscription.status === 'active'
            ? 'border-green-200 bg-green-50'
            : subscription.status === 'paused'
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-red-200 bg-red-50'
        }`}>
          <AlertCircle className={`h-4 w-4 ${
            subscription.status === 'active'
              ? 'text-green-600'
              : subscription.status === 'paused'
                ? 'text-yellow-600'
                : 'text-red-600'
          }`} />
          <AlertDescription className={
            subscription.status === 'active'
              ? 'text-green-800'
              : subscription.status === 'paused'
                ? 'text-yellow-800'
                : 'text-red-800'
          }>
            {subscription.status === 'active' && (
              language === 'en'
                ? `Your subscription is active. Next billing in ${daysUntilBilling} days`
                : `आपकी सदस्यता सक्रिय है। अगला बिलिंग ${daysUntilBilling} दिनों में है`
            )}
            {subscription.status === 'paused' && (
              language === 'en'
                ? 'Your subscription is paused'
                : 'आपकी सदस्यता रोकी गई है'
            )}
            {subscription.status === 'cancelled' && (
              language === 'en'
                ? 'Your subscription is cancelled'
                : 'आपकी सदस्यता रद्द कर दी गई है'
            )}
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Subscription Card */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {language === 'en' ? 'Subscription Details' : 'सदस्यता विवरण'}
                  </span>
                  <Badge className={
                    subscription.planType === 'premium'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }>
                    {subscription.planType.charAt(0).toUpperCase() + subscription.planType.slice(1)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Billing Information */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                  <div>
                    <p className="text-sm text-gray-600">
                      {language === 'en' ? 'Monthly Amount' : 'मासिक राशि'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">₹{subscription.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {language === 'en' ? 'Next Billing' : 'अगला बिलिंग'}
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {billingDate.toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN')}
                    </p>
                  </div>
                </div>

                {/* Medicines */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {language === 'en' ? 'Your Medicines' : 'आपकी दवाएं'}
                  </h3>
                  {subscription.medicines.length > 0 ? (
                    <div className="space-y-2">
                      {subscription.medicines.map((med, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                          <span className="font-medium">{med.name}</span>
                          <span className="text-sm text-gray-600">Qty: {med.quantity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      {language === 'en' ? 'No medicines added' : 'कोई दवा नहीं जोड़ी गई'}
                    </p>
                  )}
                </div>

                {/* Premium Features */}
                {subscription.planType === 'premium' && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-2">
                      {language === 'en' ? 'Doctor Consultations' : 'डॉक्टर परामर्श'}
                    </h3>
                    <div className="flex items-center gap-2 text-purple-700">
                      <Clock className="w-4 h-4" />
                      <span>
                        {subscription.doctorConsultsLeft - subscription.doctorConsultsUsed} of{' '}
                        {subscription.doctorConsultsLeft}{' '}
                        {language === 'en' ? 'consultations left' : 'परामर्श बचे हैं'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Start Date */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {language === 'en' ? 'Started on' : 'शुरू हुआ'}:{' '}
                    {new Date(subscription.startDate).toLocaleDateString(
                      language === 'en' ? 'en-US' : 'hi-IN'
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'en' ? 'Actions' : 'कार्रवाई'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subscription.status === 'active' ? (
                  <>
                    <Button
                      onClick={handleSkipMonth}
                      disabled={actionLoading}
                      variant="outline"
                      className="w-full"
                    >
                      {language === 'en' ? 'Skip This Month' : 'इस महीने को छोड़ें'}
                    </Button>
                    <Button
                      onClick={handlePause}
                      disabled={actionLoading}
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      {language === 'en' ? 'Pause' : 'रोकें'}
                    </Button>
                  </>
                ) : subscription.status === 'paused' ? (
                  <Button
                    onClick={handleResume}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {language === 'en' ? 'Resume' : 'फिर से शुरू करें'}
                  </Button>
                ) : null}

                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {language === 'en' ? 'Cancel' : 'रद्द करें'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {language === 'en'
                          ? 'Cancel Subscription'
                          : 'सदस्यता रद्द करें'}
                      </DialogTitle>
                      <DialogDescription>
                        {language === 'en'
                          ? 'Are you sure? You can resubscribe anytime.'
                          : 'क्या आप सुनिश्चित हैं? आप कभी भी फिर से सदस्य बन सकते हैं।'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <textarea
                        placeholder={
                          language === 'en'
                            ? 'Tell us why you are cancelling (optional)'
                            : 'बताएं कि आप रद्द करने के लिए क्यों हैं (वैकल्पिक)'
                        }
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={3}
                      />
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowCancelDialog(false)}
                        >
                          {language === 'en' ? 'Keep Subscription' : 'सदस्यता रखें'}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleCancel}
                          disabled={actionLoading}
                        >
                          {language === 'en' ? 'Cancel Subscription' : 'सदस्यता रद्द करें'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
