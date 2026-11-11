import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Stethoscope, Store, Truck, Clock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import PartnersNavbar from "../components/PartnersNavbar";
import PartnersFooter from "../components/PartnersFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const PartnerLandingPage = () => {
  const [trackingId, setTrackingId] = useState("");
  const navigate = useNavigate();

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackingId.trim()) {
      navigate(`/application-status/${trackingId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PartnersNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50/50 via-white to-slate-50 py-16 px-4 sm:px-6 lg:px-8 border-b">
          <div className="container mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-4">
              <ShieldCheck className="h-4 w-4" />
              Official MedsZop Partner Onboarding
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Join India's Smartest <span className="text-blue-600">Healthcare Network</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Partner with MedsZop to empower millions with authentic medicine delivery, verified telehealth consultations, and rapid logistics.
            </p>

            {/* Quick Track Application Form */}
            <div className="mt-8 max-w-md mx-auto">
              <form onSubmit={handleTrack} className="flex gap-2">
                <Input
                  placeholder="Enter Tracking ID (e.g. 67a...)"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="bg-white shadow-xs text-sm"
                />
                <Button type="submit" variant="default" className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
                  Track
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Partner Categories */}
        <section className="container mx-auto max-w-6xl py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Doctor Card */}
            <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Medical Practitioners</CardTitle>
                <CardDescription>
                  Provide remote telehealth video and chat consultations to verified patients across India.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    Telemedicine Standards Compliant
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    Encrypted Video & Chat Rooms
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    Flexible Consultation Schedule
                  </li>
                </ul>
                <Link to="/apply/doctor" className="block pt-2">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-1.5 text-xs font-semibold">
                    Apply as Doctor <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pharmacy Card */}
            <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <Store className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Retail Pharmacies</CardTitle>
                <CardDescription>
                  List your verified medicine inventory and receive local delivery orders with real-time settlement.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    Bulk CSV Inventory Management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    Verified Prescription Dispatch
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    Local Delivery Fleet Assigned
                  </li>
                </ul>
                <Link to="/apply/pharmacy" className="block pt-2">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs font-semibold">
                    Apply as Pharmacy <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Delivery Card */}
            <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-2">
                  <Truck className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Delivery Heroes</CardTitle>
                <CardDescription>
                  Deliver medicines and healthcare essentials in your city with daily payouts and live route guidance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                    Doorstep OTP Verification
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                    Instant Job Claiming & Maps
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                    Transparent Daily Payouts
                  </li>
                </ul>
                <Link to="/apply/delivery" className="block pt-2">
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700 gap-1.5 text-xs font-semibold">
                    Apply as Delivery Hero <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <PartnersFooter />
    </div>
  );
};

export default PartnerLandingPage;

