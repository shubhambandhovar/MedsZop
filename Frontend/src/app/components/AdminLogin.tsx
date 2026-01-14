import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { authService } from '../../services/authService';

interface AdminLoginProps {
  onLoginSuccess?: (admin: any) => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    if (!email.includes('@medszop.com')) {
      setError('Please use your @medszop.com email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.login(email, password, 'admin');
      if (!response?.success) {
        throw new Error(response?.message || 'Login failed');
      }

      const adminUser = response.data.user;
      toast.success('Login successful!');
      
      if (onLoginSuccess) {
        onLoginSuccess(adminUser);
      } else {
        window.location.href = '/admin/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--health-blue-light)] to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <img src="/assets/M logo1.png" alt="MedsZop" className="h-8 w-8 rounded" />
            <span className="font-bold text-[var(--health-blue)]">MedsZop</span>
          </div>
          <CardTitle className="text-center">Admin Login</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Sign in to access the admin panel
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Company Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.name@medszop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Use your @medszop.com email address
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs text-[var(--health-blue)] hover:underline"
                  onClick={() => window.location.href = '/admin/forgot-password'}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)]"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Info Box */}
          <div className="mt-6 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-semibold">New Admin?</p>
            <p className="mt-1">
              If you've been invited by a super admin, you should have received an invite link to set your password first.
            </p>
          </div>

          {/* Quick Access for Demo */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center mb-2">Demo Credentials:</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => {
                  setEmail('admin@medszop.com');
                  setPassword('Admin@123');
                }}
              >
                Use Demo Super Admin
              </Button>
              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => {
                  setEmail('user.admin@medszop.com');
                  setPassword('User@123');
                }}
              >
                Use Demo Regular Admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
