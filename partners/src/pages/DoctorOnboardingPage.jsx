import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Stethoscope,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  AlertCircle,
  Save,
  RotateCcw,
  ShieldCheck,
  Award,
  Loader2,
  Check,
  Video,
  MessageSquare,
  Phone
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const DRAFT_STORAGE_KEY = "medszop_draft_doctor_v2";

const DoctorOnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Identity
    name: "",
    email: "",
    phone: "",
    gender: "Male",
    date_of_birth: "",

    // Step 2: Qualifications & Medical Council
    qualification: "MBBS",
    other_qualifications: "MD (General Medicine)",
    registration_number: "", // State Council or NMC
    medical_council: "Maharashtra Medical Council (MMC)",
    registration_year: "2015",

    // Step 3: Specialization & Practice
    specialization: "General Medicine",
    experience_years: "8",
    current_affiliation: "Lilavati Hospital & Research Centre, Mumbai",
    consultation_type: "Chat & Video",
    available_hours: "05:00 PM - 09:00 PM IST",

    // Step 4: Documents
    medical_registration_proof: "",
    degree_certificate: "",
    government_id_proof: "",

    // Step 5: Declaration
    terms_agreed: false
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) setHasDraft(true);
    } catch (e) {
      console.warn("Could not check doctor draft:", e);
    }
  }, []);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        setFormData(JSON.parse(saved));
        setHasDraft(false);
        toast.success("Doctor application draft restored successfully");
      }
    } catch (e) {
      toast.error("Failed to restore draft");
    }
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      toast.success("Doctor application draft saved locally.");
    } catch (e) {
      toast.error("Failed to save draft");
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
      toast.info("Saved draft discarded");
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid format. Please upload PDF, JPG, or PNG files only.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("File size exceeds 3MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, [fieldName]: reader.result }));
      toast.success(`Attached ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        toast.error("Please fill in Doctor Name, Email, and Phone Number.");
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        toast.error("Please enter a valid email address.");
        return false;
      }
    } else if (step === 2) {
      if (!formData.registration_number.trim() || !formData.medical_council.trim()) {
        toast.error("Please provide your Medical Council Registration Number.");
        return false;
      }
    } else if (step === 3) {
      if (!formData.specialization.trim() || !formData.experience_years.trim()) {
        toast.error("Please specify your Primary Specialization and Years of Experience.");
        return false;
      }
    } else if (step === 4) {
      if (!formData.medical_registration_proof) {
        toast.error("Please upload your Medical Council Registration Certificate.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.terms_agreed) {
      return toast.error("You must affirm compliance with the Telemedicine Practice Guidelines.");
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.startsWith("Dr.") ? formData.name : `Dr. ${formData.name}`,
        email: formData.email,
        phone: formData.phone,
        registration_number: formData.registration_number,
        qualification: formData.qualification + (formData.other_qualifications ? `, ${formData.other_qualifications}` : ""),
        specialization: formData.specialization,
        experience_years: formData.experience_years,
        consultation_type: formData.consultation_type,
        degree_certificate: formData.degree_certificate,
        medical_registration_proof: formData.medical_registration_proof,
        extra_details: {
          medical_council: formData.medical_council,
          registration_year: formData.registration_year,
          current_affiliation: formData.current_affiliation,
          available_hours: formData.available_hours
        }
      };

      const res = await axios.post(`${API_URL}/onboarding/apply/doctor`, payload);
      toast.success("Doctor Credentialing Application submitted successfully!");
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      navigate(`/status/${res.data.applicationId}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Application submission failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, title: "Practitioner Identity" },
    { num: 2, title: "Council Registration" },
    { num: 3, title: "Clinical Specialties" },
    { num: 4, title: "Credential Uploads" },
    { num: 5, title: "Review & Ethics Affirmation" }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-sans">
      {/* Header Banner */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
          <Stethoscope className="h-4 w-4" />
          <span>Registered Medical Practitioner (RMP) Registry &bull; NMC Aligned</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          Clinical Practitioner Application
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Join the MedsZop clinical telemedicine network. All practitioners undergo verification of registration with the State Medical Council or National Medical Commission before clinical privileges are unlocked.
        </p>
      </div>

      {/* Draft Alert */}
      {hasDraft && currentStep === 1 && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-emerald-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900">Unfinished Doctor Application Found</p>
              <p className="text-[11px] text-emerald-700">Resume your previously saved clinical dossier.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={restoreDraft} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8">
              Resume Draft
            </Button>
            <Button size="sm" variant="ghost" onClick={clearDraft} className="text-xs h-8 text-slate-600">
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Stepper Progress Bar */}
      <div className="mb-8">
        <div className="grid grid-cols-5 gap-2">
          {stepsList.map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            return (
              <div key={step.num} className="space-y-1.5 text-center">
                <div
                  className={`h-2 rounded-full transition-colors ${
                    isCompleted
                      ? "bg-emerald-600"
                      : isCurrent
                      ? "bg-emerald-500"
                      : "bg-slate-200"
                  }`}
                />
                <span
                  className={`block text-[11px] font-semibold truncate ${
                    isCurrent
                      ? "text-emerald-800 font-bold"
                      : isCompleted
                      ? "text-slate-800"
                      : "text-slate-400"
                  }`}
                >
                  {step.num}. {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="border-slate-200/90 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between py-4 px-6">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Step {currentStep}: {stepsList[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Please enter official details matching your medical registration certificate
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={saveDraft}
            className="text-xs gap-1.5 border-slate-300 h-9"
          >
            <Save className="h-3.5 w-3.5 text-slate-600" />
            <span className="hidden sm:inline">Save Draft</span>
          </Button>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: Practitioner Identity */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Legal Name (as per Council) *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g. Dr. Rajesh K. Sharma"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Official Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="dr.rajesh@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Mobile Phone (for OTP &amp; Alerts) *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 98201 44521"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="flex min-h-[44px] h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other / Prefer not to specify</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Qualifications & Medical Council */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">
                    Telemedicine Practice Guidelines (2020) Mandate:
                  </p>
                  <p>
                    Only Registered Medical Practitioners (RMPs) enrolled in the State Medical Register or Indian Medical Register (under the National Medical Commission Act, 2019) are entitled to provide tele-consultations and electronic prescriptions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="qualification">Primary Medical Degree *</Label>
                    <select
                      id="qualification"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      className="flex min-h-[44px] h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <option value="MBBS">MBBS (Bachelor of Medicine &amp; Surgery)</option>
                      <option value="MD">MD (Doctor of Medicine)</option>
                      <option value="MS">MS (Master of Surgery)</option>
                      <option value="DNB">DNB (Diplomate of National Board)</option>
                      <option value="BAMS">BAMS (Ayurveda)</option>
                      <option value="BHMS">BHMS (Homeopathy)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="other_qualifications">Postgraduate / Super-Specialty Degrees</Label>
                    <Input
                      id="other_qualifications"
                      name="other_qualifications"
                      placeholder="e.g. MD (Pediatrics), DM (Cardiology)"
                      value={formData.other_qualifications}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="medical_council">Enrolled State Medical Council / Authority *</Label>
                    <Input
                      id="medical_council"
                      name="medical_council"
                      placeholder="e.g. Maharashtra Medical Council / Delhi Medical Council"
                      value={formData.medical_council}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="registration_year">Year of Registration</Label>
                    <Input
                      id="registration_year"
                      name="registration_year"
                      placeholder="2015"
                      value={formData.registration_year}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="registration_number">Medical Council Registration Number (RMP No.) *</Label>
                  <Input
                    id="registration_number"
                    name="registration_number"
                    placeholder="e.g. MMC/2015/04/1892"
                    value={formData.registration_number}
                    onChange={handleInputChange}
                    className="font-mono text-sm uppercase"
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    This number will be cross-referenced against official state registry databases.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: Specialization & Practice */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="specialization">Primary Clinical Specialization *</Label>
                    <select
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      className="flex min-h-[44px] h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <option value="General Medicine">General Medicine / Family Practice</option>
                      <option value="Pediatrics">Pediatrics &amp; Child Health</option>
                      <option value="Dermatology">Dermatology &amp; Venereology</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Gynecology">Obstetrics &amp; Gynecology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Psychiatry">Psychiatry &amp; Mental Health</option>
                      <option value="ENT">ENT (Otolaryngology)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="experience_years">Years of Active Clinical Practice *</Label>
                    <Input
                      id="experience_years"
                      name="experience_years"
                      type="number"
                      min="1"
                      max="60"
                      value={formData.experience_years}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="current_affiliation">Current Hospital / Clinic / Institutional Affiliation</Label>
                  <Input
                    id="current_affiliation"
                    name="current_affiliation"
                    placeholder="e.g. Fortis Hospital, Mulund, Mumbai"
                    value={formData.current_affiliation}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="consultation_type">Preferred Consultation Modality</Label>
                    <select
                      id="consultation_type"
                      name="consultation_type"
                      value={formData.consultation_type}
                      onChange={handleInputChange}
                      className="flex min-h-[44px] h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <option value="Chat & Video">Chat &amp; Secure Video (Recommended)</option>
                      <option value="Chat Only">Async Clinical Chat &amp; EHR</option>
                      <option value="Audio & Video">Audio Calls &amp; Video</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="available_hours">Available Tele-Consultation Window</Label>
                    <Input
                      id="available_hours"
                      name="available_hours"
                      placeholder="e.g. Mon-Sat 06:00 PM - 09:00 PM"
                      value={formData.available_hours}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Credential Uploads */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Upload scanned certificates in PDF, JPG, or PNG format (&lt; 3MB). Certificates must clearly show your Council Registration Seal and Registration Number.
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="doc_council" className="font-semibold text-slate-800">
                      Medical Council Registration Certificate *
                    </Label>
                    {formData.medical_registration_proof ? (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <Check className="h-3 w-3" /> Attached
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-red-500 font-bold">Mandatory</span>
                    )}
                  </div>
                  <Input
                    id="doc_council"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "medical_registration_proof")}
                    className="cursor-pointer file:cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="doc_degree" className="font-semibold text-slate-800">
                      MBBS / Postgraduate Degree Certificate
                    </Label>
                    {formData.degree_certificate && (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <Check className="h-3 w-3" /> Attached
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="doc_degree"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "degree_certificate")}
                    className="cursor-pointer file:cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="doc_govid" className="font-semibold text-slate-800">
                      Government Issued Photo Identity Proof (Aadhaar / Passport / Voter ID)
                    </Label>
                    {formData.government_id_proof && (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <Check className="h-3 w-3" /> Attached
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="doc_govid"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "government_id_proof")}
                    className="cursor-pointer file:cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* STEP 5: Review & Statutory Ethics Affirmation */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide">
                    Practitioner Credential Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div><span className="text-slate-500">Name:</span> {formData.name}</div>
                    <div><span className="text-slate-500">Email:</span> {formData.email}</div>
                    <div><span className="text-slate-500">Mobile:</span> {formData.phone}</div>
                    <div><span className="text-slate-500">Qualifications:</span> {formData.qualification}</div>
                    <div><span className="text-slate-500">Specialty:</span> {formData.specialization}</div>
                    <div><span className="text-slate-500">Council Reg:</span> {formData.registration_number}</div>
                    <div><span className="text-slate-500">Council:</span> {formData.medical_council}</div>
                    <div><span className="text-slate-500">Experience:</span> {formData.experience_years} Years</div>
                  </div>
                </div>

                {/* Telemedicine Compliance Affirmation */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="doctor_terms_agreed"
                      name="terms_agreed"
                      checked={formData.terms_agreed}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, terms_agreed: checked }))
                      }
                      className="mt-0.5"
                    />
                    <label htmlFor="doctor_terms_agreed" className="text-xs text-slate-800 leading-relaxed cursor-pointer font-medium">
                      I solemnly declare that I am a Registered Medical Practitioner (RMP) in good standing with my State Medical Council / National Medical Commission. I agree to abide by the Telemedicine Practice Guidelines (2020) and the Code of Medical Ethics Regulations. I understand that submitting this application does not confer immediate prescribing authority, and that clinical workspace access will be activated only following verification of my medical council credentials.
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="gap-2 min-h-[44px]"
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 min-h-[44px] px-6 shadow-sm"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2 min-h-[44px] px-8 shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting Credentials...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Submit for Council Verification</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorOnboardingPage;

