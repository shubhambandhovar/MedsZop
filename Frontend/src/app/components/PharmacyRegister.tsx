import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Upload, FileText, Store, Mail, Phone, User, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface PharmacyRegisterProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function PharmacyRegister({ onBack, onSuccess }: PharmacyRegisterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    ownerName: '',
    pharmacyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
  });
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image (JPG, PNG) or PDF file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setLicenseFile(file);
      toast.success('License file selected');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.ownerName || !formData.pharmacyName || !formData.email || !formData.phone || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!licenseFile) {
      toast.error('Please upload your pharmacy license');
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);

    try {
      // Upload license file first
      const formDataUpload = new FormData();
      formDataUpload.append('file', licenseFile);
      
      // For demo purposes, we'll use a placeholder URL
      // In production, you should upload to a file storage service
      const licenseUrl = `https://placeholder-license-url.com/${Date.now()}-${licenseFile.name}`;

      // Register pharmacy
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/auth/register`, {
        name: formData.ownerName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: 'pharmacy',
        pharmacyName: formData.pharmacyName,
        pharmacyLicenseUrl: licenseUrl,
        pharmacyLicenseNumber: formData.licenseNumber || undefined
      });

      if (response.data.success) {
        setIsSuccess(true);
        toast.success('Registration submitted successfully!');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--health-green-light)] to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Registration Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Your pharmacy registration has been submitted successfully. Our admin team will review your application and approve your account within 24-48 hours.
            </p>
            <p className="text-sm text-muted-foreground">
              You will receive an email notification once your account is approved. You can then login and start managing your inventory.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">
                📧 A confirmation email has been sent to:
              </p>
              <p className="text-blue-700 font-semibold mt-1">{formData.email}</p>
            </div>
            <Button onClick={onSuccess} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--health-green-light)] to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8 text-[var(--health-green)]" />
            <div>
              <CardTitle className="text-2xl">Pharmacy Partner Registration</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Join MedsZop as a verified pharmacy partner
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Owner Name */}
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ownerName"
                  type="text"
                  placeholder="Your full name"
                  className="pl-10"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Pharmacy Name */}
            <div className="space-y-2">
              <Label htmlFor="pharmacyName">Pharmacy Store Name *</Label>
              <div className="relative">
                <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pharmacyName"
                  type="text"
                  placeholder="e.g., Apollo Pharmacy"
                  className="pl-10"
                  value={formData.pharmacyName}
                  onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="pharmacy@example.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* License Number */}
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">Pharmacy License Number (Optional)</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="licenseNumber"
                  type="text"
                  placeholder="e.g., PL-12345678"
                  className="pl-10"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                />
              </div>
            </div>

            {/* License Upload */}
            <div className="space-y-2">
              <Label htmlFor="license">Pharmacy License (PDF/Image) *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[var(--health-green)] transition-colors cursor-pointer">
                <input
                  type="file"
                  id="license"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="license" className="cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium">
                    {licenseFile ? licenseFile.name : 'Click to upload license'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, or PDF (Max 5MB)
                  </p>
                </label>
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 6 characters"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Your registration will be reviewed by our admin team. You will receive an email notification once your account is approved (usually within 24-48 hours).
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
                disabled={isLoading}
              >
                Back to Login
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[var(--health-green)] hover:bg-[var(--health-green)]/90"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Registration'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
