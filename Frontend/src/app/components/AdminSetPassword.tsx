import { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { authService } from '../../services/authService';

interface AdminSetPasswordProps {
  token?: string;
  onSuccess?: () => void;
}

export function AdminSetPassword({ token = '', onSuccess }: AdminSetPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (pwd: string): string[] => {
    const issues: string[] = [];
    if (pwd.length < 6) issues.push('At least 6 characters');
    if (!/[A-Z]/.test(pwd)) issues.push('One uppercase letter');
    if (!/[0-9]/.test(pwd)) issues.push('One number');
    if (!/[!@#$%^&*]/.test(pwd)) issues.push('One special character (!@#$%^&*)');
    return issues;
  };

  const passwordIssues = validatePassword(password);
  const isPasswordValid = passwordIssues.length === 0;
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSetPassword = async () => {
    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (passwordIssues.length > 0) {
      setError('Password does not meet requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid or expired invite link');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.setAdminPassword(token, password);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to set password');
      }

      setSuccess(true);
      toast.success('Password set successfully! Redirecting to login...');
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = '/admin/login';
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to set password. Please try again.');
      toast.error(err.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--health-blue-light)] to-white p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--health-green-light)]">
                <CheckCircle className="h-8 w-8 text-[var(--health-green)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--health-blue)]">Password Set!</h2>
              <p className="text-muted-foreground">
                Your account has been activated. You can now login with your email and password.
              </p>
              <p className="text-sm text-blue-600 font-semibold">
                Redirecting to login page...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--health-blue-light)] to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-[var(--health-blue)]">Invalid Invite Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Link Expired or Invalid</p>
                <p className="text-sm text-red-700 mt-1">
                  This invite link is not valid or has expired. 
                </p>
                <p className="text-sm text-red-700 mt-2">
                  Please ask your super admin to resend the invite.
                </p>
              </div>
            </div>
            <Button 
              className="w-full"
              onClick={() => window.location.href = '/admin/login'}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--health-blue-light)] to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <img src="/assets/M logo1.png" alt="MedsZop" className="h-8 w-8 rounded" />
            <span className="font-bold text-[var(--health-blue)]">MedsZop</span>
          </div>
          <CardTitle className="text-center">Set Your Password</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Welcome to MedsZop Admin Panel! Set a secure password to activate your account.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Password Requirements */}
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Password Requirements:</p>
              <div className="space-y-1">
                {[
                  { check: password.length >= 6, label: 'At least 6 characters' },
                  { check: /[A-Z]/.test(password), label: 'One uppercase letter (A-Z)' },
                  { check: /[0-9]/.test(password), label: 'One number (0-9)' },
                  { check: /[!@#$%^&*]/.test(password), label: 'One special character (!@#$%^&*)' },
                ].map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div
                      className={`h-3 w-3 rounded-full flex-shrink-0 ${
                        req.check ? 'bg-[var(--health-green)]' : 'bg-gray-300'
                      }`}
                    />
                    <span className={req.check ? 'text-[var(--health-green)]' : 'text-muted-foreground'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password *</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-600">Passwords do not match</p>
            )}
            {passwordsMatch && (
              <p className="text-xs text-[var(--health-green)]">✓ Passwords match</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            className="w-full bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)]"
            disabled={!isPasswordValid || !passwordsMatch || loading}
            onClick={handleSetPassword}
          >
            {loading ? 'Setting Password...' : 'Set Password & Activate Account'}
          </Button>

          {/* Info Box */}
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-semibold">Next Step:</p>
            <p className="mt-1">
              After setting your password, you can login using your email and the password you just created.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
