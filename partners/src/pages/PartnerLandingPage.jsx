import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Building2,
  Stethoscope,
  Truck,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Clock,
  Search,
  Lock,
  Award,
  Layers,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

const PartnerLandingPage = () => {
  const [trackId, setTrackId] = useState("");
  const navigate = useNavigate();

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackId.trim()) {
      navigate(`/status/${trackId.trim()}`);
    }
  };

  const partnerTracks = [
    {
      id: "pharmacy",
      title: "Retail Pharmacy & Chemist",
      roleBadge: "DISPENSARY PARTNER",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Building2,
      accentColor: "from-blue-600 to-indigo-700",
      description:
        "Expand your retail pharmacy reach with localized prescription fulfillment and Jan Aushadhi generic availability.",
      eligibility: [
        "Valid Retail Drug License (Form 20 & 21)",
        "Registered Pharmacist (D.Pharm / B.Pharm)",
        "Physical retail premises with cold storage",
        "GSTIN Registration Certificate"
      ],
      stages: ["Application", "Document Audit", "Inventory Integration", "Live Fulfillment"],
      actionUrl: "/apply/pharmacist",
      ctaText: "Apply as Pharmacy Partner"
    },
    {
      id: "doctor",
      title: "Medical Practitioner (RMP)",
      roleBadge: "CLINICAL REGISTRY",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: Stethoscope,
      accentColor: "from-emerald-600 to-teal-700",
      description:
        "Provide verified tele-consultations, structured EHR SOAP clinical notes, and digital prescriptions across India.",
      eligibility: [
        "Recognized Medical Degree (MBBS / MD / MS / DNB)",
        "Active State Medical Council / NMC Registration",
        "Compliance with Telemedicine Practice Guidelines",
        "Valid Government Identity & Degree Proof"
      ],
      stages: ["Application", "Medical Council Check", "Clinical Onboarding", "Patient Consultations"],
      actionUrl: "/apply/doctor",
      ctaText: "Join Clinical Registry"
    },
    {
      id: "delivery",
      title: "Last-Mile Delivery Partner",
      roleBadge: "FLEET LOGISTICS",
      badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
      icon: Truck,
      accentColor: "from-cyan-600 to-teal-700",
      description:
        "Deliver sealed medical parcels and temperature-sensitive therapeutics with doorstep OTP verification and transparent pay.",
      eligibility: [
        "Valid Two-Wheeler / EV Driving License (or Bicycle)",
        "Aadhaar Card or Government Identity Proof",
        "Vehicle Registration Certificate (RC)",
        "Smartphone for GPS dispatch & OTP confirmation"
      ],
      stages: ["Application", "KYC & Identity Audit", "Cold Bag Allocation", "Active Deliveries"],
      actionUrl: "/apply/delivery",
      ctaText: "Apply as Delivery Partner"
    }
  ];

  const verificationStages = [
    {
      step: "01",
      title: "Digital Submission",
      desc: "Complete role-specific registration and upload verified licenses and certifications."
    },
    {
      step: "02",
      title: "Statutory Credential Audit",
      desc: "Administrative reviewers inspect drug licenses, Medical Council numbers, and KYC records."
    },
    {
      step: "03",
      title: "Secure Account Provisioning",
      desc: "Upon verification, temporary credentials and secure portal access are provisioned automatically."
    },
    {
      step: "04",
      title: "Operational Activation",
      desc: "Begin fulfilling pharmacy orders, conducting consultations, or dispatching urgent deliveries."
    }
  ];

  return (
    <div className="space-y-16 lg:space-y-24 pb-16 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white pt-16 pb-24 px-4 sm:px-6">
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98110_1px,transparent_1px),linear-gradient(to_bottom,#10b98110_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-[1720px] mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Award className="h-4 w-4" />
              <span>Bharat Swasthya Partner Infrastructure &bull; Official Onboarding</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading leading-tight text-white">
              Institutional Credentialing for{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Indian Healthcare
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Join MedsZop&apos;s verified healthcare network. We connect licensed retail chemists, registered medical practitioners, and cold-chain logistics couriers under strict regulatory governance.
            </p>

            {/* Quick Application Tracker Box */}
            <div className="pt-4 max-w-xl mx-auto">
              <form
                onSubmit={handleTrackSubmit}
                className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl flex flex-col sm:flex-row gap-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300" />
                  <Input
                    type="text"
                    placeholder="Enter Application Tracking ID (e.g. 65b9e...)"
                    value={trackId}
                    onChange={(e) => setTrackId(e.target.value)}
                    className="pl-10 h-11 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-400 text-sm focus-visible:ring-emerald-500 font-mono"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold h-11 px-6 text-sm shrink-0"
                >
                  <span>Track Status</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </form>
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                Already submitted an onboarding dossier? Enter your Tracking ID above.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Track Selection Cards */}
      <section className="max-w-[1720px] mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <Badge variant="outline" className="text-xs font-semibold px-3 py-1 border-emerald-600 text-emerald-800 bg-emerald-50">
            DEDICATED STREAMS
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-heading">
            Choose Your Professional Partner Channel
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every onboarding journey includes specific statutory requirement checks, document upload guidelines, and independent reviewer audits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {partnerTracks.map((track) => {
            const Icon = track.icon;
            return (
              <Card
                key={track.id}
                className="flex flex-col justify-between border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-200 rounded-2xl hover:border-emerald-300"
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${track.accentColor} text-white flex items-center justify-center shadow-md`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border ${track.badgeColor}`}>
                      {track.roleBadge}
                    </span>
                  </div>

                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900 font-heading">
                      {track.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {track.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
                  {/* Eligibility List */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Eligibility &amp; Document Checklist
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600">
                      {track.eligibility.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Onboarding Stages */}
                  <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Verification Flow
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700 flex-wrap">
                      {track.stages.map((stg, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span>{stg}</span>
                          {i < track.stages.length - 1 && <ChevronRight className="h-3 w-3 text-slate-400" />}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link to={track.actionUrl} className="block pt-2">
                    <Button className="w-full bg-slate-900 hover:bg-emerald-700 text-white font-semibold min-h-[44px] shadow-sm">
                      <span>{track.ctaText}</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Credentialing Protocol Stages */}
      <section className="bg-slate-100/80 border-y border-slate-200/80 py-16 px-4 sm:px-6">
        <div className="max-w-[1720px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-heading">
              Four-Stage Credentialing Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              MedsZop adheres to strict healthcare compliance. All submissions follow an auditable verification pathway.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {verificationStages.map((stage) => (
              <div
                key={stage.step}
                className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 relative overflow-hidden"
              >
                <div className="text-3xl font-extrabold text-emerald-600/30 font-mono">
                  {stage.step}
                </div>
                <h3 className="text-base font-bold text-slate-900">{stage.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{stage.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statutory Disclaimers & Ethics */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-900 font-bold text-sm">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0" />
            <span>Zero False Promises &bull; Ethical Partner Acquisition Policy</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            MedsZop does not guarantee revenue volumes, automatic application approvals, or speculative returns. Approval is granted solely on verified professional licensing, physical premises audits, and compliance with the Drugs and Cosmetics Act 1940, National Medical Commission guidelines, and applicable Indian transport laws.
          </p>
        </div>
      </section>
    </div>
  );
};

export default PartnerLandingPage;

