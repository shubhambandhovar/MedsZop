import { ChevronLeft, User, MapPin, FileText, Package, Bell, LogOut, ChevronRight, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { User as UserType, Order, Language } from '../types';

interface UserProfileProps {
  user: UserType;
  orders: Order[];
  onBack: () => void;
  onLogout: () => void;
  onViewOrders: () => void;
  language: Language;
}

export function UserProfile({ user, orders, onBack, onLogout, onViewOrders, language }: UserProfileProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">
              {language === 'en' ? 'My Profile' : 'मेरा प्रोफ़ाइल'}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* User Info Card */}
        <Card className="mb-4 bg-gradient-to-r from-[var(--health-blue)] to-[var(--trust-blue)] text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <User className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="mb-1 text-xl font-bold">{user.name}</h2>
                <p className="text-sm opacity-90">{user.email}</p>
                <p className="text-sm opacity-90">{user.phone}</p>
              </div>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Edit className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="mb-1 text-2xl font-bold text-[var(--health-blue)]">
                {(orders?.length || 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'en' ? 'Orders' : 'ऑर्डर'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="mb-1 text-2xl font-bold text-[var(--health-green)]">
                {user.savedPrescriptions?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'en' ? 'Prescriptions' : 'प्रिस्क्रिप्शन'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="mb-1 text-2xl font-bold text-[var(--trust-blue)]">
                {user.addresses?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'en' ? 'Addresses' : 'पते'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Menu Options */}
        <div className="space-y-3">
          <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onViewOrders}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-blue-light)]">
                <Package className="h-6 w-6 text-[var(--health-blue)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {language === 'en' ? 'My Orders' : 'मेरे ऑर्डर'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'View all orders' : 'सभी ऑर्डर देखें'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-green-light)]">
                <FileText className="h-6 w-6 text-[var(--health-green)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {language === 'en' ? 'Saved Prescriptions' : 'सेव किए गए प्रिस्क्रिप्शन'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {(user.savedPrescriptions?.length || 0)}{' '}
                  {language === 'en' ? 'prescriptions saved' : 'प्रिस्क्रिप्शन सेव किए गए'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {language === 'en' ? 'Saved Addresses' : 'सेव किए गए पते'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {(user.addresses?.length || 0)}{' '}
                  {language === 'en' ? 'addresses saved' : 'पते सेव किए गए'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {language === 'en' ? 'Medicine Reminders' : 'दवा रिमाइंडर'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Set up reminders' : 'रिमाइंडर सेट करें'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="mt-6 w-full border-destructive text-destructive hover:bg-destructive hover:text-white"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          {language === 'en' ? 'Logout' : 'लॉगआउट'}
        </Button>

        {/* App Version */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          MedsZop v1.0.0
        </p>
      </div>
    </div>
  );
}
