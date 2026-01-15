import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, Eye, EyeOff, User as UserIcon, Store, Lock } from 'lucide-react';
import { Language, User } from '../types';
import { mockUser, mockPharmacyUser, mockAdminUser } from '../data/mockData';
import { authService } from '../../services/authService';
import { googleLogin, startPhoneLogin, confirmPhoneOtp } from '../../services/firebaseAuth';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (user: User) => void;
  onBack: () => void;
  onRegister?: () => void;
  language: Language;
}

export function Login({ onLogin, onRegister, language }: LoginProps) {
  const [activeRole, setActiveRole] = useState<'user' | 'pharmacy' | 'admin'>('user');
  const [activeTab, setActiveTab] = useState('login');
  
  // User credentials
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  
  // Pharmacy credentials
  const [pharmacyEmail, setPharmacyEmail] = useState('');
  const [pharmacyPassword, setPharmacyPassword] = useState('');
  
  // Admin credentials
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [phoneOtpStep, setPhoneOtpStep] = useState<'phone' | 'otp'>('phone');
const [otpPhone, setOtpPhone] = useState('');
const [otpCode, setOtpCode] = useState('');
const [confirmation, setConfirmation] = useState<any>(null);

const handleGoogleLogin = async () => {
  try {
    setIsLoading(true);
    const result = await googleLogin();
    if (result?.data?.success) {
      toast.success(language === 'en' ? 'Google login successful!' : 'गूगल लॉगिन सफल!');
      onLogin(result.data.data.user);
    }
  } catch (error: any) {
    const errorMsg = error?.message || (language === 'en' ? 'Google login failed' : 'गूगल लॉगिन विफल');
    toast.error(errorMsg);
  } finally {
    setIsLoading(false);
  }
};

const handleSendPhoneOtp = async () => {
  if (!otpPhone || otpPhone.length !== 10) {
    toast.error(language === 'en' ? 'Please enter a valid 10-digit phone number' : 'कृपया वैध फोन नंबर दर्ज करें');
    return;
  }
  try {
    setIsLoading(true);
    const confirmationResult = await startPhoneLogin('+91' + otpPhone);
    setConfirmation(confirmationResult);
    setPhoneOtpStep('otp');
    toast.success(language === 'en' ? 'OTP sent!' : 'OTP भेजा गया!');
  } catch (error: any) {
    toast.error(error?.message || 'Failed to send OTP');
  } finally {
    setIsLoading(false);
  }
};

const handleVerifyPhoneOtp = async () => {
  if (!otpCode || otpCode.length !== 6) {
    toast.error(language === 'en' ? 'Enter valid 6-digit OTP' : 'वैध OTP दर्ज करें');
    return;
  }
  try {
    setIsLoading(true);
    const result = await confirmPhoneOtp(confirmation, otpCode);
    if (result?.data?.success) {
      toast.success('Phone login successful!');
      onLogin(result.data.data.user);
    }
  } catch (error: any) {
    toast.error(error?.message || 'OTP verification failed');
  } finally {
    setIsLoading(false);
  }
};

  const handleUserLogin = async () => {
    if (!userEmail || !userPassword) {
      toast.error(language === 'en' ? 'Please enter email and password' : 'कृपया ईमेल और पासवर्ड दर्ज करें');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.login(userEmail, userPassword, 'user');
      if (result.success) {
        toast.success(language === 'en' ? 'Login successful!' : 'लॉगिन सफल!');
        onLogin(result.data.user);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || (language === 'en' ? 'Login failed' : 'लॉगिन विफल');
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePharmacyLogin = async () => {
    if (!pharmacyEmail || !pharmacyPassword) {
      toast.error(language === 'en' ? 'Please enter email and password' : 'कृपया ईमेल और पासवर्ड दर्ज करें');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.login(pharmacyEmail, pharmacyPassword, 'pharmacy');
      if (result.success) {
        toast.success(language === 'en' ? 'Pharmacy login successful!' : 'फार्मेसी लॉगिन सफल!');
        onLogin(result.data.user);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || (language === 'en' ? 'Login failed' : 'लॉगिन विफल');
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminEmail || !adminPassword) {
      toast.error(language === 'en' ? 'Please enter email and password' : 'कृपया ईमेल और पासवर्ड दर्ज करें');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.login(adminEmail, adminPassword, 'admin');
      if (result.success) {
        toast.success(language === 'en' ? 'Admin login successful!' : 'व्यवस्थापक लॉगिन सफल!');
        onLogin(result.data.user);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || (language === 'en' ? 'Login failed' : 'लॉगिन विफल');
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserRegister = async () => {
    if (!userName || !userEmail || !userPassword || !userPhone) {
      toast.error(language === 'en' ? 'Please fill in all fields' : 'कृपया सभी फ़ील्ड भरें');
      return;
    }

    if (userPhone.length !== 10) {
      toast.error(language === 'en' ? 'Phone number must be 10 digits' : 'फोन नंबर 10 अंकों का होना चाहिए');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.register({
        name: userName,
        email: userEmail,
        password: userPassword,
        phone: userPhone,
        role: 'user'
      });
      if (result.success) {
        toast.success(language === 'en' ? 'Registration successful!' : 'पंजीकरण सफल!');
        setUserEmail('');
        setUserPassword('');
        setUserName('');
        setUserPhone('');
        onLogin(result.data.user);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || (language === 'en' ? 'Registration failed' : 'पंजीकरण विफल');
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--health-blue-light)] to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Logo and Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <img
              src="/assets/M logo1.png"
              alt="MedsZop logo"
              className="h-20 w-20 rounded-2xl object-contain shadow-lg"
              loading="lazy"
            />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">
            {language === 'en' ? 'Welcome to MedsZop' : 'मेड्सज़ॉप में आपका स्वागत है'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en'
              ? 'Medicine at your doorstep in 60 minutes'
              : 'समान घंटे में डिलीवरी'}
          </p>
        </div>

        {/* Role Selection */}
        <div className="mx-auto mb-6 max-w-2xl">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => {
                setActiveRole('user');
                setActiveTab('login');
              }}
              className={`rounded-lg p-4 transition-all ${
                activeRole === 'user'
                  ? 'border-2 border-[var(--health-blue)] bg-[var(--health-blue-light)]'
                  : 'border-2 border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <UserIcon className="mx-auto mb-2 h-6 w-6" />
              <div className="text-sm font-semibold">{language === 'en' ? 'Customer' : 'ग्राहक'}</div>
              <div className="text-xs text-muted-foreground">{language === 'en' ? 'Buy medicines' : 'दवा खरीदें'}</div>
            </button>

            <button
              onClick={() => {
                setActiveRole('pharmacy');
                setActiveTab('login');
              }}
              className={`rounded-lg p-4 transition-all ${
                activeRole === 'pharmacy'
                  ? 'border-2 border-[var(--health-green)] bg-[var(--health-green-light)]'
                  : 'border-2 border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Store className="mx-auto mb-2 h-6 w-6" />
              <div className="text-sm font-semibold">{language === 'en' ? 'Pharmacy' : 'फार्मेसी'}</div>
              <div className="text-xs text-muted-foreground">{language === 'en' ? 'Partner with us' : 'हमारे साथ जुड़ें'}</div>
            </button>

            <button
              onClick={() => {
                setActiveRole('admin');
                setActiveTab('login');
              }}
              className={`rounded-lg p-4 transition-all ${
                activeRole === 'admin'
                  ? 'border-2 border-[var(--health-purple)] bg-[var(--health-purple-light)]'
                  : 'border-2 border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Lock className="mx-auto mb-2 h-6 w-6" />
              <div className="text-sm font-semibold">{language === 'en' ? 'Admin' : 'व्यवस्थापक'}</div>
              <div className="text-xs text-muted-foreground">{language === 'en' ? 'Manage platform' : 'प्लेटफॉर्म प्रबंधन'}</div>
            </button>
          </div>

      {/* OR Divider */}
<div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-white px-2 text-muted-foreground">
      {language === 'en' ? 'Or continue with' : 'या इनसे लॉगिन करें'}
    </span>
  </div>
</div>

{/* Google Login Button */}
<Button
  variant="outline"
  className="h-12 w-full"
  onClick={handleGoogleLogin}
  disabled={isLoading}
>
  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  {language === 'en' ? 'Continue with Google' : 'Google से जारी रखें'}
</Button>

{/* Phone OTP Section */}
<div className="mt-4 rounded-lg border-2 border-dashed border-gray-300 p-4">
  <p className="mb-3 text-sm font-semibold text-center">
    {language === 'en' ? 'Or login with Phone OTP' : 'या फोन OTP से लॉगिन करें'}
  </p>
  
  {phoneOtpStep === 'phone' ? (
    <>
      <Input
        type="tel"
        placeholder="9876543210"
        value={otpPhone}
        onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
        disabled={isLoading}
        className="h-11 mb-2"
      />
      <Button
        className="h-11 w-full bg-green-600 hover:bg-green-700"
        onClick={handleSendPhoneOtp}
        disabled={isLoading || otpPhone.length !== 10}
      >
        {language === 'en' ? 'Send OTP' : 'OTP भेजें'}
      </Button>
    </>
  ) : (
    <>
      <Input
        type="text"
        placeholder="Enter 6-digit OTP"
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        disabled={isLoading}
        className="h-11 mb-2"
      />
      <div className="flex gap-2">
        <Button
          className="h-11 flex-1 bg-green-600 hover:bg-green-700"
          onClick={handleVerifyPhoneOtp}
          disabled={isLoading || otpCode.length !== 6}
        >
          {language === 'en' ? 'Verify OTP' : 'OTP सत्यापित करें'}
        </Button>
        <Button
          variant="outline"
          className="h-11"
          onClick={() => {
            setPhoneOtpStep('phone');
            setOtpPhone('');
            setOtpCode('');
          }}
          disabled={isLoading}
        >
          {language === 'en' ? 'Back' : 'वापस'}
        </Button>
      </div>
    </>
  )}
</div>

        </div>

        {/* Login Card */}
        <Card className="mx-auto max-w-md shadow-lg">
          <CardContent className="p-6">
            {/* CUSTOMER LOGIN/REGISTER */}
            {activeRole === 'user' && (
              <div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">{language === 'en' ? 'Login' : 'लॉगिन'}</TabsTrigger>
                    <TabsTrigger value="register">{language === 'en' ? 'Register' : 'पंजीकरण'}</TabsTrigger>
                  </TabsList>

                  {/* Customer Login */}
                  <TabsContent value="login" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-email">{language === 'en' ? 'Email Address' : 'ईमेल पता'}</Label>
                      <Input
                        id="user-email"
                        type="email"
                        placeholder="user@email.com"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        disabled={isLoading}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-password">{language === 'en' ? 'Password' : 'पासवर्ड'}</Label>
                      <div className="relative">
                        <Input
                          id="user-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          disabled={isLoading}
                          className="h-12 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      className="h-12 w-full bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)] text-lg"
                      onClick={handleUserLogin}
                      disabled={isLoading || !userEmail || !userPassword}
                    >
                      {isLoading ? (language === 'en' ? 'Logging in...' : 'लॉगिन जारी है...') : (language === 'en' ? 'Login' : 'लॉगिन')}
                    </Button>

                    <div className="space-y-2 rounded-lg bg-blue-50 p-3">
                      <p className="text-center text-xs font-semibold text-blue-900">{language === 'en' ? 'Demo Account:' : 'डेमो खाता:'}</p>
                      <p className="text-center text-xs text-blue-800">user@test.com</p>
                      <p className="text-center text-xs text-blue-800">password123</p>
                    </div>
                  </TabsContent>

                  {/* Customer Register */}
                  <TabsContent value="register" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-name">{language === 'en' ? 'Full Name' : 'पूरा नाम'}</Label>
                      <Input
                        id="user-name"
                        type="text"
                        placeholder="John Doe"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        disabled={isLoading}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-reg-email">{language === 'en' ? 'Email Address' : 'ईमेल पता'}</Label>
                      <Input
                        id="user-reg-email"
                        type="email"
                        placeholder="user@email.com"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        disabled={isLoading}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-phone">{language === 'en' ? 'Phone Number' : 'फ़ोन नंबर'}</Label>
                      <Input
                        id="user-phone"
                        type="tel"
                        placeholder="9876543210"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        disabled={isLoading}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-reg-password">{language === 'en' ? 'Password' : 'पासवर्ड'}</Label>
                      <div className="relative">
                        <Input
                          id="user-reg-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          disabled={isLoading}
                          className="h-12 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      className="h-12 w-full bg-[var(--health-green)] hover:bg-[var(--health-green-dark)] text-lg"
                      onClick={handleUserRegister}
                      disabled={isLoading || !userName || !userEmail || !userPassword || !userPhone}
                    >
                      {isLoading ? (language === 'en' ? 'Registering...' : 'पंजीकरण जारी है...') : (language === 'en' ? 'Register' : 'पंजीकरण')}
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* PHARMACY LOGIN */}
            {activeRole === 'pharmacy' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{language === 'en' ? 'Pharmacy Partner Login' : 'फार्मेसी पार्टनर लॉगिन'}</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="pharmacy-email">{language === 'en' ? 'Email Address' : 'ईमेल पता'}</Label>
                  <Input
                    id="pharmacy-email"
                    type="email"
                    placeholder="pharmacy@email.com"
                    value={pharmacyEmail}
                    onChange={(e) => setPharmacyEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pharmacy-password">{language === 'en' ? 'Password' : 'पासवर्ड'}</Label>
                  <div className="relative">
                    <Input
                      id="pharmacy-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={pharmacyPassword}
                      onChange={(e) => setPharmacyPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  className="h-12 w-full bg-[var(--health-green)] hover:bg-[var(--health-green-dark)] text-lg"
                  onClick={handlePharmacyLogin}
                  disabled={isLoading || !pharmacyEmail || !pharmacyPassword}
                >
                  {isLoading ? (language === 'en' ? 'Logging in...' : 'लॉगिन जारी है...') : (language === 'en' ? 'Login' : 'लॉगिन')}
                </Button>

                {/* Pharmacy Registration Link */}
                {onRegister && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      {language === 'en' ? "Don't have a pharmacy account?" : 'फार्मेसी खाता नहीं है?'}
                    </p>
                    <Button
                      variant="link"
                      onClick={onRegister}
                      className="text-[var(--health-green)] hover:text-[var(--health-green-dark)] font-semibold"
                    >
                      {language === 'en' ? 'Register as Pharmacy Partner' : 'फार्मेसी पार्टनर के रूप में पंजीकरण करें'}
                    </Button>
                  </div>
                )}

                <div className="space-y-2 rounded-lg bg-green-50 p-3">
                  <p className="text-center text-xs font-semibold text-green-900">{language === 'en' ? 'Demo Account:' : 'डेमो खाता:'}</p>
                  <p className="text-center text-xs text-green-800">pharmacy@healthplus.com</p>
                  <p className="text-center text-xs text-green-800">pharmacy123</p>
                </div>

                <p className="rounded-lg bg-amber-50 p-3 text-center text-xs text-amber-800">
                  {language === 'en' 
                    ? 'Contact MedsZop team to register your pharmacy'
                    : 'अपनी फार्मेसी पंजीकृत करने के लिए MedsZop टीम से संपर्क करें'}
                </p>
              </div>
            )}

            {/* ADMIN LOGIN */}
            {activeRole === 'admin' && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold">{language === 'en' ? 'Admin Panel' : 'व्यवस्थापक पैनल'}</h3>
                
                <div className="space-y-1.5">
                  <Label htmlFor="admin-email" className="text-sm">{language === 'en' ? 'Admin Email' : 'व्यवस्थापक ईमेल'}</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@medszop.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-password" className="text-sm">{language === 'en' ? 'Password' : 'पासवर्ड'}</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-10 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="mt-1 rounded-lg bg-[#3f2a8a] p-2 shadow-sm text-white">
                  <Button
                    className="h-11 w-full bg-[#5a3bc4] hover:bg-[#4c2ea8] border border-transparent text-white shadow"
                    onClick={handleAdminLogin}
                    disabled={isLoading || !adminEmail || !adminPassword}
                  >
                    {isLoading ? (language === 'en' ? 'Logging in...' : 'लॉगिन जारी है...') : (language === 'en' ? 'Login' : 'लॉगिन')}
                  </Button>
                </div>

                <div className="space-y-1 rounded-lg bg-purple-50 p-2">
                  <p className="text-center text-xs font-semibold text-purple-900">{language === 'en' ? 'Demo Account:' : 'डेमो खाता:'}</p>
                  <p className="text-center text-xs text-purple-800">admin@medszop.com</p>
                  <p className="text-center text-xs text-purple-800">admin123</p>
                </div>

                <p className="rounded-lg bg-red-50 p-2 text-center text-xs text-red-800">
                  {language === 'en'
                    ? 'Admin access is restricted to MedsZop team only'
                    : 'व्यवस्थापक पहुँच केवल MedsZop टीम के लिए प्रतिबंधित है'}
                </p>
              </div>
            )}

            {/* Security Note */}
            <div className="mt-6 flex items-start gap-2 rounded-lg bg-[var(--health-blue-light)] p-3">
              <Shield className="h-5 w-5 flex-shrink-0 text-[var(--health-blue)]" />
              <p className="text-xs text-[var(--health-blue-dark)]">
                {language === 'en'
                  ? 'Your data is secure with JWT authentication and password encryption'
                  : 'आपका डेटा JWT प्रमाणीकरण और पासवर्ड एन्क्रिप्शन के साथ सुरक्षित है'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Demo Access */}
        <div className="mt-6 text-center">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">{language === 'en' ? 'Quick access to demo accounts:' : 'डेमो खातों तक त्वरित पहुंच:'}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onLogin(mockUser);
                }}
              >
                {language === 'en' ? 'Demo Customer' : 'डेमो ग्राहक'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onLogin(mockPharmacyUser);
                }}
              >
                {language === 'en' ? 'Demo Pharmacy' : 'डेमो फार्मेसी'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onLogin(mockAdminUser);
                }}
              >
                {language === 'en' ? 'Demo Admin' : 'डेमो व्यवस्थापक'}
              </Button>
            </div>
          </div>
        </div>

        {/* Terms */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {language === 'en'
            ? 'By continuing, you agree to our Terms of Service and Privacy Policy'
            : 'जारी रखकर, आप हमारी सेवा की शर्तों और गोपनीयता नीति से सहमत हैं'}
        </p>

        {/* 🔴 MANDATORY: Firebase Phone OTP reCAPTCHA Container */}
        <div id="recaptcha-container" className="mt-4"></div>
      </div>
    </div>
  );
}



