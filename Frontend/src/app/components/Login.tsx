import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, Phone, Mail } from 'lucide-react';
import { Language } from '../types';

interface LoginProps {
  onLogin: (phone: string) => void;
  onBack: () => void;
  language: Language;
}

export function Login({ onLogin, onBack, language }: LoginProps) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = () => {
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    onLogin(phone || email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--health-blue-light)] to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Logo and Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--health-blue)] to-[var(--health-green)] shadow-lg">
            <span className="text-3xl font-bold text-white">M</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">
            {language === 'en' ? 'Welcome to MedsZop' : 'मेड्सज़ॉप में आपका स्वागत है'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en'
              ? 'Medicine delivery in 60 minutes'
              : '60 मिनट में दवा डिलीवरी'}
          </p>
        </div>

        {/* Login Card */}
        <Card className="mx-auto max-w-md shadow-lg">
          <CardContent className="p-6">
            <Tabs defaultValue="phone">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phone">
                  <Phone className="mr-2 h-4 w-4" />
                  {language === 'en' ? 'Phone' : 'फ़ोन'}
                </TabsTrigger>
                <TabsTrigger value="email">
                  <Mail className="mr-2 h-4 w-4" />
                  {language === 'en' ? 'Email' : 'ईमेल'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="phone" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {language === 'en' ? 'Phone Number' : 'फ़ोन नंबर'}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={otpSent}
                    className="h-12 text-lg"
                  />
                </div>

                {otpSent && (
                  <div className="space-y-2">
                    <Label htmlFor="otp">
                      {language === 'en' ? 'Enter OTP' : 'OTP दर्ज करें'}
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="h-12 text-center text-2xl tracking-widest"
                    />
                    <p className="text-sm text-muted-foreground">
                      {language === 'en'
                        ? 'OTP sent to your phone'
                        : 'OTP आपके फ़ोन पर भेजा गया'}
                    </p>
                  </div>
                )}

                {!otpSent ? (
                  <Button
                    className="h-12 w-full bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)] text-lg"
                    onClick={handleSendOtp}
                    disabled={!phone}
                  >
                    {language === 'en' ? 'Send OTP' : 'OTP भेजें'}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      className="h-12 w-full bg-[var(--health-green)] hover:bg-[var(--health-green-dark)] text-lg"
                      onClick={handleVerifyOtp}
                      disabled={otp.length !== 6}
                    >
                      {language === 'en' ? 'Verify & Login' : 'सत्यापित करें और लॉगिन करें'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setOtpSent(false)}
                    >
                      {language === 'en' ? 'Change Number' : 'नंबर बदलें'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {language === 'en' ? 'Email Address' : 'ईमेल पता'}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={otpSent}
                    className="h-12"
                  />
                </div>

                {otpSent && (
                  <div className="space-y-2">
                    <Label htmlFor="otp-email">
                      {language === 'en' ? 'Enter OTP' : 'OTP दर्ज करें'}
                    </Label>
                    <Input
                      id="otp-email"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="h-12 text-center text-2xl tracking-widest"
                    />
                    <p className="text-sm text-muted-foreground">
                      {language === 'en'
                        ? 'OTP sent to your email'
                        : 'OTP आपके ईमेल पर भेजा गया'}
                    </p>
                  </div>
                )}

                {!otpSent ? (
                  <Button
                    className="h-12 w-full bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)] text-lg"
                    onClick={handleSendOtp}
                    disabled={!email}
                  >
                    {language === 'en' ? 'Send OTP' : 'OTP भेजें'}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      className="h-12 w-full bg-[var(--health-green)] hover:bg-[var(--health-green-dark)] text-lg"
                      onClick={handleVerifyOtp}
                      disabled={otp.length !== 6}
                    >
                      {language === 'en' ? 'Verify & Login' : 'सत्यापित करें और लॉगिन करें'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setOtpSent(false)}
                    >
                      {language === 'en' ? 'Change Email' : 'ईमेल बदलें'}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Security Note */}
            <div className="mt-6 flex items-start gap-2 rounded-lg bg-[var(--health-blue-light)] p-3">
              <Shield className="h-5 w-5 flex-shrink-0 text-[var(--health-blue)]" />
              <p className="text-xs text-[var(--health-blue-dark)]">
                {language === 'en'
                  ? 'Your data is secure with JWT authentication and end-to-end encryption'
                  : 'आपका डेटा JWT प्रमाणीकरण और एंड-टू-एंड एन्क्रिप्शन के साथ सुरक्षित है'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Skip for Demo */}
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => onLogin('demo')}>
            {language === 'en' ? 'Skip & Browse' : 'छोड़ें और ब्राउज़ करें'}
          </Button>
        </div>

        {/* Terms */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {language === 'en'
            ? 'By continuing, you agree to our Terms of Service and Privacy Policy'
            : 'जारी रखकर, आप हमारी सेवा की शर्तों और गोपनीयता नीति से सहमत हैं'}
        </p>
      </div>
    </div>
  );
}
