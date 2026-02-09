import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";

import {
  Pill,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });
  const [loading, setLoading] = useState(false);
  const { register, googleSignup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role, // ✅ Send role!
      });

      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const user = await googleSignup(credentialResponse.credential);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error) {
      const msg = typeof error === "string" ? error : error?.message;
      if (msg && msg.includes("already exists")) {
        toast.custom(() => (
          <div className="flex flex-col items-center gap-3 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border px-8 py-6 w-[340px]">
            <p className="text-sm text-center text-foreground font-medium">
              An account with this email already exists. Please sign in instead.
            </p>
            <button
              onClick={() => { toast.dismiss(); navigate("/login"); }}
              className="bg-primary text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign In
            </button>
          </div>
        ), { position: "top-center", duration: 5000 });
      } else {
        toast.error(msg || "Google sign-up failed");
      }
    }
  };

  const handleGoogleError = () => {
    toast.error("Google sign-up failed. Please try again.");
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 py-12">
      <div className="absolute top-4 left-4">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Pill className="h-7 w-7 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold text-foreground">
              MedsZop
            </span>
          </Link>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-heading text-2xl">
              Create Account
            </CardTitle>
            <CardDescription>Join MedsZop for smart healthcare</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="pl-10 h-12"
                    required
                    data-testid="register-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="pl-10 h-12"
                    required
                    data-testid="register-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="pl-10 h-12"
                    required
                    data-testid="register-phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="pl-10 h-12"
                    required
                    data-testid="register-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    className="pl-10 h-12"
                    required
                    data-testid="register-confirm-password"
                  />
                </div>
              </div>


              <Button
                type="submit"
                className="w-full h-12 rounded-xl"
                disabled={loading}
                data-testid="register-submit"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Google OAuth Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign-Up Button */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                width="100%"
                text="signup_with"
                shape="rectangular"
                use_fedcm_for_prompt={false}
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary font-medium hover:underline"
                  data-testid="login-link"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
