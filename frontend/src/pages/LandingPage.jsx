import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation, Trans } from "react-i18next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Pill,
  Truck,
  ShieldCheck,
  Clock,
  Brain,
  ScanLine,
  MessageSquare,
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Heart,
  Store,
  Stethoscope,
  Search,
  Activity,
  FileCheck,
  Award,
  ThermometerSnowflake,
  ChevronRight,
  Shield,
  Zap,
  Users,
  X
} from "lucide-react";
import heroImage from "../assets/hero-image.webp";
import heroImage1280Avif from "../assets/hero-image-1280.avif";
import heroImage800Avif from "../assets/hero-image-800.avif";
import heroImage480Avif from "../assets/hero-image-480.avif";
import heroImage800Webp from "../assets/hero-image-800.webp";
import heroImage480Webp from "../assets/hero-image-480.webp";

const LandingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState("");

  const handleHeroSearchSubmit = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/medicines?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate("/medicines");
    }
  };

  const quickSearchTags = [
    { label: "Paracetamol", query: "Paracetamol" },
    { label: "Diabetes Care", query: "Metformin" },
    { label: "Blood Pressure", query: "Amlodipine" },
    { label: "Vitamin C & Zinc", query: "Vitamin" },
    { label: "First Aid & Pain", query: "Ibuprofen" }
  ];

  const stats = [
    { value: "50,000+", label: t("landing.stats.customers"), sub: "Active patients served" },
    { value: "10,000+", label: t("landing.stats.medicines"), sub: "Authentic SKUs in stock" },
    { value: "500+", label: t("landing.stats.pharmacies"), sub: "Licensed local partners" },
    { value: "28 min", label: t("landing.stats.delivery"), sub: "Fastest temperature-controlled drop" }
  ];

  const popularCategories = [
    {
      title: "Chronic Care",
      desc: "Diabetes, Cardiac & Thyroid essentials",
      count: "1,200+ medicines",
      icon: Activity,
      category: "Prescription",
      color: "bg-blue-500/10 text-primary dark:text-blue-400"
    },
    {
      title: "Daily Wellness",
      desc: "Multivitamins, minerals & supplements",
      count: "850+ items",
      icon: Pill,
      category: "Wellness",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "First Aid & Pain Relief",
      desc: "Ointments, analgesics & dressings",
      count: "640+ items",
      icon: ShieldCheck,
      category: "OTC",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    },
    {
      title: "Baby & Motherhood",
      desc: "Pediatric care, feeding & infant health",
      count: "420+ items",
      icon: Heart,
      category: "Baby Care",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400"
    }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Upload Prescription or Search",
      desc: "Snap a photo of your doctor's handwritten prescription or search directly by brand or chemical salt.",
      icon: ScanLine
    },
    {
      step: "02",
      title: "Clinical Verification & Batch Match",
      desc: "Our AI extracts and maps items, followed by double-blind verification by registered pharmacists.",
      icon: FileCheck
    },
    {
      step: "03",
      title: "Tamper-Proof Express Delivery",
      desc: "Sealed, cold-chain compliant medicine packages dispatched to your doorstep within 30 minutes.",
      icon: Truck
    }
  ];

  const testimonials = [
    {
      name: "Dr. Rajesh Kumar",
      role: "Senior Consultant Physician, MBBS, MD",
      badge: "Verified Doctor",
      content:
        "MedsZop's AI scanner accurately reads complex handwritten prescriptions and ensures our patients get exact generic equivalents without dosage mix-ups.",
      rating: 5
    },
    {
      name: "Priya Sharma",
      role: "Caregiver & Family Health Manager",
      badge: "Chronic Care Patient",
      content:
        "Managing my elderly father's monthly diabetes and hypertension medicines used to be stressful. MedsZop delivers sealed authentic strips in under 30 minutes.",
      rating: 5
    },
    {
      name: "Drx. Amit Patel",
      role: "Licensed Pharmacy Partner, MedsZop Network",
      badge: "Pharmacy Partner",
      content:
        "The pharmacy dashboard gives us steady, organized prescription orders and transparent inventory sync. A true win for local community chemists.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Navbar />

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative pt-8 pb-20 md:pt-14 md:pb-32 overflow-hidden border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-b from-blue-50/50 via-white to-background dark:from-slate-950 dark:via-background dark:to-background">
        {/* Subtle Ambient Background Gradients */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-primary/15 via-cyan-500/10 to-transparent blur-[120px] -z-10"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Trust Signal Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary dark:text-blue-400 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("landing.hero.badge") || "India's Smartest Health Companion"}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                <span className="text-muted-foreground font-normal">Licensed Pharmacy Network</span>
              </div>

              {/* Editorial Display Heading with Fluid Clamping */}
              <h1 className="font-heading text-fluid-hero font-bold tracking-tight text-foreground leading-[1.08]">
                <Trans i18nKey="landing.hero.title">
                  Your Health, <span className="text-primary underline decoration-primary/30 decoration-wavy decoration-2 underline-offset-8">Delivered</span>
                  <br />
                  Smarter & Faster.
                </Trans>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl font-normal">
                {t("landing.hero.subtitle") ||
                  "Verified prescription medicines, AI-powered dosage verification, and tamper-sealed delivery from certified local pharmacies in 28 minutes."}
              </p>

              {/* HERO INTERACTIVE SEARCH BAR */}
              <div className="pt-2">
                <form
                  onSubmit={handleHeroSearchSubmit}
                  className="relative flex items-center p-2 rounded-2xl bg-card border border-border shadow-lg shadow-primary/5 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all duration-200 max-w-xl"
                >
                  <div className="pl-3 pr-2 text-muted-foreground" aria-hidden="true">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Search medicines, salts (e.g. Paracetamol, Metformin)..."
                    aria-label="Search medicines directly from homepage"
                    className="w-full bg-transparent px-2 py-2 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  {heroSearch && (
                    <button
                      type="button"
                      onClick={() => setHeroSearch("")}
                      aria-label="Clear search text"
                      className="p-1.5 rounded-full text-muted-foreground hover:text-foreground mr-1 transition-colors"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                  <Button
                    type="submit"
                    className="rounded-xl px-4 sm:px-5 h-11 font-medium shadow-md hover:shadow-lg active-press transition-all shrink-0"
                    data-testid="hero-search-submit"
                  >
                    <span>Search</span>
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                  </Button>
                </form>

                {/* Popular Tags Under Search */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Common searches:</span>
                  {quickSearchTags.map((tag) => (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={() => navigate(`/medicines?search=${encodeURIComponent(tag.query)}`)}
                      className="px-2.5 py-1.5 rounded-full bg-muted/80 hover:bg-primary/10 hover:text-primary active-press transition-all text-xs border border-border/40 font-medium"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hero Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <Link to="/prescription-scan" data-testid="scan-prescription-btn" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto rounded-full h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active-press transition-all"
                  >
                    <ScanLine className="mr-2 h-5 w-5" aria-hidden="true" />
                    {t("landing.hero.scan_btn") || "Scan Prescription"}
                  </Button>
                </Link>
                <Link to="/doctor-chat" data-testid="chat-ai-doctor-hero" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto rounded-full h-12 px-8 text-base font-semibold border-border hover:bg-muted active-press transition-all"
                  >
                    <Brain className="mr-2 h-5 w-5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                    Consult AI Doctor
                  </Button>
                </Link>
              </div>

              {/* Patient Trust Indicators */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex -space-x-2">
                  <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-950 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-primary">
                    DR
                  </div>
                  <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-950 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-emerald-600">
                    RX
                  </div>
                  <div className="h-9 w-9 rounded-full bg-cyan-100 dark:bg-cyan-950 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-cyan-600">
                    AI
                  </div>
                </div>
                <div className="text-xs sm:text-sm">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                    ))}
                    <span className="font-semibold text-foreground ml-1">4.9 / 5.0</span>
                  </div>
                  <p className="text-muted-foreground">{t("landing.hero.trusted_by") || "50,000+ patient prescriptions filled"}</p>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Card (5 Cols) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Backing Glow */}
                <div
                  aria-hidden="true"
                  className="absolute -inset-2 bg-gradient-to-tr from-primary/20 via-cyan-500/20 to-primary/10 rounded-3xl blur-2xl -z-10"
                />

                {/* Primary Card */}
                <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl">
                  <div className="relative h-72 sm:h-80 overflow-hidden bg-muted">
                    <picture>
                      <source
                        type="image/avif"
                        srcSet={`${heroImage480Avif} 480w, ${heroImage800Avif} 800w, ${heroImage1280Avif} 1280w`}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
                      />
                      <source
                        type="image/webp"
                        srcSet={`${heroImage480Webp} 480w, ${heroImage800Webp} 800w, ${heroImage} 1280w`}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
                      />
                      <img
                        src={heroImage}
                        alt="Licensed pharmacist and healthcare delivery on MedsZop"
                        className="w-full h-full object-cover"
                        loading="eager"
                        fetchPriority="high"
                        width="640"
                        height="360"
                      />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-xs font-medium mb-1">
                        <CheckCircle className="h-3 w-3" aria-hidden="true" />
                        100% Genuine Medicines
                      </span>
                      <p className="text-sm font-medium text-slate-200">
                        Batch-verified & stored in temperature-monitored hubs.
                      </p>
                    </div>
                  </div>

                  {/* Trust Highlights Inside Card */}
                  <div className="p-5 space-y-3.5 bg-card">
                    <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/60">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <ThermometerSnowflake className="h-4 w-4 text-primary" aria-hidden="true" />
                        Cold-Chain Active
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">2°C – 8°C Monitored</span>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-border/50">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-foreground truncate">Fast Delivery Active</p>
                          <span className="text-xs font-bold text-primary">28 min avg</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">Direct from your nearest certified chemist</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== STATS & TRUST STRIP ==================== */}
      <section className="py-12 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <p className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-primary">
                  {stat.value}
                </p>
                <p className="font-medium text-sm sm:text-base text-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== POPULAR HEALTHCARE CATEGORIES ==================== */}
      <section className="py-20 md:py-28 bg-slate-50/60 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <Badge className="mb-3 bg-primary/10 text-primary border-0 px-3 py-1 text-xs font-semibold rounded-full">
                Curated Health Inventory
              </Badge>
              <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Browse by Clinical Need
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl text-base">
                Find doctor-prescribed therapeutics, maintenance medications, and essential daily health supplies.
              </p>
            </div>
            <Link to="/medicines" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline text-sm shrink-0">
              Explore full medicine catalog
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularCategories.map((item, index) => (
              <Link
                key={index}
                to={`/medicines?category=${encodeURIComponent(item.category)}`}
                className="group block active-press"
              >
                <Card className="h-full rounded-2xl border-border bg-card hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 p-6">
                  <CardContent className="p-0 space-y-4">
                    <div className={`h-12 w-12 rounded-2xl ${item.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-200`}>
                      <item.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.desc}</p>
                    </div>
                    <div className="pt-2 flex items-center justify-between text-xs font-medium text-primary">
                      <span>{item.count}</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== ASYMMETRIC BENTO GRID: SMART PLATFORM ==================== */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="mb-3 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-0 px-3.5 py-1 text-xs font-semibold rounded-full">
              Intelligent Health Delivery
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Designed for Clinical Accuracy
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-3">
              We eliminated the guesswork from digital pharmacies with verified OCR extraction and licensed pharmacist validation.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            {/* Card 1: Prescription Scanner (Span 7) */}
            <div className="lg:col-span-7 rounded-3xl border border-border bg-gradient-to-br from-blue-50/40 via-card to-card dark:from-slate-900/40 dark:via-card dark:to-card p-6 sm:p-10 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <ScanLine className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  <span>Proprietary Prescription OCR</span>
                </div>
                <h3 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                  Transform Handwriting into Verified Orders in Seconds
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl">
                  Doctor handwriting can be notoriously hard to decipher. Our multi-modal AI extracts drug names, dosages, and schedules, mapping them directly to authenticated inventory.
                </p>
                <ul className="space-y-2.5 pt-2 text-sm text-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
                    <span>Extracts both handwritten and typed prescription slips</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
                    <span>Automatic matching with generic salt alternatives for savings</span>
                  </li>
                </ul>
              </div>
              <div className="pt-8">
                <Link to="/prescription-scan">
                  <Button className="rounded-full px-7 h-11 font-medium shadow-md hover:shadow-lg active-press transition-all">
                    Try Prescription Scanner
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Card 2: AI Doctor Chat (Span 5) */}
            <div className="lg:col-span-5 rounded-3xl border border-border bg-gradient-to-br from-cyan-50/40 via-card to-card dark:from-slate-900/40 dark:via-card dark:to-card p-6 sm:p-10 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Brain className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  <span>AI Clinical Assistant</span>
                </div>
                <h3 className="font-heading text-2xl font-bold text-foreground">
                  24/7 Guidance on Dosages & Side Effects
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Understand prescription instructions, ask about contraindications, and receive instant triage before booking your physician consultation.
                </p>
                <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/60 text-xs text-muted-foreground space-y-1">
                  <span className="font-semibold text-foreground block">Clinical Disclaimer:</span>
                  Informational guidance verified under pharmaceutical protocols. Always consult a registered practitioner for diagnosis.
                </div>
              </div>
              <div className="pt-6">
                <Link to="/doctor-chat">
                  <Button variant="outline" className="rounded-full px-7 h-11 font-medium active-press transition-all">
                    Start Assistant Chat
                    <ChevronRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Card 3: Express Cold-Chain Delivery (Span 6) */}
            <div className="lg:col-span-6 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Truck className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                  30-Minute Priority Dispatch
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Insulin, biologics, and emergency antibiotics are packed in tamper-proof thermal carriers, monitored from chemist to your door with live tracking.
                </p>
              </div>
              <div className="pt-6 flex items-center gap-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                <span>Zero compromise on storage temperature</span>
              </div>
            </div>

            {/* Card 4: Licensed Pharmacy Network (Span 6) */}
            <div className="lg:col-span-6 rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Store className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                  Supporting Neighborhood Chemists
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  We don't centralize medicines in distant warehouses. We empower your local trusted pharmacists with digital logistics, ensuring rapid delivery and local accountability.
                </p>
              </div>
              <div className="pt-6 flex items-center gap-3 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>Verified licensed retail pharmacies</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS (3-STEP JOURNEY) ==================== */}
      <section className="py-20 md:py-28 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <Badge className="mb-3 bg-primary/10 text-primary border-0 px-3 py-1 text-xs font-semibold rounded-full">
              Simple & Transparent
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              How MedsZop Works
            </h2>
            <p className="text-muted-foreground mt-2 text-base">
              From prescription snapshot to sealed medicine delivery in three straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
            {howItWorks.map((item, idx) => (
              <div
                key={idx}
                className="relative rounded-3xl bg-card p-6 sm:p-8 border border-border shadow-xs"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="font-heading text-3xl font-extrabold text-primary/30">
                    {item.step}
                  </span>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HEALTHCARE ECOSYSTEM (PARTNERS) ==================== */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="mb-3 bg-primary/10 text-primary border-0 px-3 py-1 text-xs font-semibold rounded-full">
              Ecosystem & Careers
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Partner with MedsZop
            </h2>
            <p className="text-muted-foreground mt-2 text-base">
              Join India's fastest-growing digital healthcare network as a medical professional, retail pharmacy, or logistics specialist.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Doctor */}
            <Card className="rounded-3xl border border-border bg-card p-8 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-primary flex items-center justify-center">
                  <Stethoscope className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">For Physicians & Clinics</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Expand your tele-consultation reach, write digital e-prescriptions, and review patient adherence metrics through a dedicated clinical portal.
                </p>
              </CardContent>
              <div className="pt-6">
                <Link to="/apply/doctor">
                  <Button variant="outline" className="w-full rounded-full font-medium active-press">
                    Apply as Doctor
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Pharmacist */}
            <Card className="rounded-3xl border border-border bg-card p-8 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Store className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">For Retail Pharmacies</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Receive verified digital orders from nearby patients, optimize high-demand inventory, and grow daily pharmacy revenues with zero setup fee.
                </p>
              </CardContent>
              <div className="pt-6">
                <Link to="/apply/pharmacist">
                  <Button variant="outline" className="w-full rounded-full font-medium active-press">
                    Register Pharmacy
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Delivery Fleet */}
            <Card className="rounded-3xl border border-border bg-card p-8 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Truck className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">For Delivery Partners</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Earn competitive compensation delivering life-saving health supplies with flexible hours, medical insurance coverage, and localized routes.
                </p>
              </CardContent>
              <div className="pt-6">
                <Link to="/apply/delivery">
                  <Button variant="outline" className="w-full rounded-full font-medium active-press">
                    Join Delivery Fleet
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS (EDITORIAL FRAUNCES SERIF) ==================== */}
      <section className="py-20 md:py-28 bg-muted/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <Badge className="mb-3 bg-primary/10 text-primary border-0 px-3 py-1 text-xs font-semibold rounded-full">
              Trust & Real Stories
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              What Healthcare Leaders & Patients Say
            </h2>
            <p className="text-muted-foreground mt-2 text-base">
              Verified experiences from doctors, chronic patients, and community pharmacists.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((tItem, index) => (
              <Card
                key={index}
                className="rounded-3xl border border-border bg-card p-8 shadow-xs flex flex-col justify-between"
              >
                <CardContent className="p-0 space-y-5">
                  <div className="flex items-center gap-1">
                    {[...Array(tItem.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    ))}
                  </div>
                  {/* Editorial Accent Quote in Fraunces */}
                  <p className="font-accent italic text-foreground text-base sm:text-lg leading-relaxed">
                    "{tItem.content}"
                  </p>
                </CardContent>

                <div className="pt-6 mt-6 border-t border-border/60">
                  <p className="font-heading font-semibold text-foreground text-sm">{tItem.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tItem.role}</p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-muted text-[11px] font-medium text-primary">
                    {tItem.badge}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA BANNER ==================== */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 right-1/4 w-full max-w-[600px] h-[300px] bg-primary/20 blur-[100px] -z-0"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md">
              <Shield className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              <span>Encrypted In Transit • Strict Medical Privacy</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Order Your Medicines with Complete Confidence
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto">
              Never wait in pharmacy lines or risk out-of-stock emergency medications. Upload your prescription now and let certified experts handle the rest.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/prescription-scan" data-testid="cta-scan-prescription">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-full h-12 px-8 text-base font-semibold bg-white text-slate-900 hover:bg-slate-100 shadow-xl active-press transition-all"
                >
                  <ScanLine className="mr-2 h-5 w-5 text-primary" aria-hidden="true" />
                  Upload Prescription
                </Button>
              </Link>
              <Link to="/medicines" data-testid="cta-browse-medicines">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full h-12 px-8 text-base font-semibold bg-transparent text-white border-white/40 hover:bg-white/10 active-press transition-all"
                >
                  Browse Medicines
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
