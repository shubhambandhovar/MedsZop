import { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Language, User } from '../types';
import { subscriptionService, SubscriptionPlan, UserSubscription } from '../../services/subscriptionService';
import { toast } from 'sonner';

interface SubscriptionPlansProps {
  user: User;
  language: Language;
  onSubscriptionCreated: (subscription: UserSubscription) => void;
  onBack: () => void;
}

export function SubscriptionPlans({ user, language, onSubscriptionCreated, onBack }: SubscriptionPlansProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getUserSubscription(user.id),
      ]);

      if (plansRes.success) {
        setPlans(plansRes.plans);
      }
      if (subRes.success) {
        setCurrentSubscription(subRes.subscription);
      }
    } catch (error) {
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setLoading(true);
      const result = await subscriptionService.createSubscription(user.id, planId, [], undefined);

      if (result.success) {
        toast.success('Subscription created successfully!');
        setCurrentSubscription(result.subscription);
        onSubscriptionCreated(result.subscription);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">
            {language === 'en' ? 'Loading plans...' : 'योजनाएँ लोड हो रही हैं...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4"
          >
            ← {language === 'en' ? 'Back' : 'पीछे'}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'en' ? 'Subscription Plans' : 'सदस्यता योजनाएँ'}
          </h1>
          <p className="text-gray-600">
            {language === 'en'
              ? 'Choose a plan that works best for you'
              : 'आपके लिए सर्वोत्तम योजना चुनें'}
          </p>
        </div>

        {/* Current Subscription Alert */}
        {currentSubscription && currentSubscription.status === 'active' && (
          <Alert className="mb-8 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {language === 'en'
                ? `You have an active ${currentSubscription.planType} subscription. Next billing: ${new Date(currentSubscription.nextBillingDate).toLocaleDateString()}`
                : `आपके पास सक्रिय ${currentSubscription.planType} सदस्यता है। अगला बिलिंग: ${new Date(currentSubscription.nextBillingDate).toLocaleDateString('hi-IN')}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan._id}
              className={`relative overflow-hidden border-2 transition-all ${
                plan.type === 'premium'
                  ? 'border-purple-500 shadow-lg'
                  : 'border-blue-200 hover:border-blue-400'
              }`}
            >
              {plan.type === 'premium' && (
                <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 rounded-bl-lg">
                  <span className="font-semibold text-sm">
                    {language === 'en' ? 'Premium' : 'प्रीमियम'}
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div className="border-b pb-4">
                  <div className="text-4xl font-bold text-gray-900">
                    ₹{plan.price}
                    <span className="text-lg text-gray-600 font-normal">/month</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}

                  {/* Doctor Consultations for Premium */}
                  {plan.doctorConsultsPerMonth && plan.doctorConsultsPerMonth > 0 && (
                    <div className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg">
                      <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span className="text-purple-900 font-semibold">
                        {language === 'en'
                          ? `${plan.doctorConsultsPerMonth} Free Doctor Consultation${plan.doctorConsultsPerMonth > 1 ? 's' : ''} / Month`
                          : `${plan.doctorConsultsPerMonth} मुफ़्त डॉक्टर परामर्श / महीना`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Medicines List */}
                {plan.medicines.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {language === 'en' ? 'Included Medicines' : 'शामिल दवाएं'}
                    </h4>
                    <div className="space-y-1">
                      {plan.medicines.map((med, idx) => (
                        <div key={idx} className="text-sm text-gray-600">
                          • {med}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subscribe Button */}
                <Button
                  onClick={() => handleSubscribe(plan._id)}
                  disabled={loading || (currentSubscription?.status === 'active')}
                  className={`w-full py-3 font-semibold ${
                    plan.type === 'premium'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {currentSubscription?.planType === plan.type && currentSubscription?.status === 'active'
                    ? language === 'en'
                      ? '✓ Current Plan'
                      : '✓ वर्तमान योजना'
                    : language === 'en'
                      ? 'Subscribe Now'
                      : 'अभी सदस्य बनें'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-12 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-6">
            {language === 'en' ? 'Plan Comparison' : 'योजना तुलना'}
          </h2>
          <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-4 text-left font-semibold">{language === 'en' ? 'Feature' : 'विशेषता'}</th>
                <th className="p-4 text-center font-semibold">{language === 'en' ? 'Regular' : 'नियमित'}</th>
                <th className="p-4 text-center font-semibold">{language === 'en' ? 'Premium' : 'प्रीमियम'}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4">{language === 'en' ? 'Monthly Medicines' : 'मासिक दवाएं'}</td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">{language === 'en' ? 'Auto Delivery' : 'स्वचालित डिलीवरी'}</td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                </td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">{language === 'en' ? 'Doctor Consultations' : 'डॉक्टर परामर्श'}</td>
                <td className="p-4 text-center text-gray-400">✕</td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-500 mx-auto" /> 1/month
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">{language === 'en' ? 'Priority Support' : 'प्राथमिकता समर्थन'}</td>
                <td className="p-4 text-center text-gray-400">✕</td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="p-4">{language === 'en' ? 'Prescription Review' : 'प्रिस्क्रिप्शन समीक्षा'}</td>
                <td className="p-4 text-center text-gray-400">✕</td>
                <td className="p-4 text-center">
                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
