import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, Phone, Mail } from 'lucide-react';
import { Language, User } from '../types';
import { authService } from '../../services/authService';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (user: User) => void;
  onBack: () => void;
  language: Language;
}

export function Login({ onLogin, onBack, language }: LoginProps) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        toast.success('Login successful!');
        onLogin(result.data.user);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !phone) {
      toast.error('Please fill in all fields');
      return;
    }

    if (phone.length !== 10) {
      toast.error('Phone number must be 10 digits');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.register({
        name,
        email,
        password,
        phone,
        role: 'user'
      });
      if (result.success) {
        toast.success('Registration successful!');
        setEmail('');
        setPassword('');
        setName('');
        setPhone('');
        setIsRegistering(false);
        onLogin(result.data.user);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">
                  {language === 'en' ? 'Login' : 'लॉगिन'}
                </TabsTrigger>
                <TabsTrigger value="register">
                  {language === 'en' ? 'Register' : 'पंजीकरण'}
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
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
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    {language === 'en' ? 'Password' : 'पासवर्ड'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>

                <Button
                  className="h-12 w-full bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)] text-lg"
                  onClick={handleLogin}
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? 'Logging in...' : language === 'en' ? 'Login' : 'लॉगिन'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {language === 'en'
                    ? 'Demo: user@test.com / password123'
                    : 'डेमो: user@test.com / password123'}
                </p>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {language === 'en' ? 'Full Name' : 'पूरा नाम'}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">
                    {language === 'en' ? 'Email Address' : 'ईमेल पता'}
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {language === 'en' ? 'Phone Number' : 'फ़ोन नंबर'}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">
                    {language === 'en' ? 'Password' : 'पासवर्ड'}
                  </Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>

                <Button
                  className="h-12 w-full bg-[var(--health-green)] hover:bg-[var(--health-green-dark)] text-lg"
                  onClick={handleRegister}
                  disabled={isLoading || !name || !email || !password || !phone}
                >
                  {isLoading ? 'Registering...' : language === 'en' ? 'Register' : 'पंजीकरण'}
                </Button>
              </TabsContent>
            </Tabs>

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

