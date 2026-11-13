import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  AlertCircle,
  Save,
  RotateCcw,
  ShieldCheck,
  MapPin,
  Clock,
  ThermometerSnowflake,
  Loader2,
  Check,
  X
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const DRAFT_STORAGE_KEY = "medszop_draft_pharmacy_v2";

const PharmacyOnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Owner & Entity
    owner_name: "",
    email: "",
    phone: "",
    entity_type: "Proprietorship",
    pan_number: "",

    // Step 2: Pharmacy Store Location
    pharmacy_name: "",
    address: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    operating_hours: "09:00 AM - 10:00 PM",
    delivery_radius_km: "5",
    has_cold_storage: true,

    // Step 3: Licensing & Pharmacist Credentials
    license_number: "", // Form 20/21
    pharmacist_name: "",
    pharmacist_reg_number: "",
    gst_number: "",

    // Step 4: Documents (Base64 or secure object)
    pharmacy_license: "",
    pharmacist_cert: "",
    gst_certificate: "",
    store_photo: "",

    // Step 5: Declaration
    terms_agreed: false
  });

  // Check for saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        setHasDraft(true);
      }
    } catch (e) {
      console.warn("Could not check local draft:", e);
    }
  }, []);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
        setHasDraft(false);
        toast.success("Draft application restored successfully");
      }
    } catch (e) {
      toast.error("Failed to restore draft");
    }
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      toast.success("Application draft saved locally. You can resume at any time.");
    } catch (e) {
      toast.error("Failed to save draft");
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
      toast.info("Saved draft cleared");
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

    // File restrictions: max 3MB, PDF or image
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file format. Please upload PDF, JPG, or PNG files only.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("File size exceeds 3MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, [fieldName]: reader.result }));
      toast.success(`Uploaded ${file.name} successfully`);
    };
    reader.readAsDataURL(file);
  };

  // Step validation
  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.owner_name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        toast.error("Please fill in Owner Name, Email, and Phone Number.");
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        toast.error("Please enter a valid email address.");
        return false;
      }
    } else if (step === 2) {
      if (!formData.pharmacy_name.trim() || !formData.address.trim() || !formData.pincode.trim()) {
        toast.error("Please fill in Pharmacy Name, Address, and 6-digit PIN code.");
        return false;
      }
      if (!/^\d{6}$/.test(formData.pincode.trim())) {
        toast.error("Please enter a valid 6-digit Indian PIN code.");
        return false;
      }
    } else if (step === 3) {
      if (!formData.license_number.trim() || !formData.pharmacist_name.trim()) {
        toast.error("Please provide the Drug License Number and Registered Pharmacist Name.");
        return false;
      }
    } else if (step === 4) {
      if (!formData.pharmacy_license) {
        toast.error("Please upload a clear copy of your Form 20/21 Drug License.");
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
      return toast.error("You must agree to the statutory compliance declaration before submission.");
    }

    setLoading(true);
    try {
      // Post to public onboarding endpoint
      const payload = {
        owner_name: formData.owner_name,
        email: formData.email,
        phone: formData.phone,
        pharmacy_name: formData.pharmacy_name,
        license_number: formData.license_number,
        address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        pharmacy_license: formData.pharmacy_license,
        gst_certificate: formData.gst_certificate,
        extra_details: {
          pharmacist_name: formData.pharmacist_name,
          pharmacist_reg_number: formData.pharmacist_reg_number,
          gst_number: formData.gst_number,
          operating_hours: formData.operating_hours,
          has_cold_storage: formData.has_cold_storage,
          delivery_radius_km: formData.delivery_radius_km
        }
      };

      const res = await axios.post(`${API_URL}/onboarding/apply/pharmacist`, payload);
      toast.success("Pharmacy Application submitted successfully!");
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      navigate(`/status/${res.data.applicationId}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Submission failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, title: "Owner & Entity" },
    { num: 2, title: "Store Location" },
    { num: 3, title: "Drug Licensing" },
    { num: 4, title: "Document Uploads" },
    { num: 5, title: "Review & Submit" }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-sans">
      {/* Header Banner */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
          <Building2 className="h-4 w-4" />
          <span>Institutional Dispensary Registration &bull; Drugs &amp; Cosmetics Act 1940</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          Retail Pharmacy Partner Application
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Register your physical chemist shop or Jan Aushadhi Kendra with MedsZop. All submissions require valid Form 20/21 drug licenses and are audited by verified compliance reviewers.
        </p>
      </div>

      {/* Draft Resume Alert */}
      {hasDraft && currentStep === 1 && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-emerald-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900">Unfinished Application Draft Detected</p>
              <p className="text-[11px] text-emerald-700">You have a previously saved draft on this browser.</p>
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

      {/* Main Multi-Step Form Card */}
      <Card className="border-slate-200/90 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between py-4 px-6">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Step {currentStep}: {stepsList[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Ensure all information matches your official drug license documentation
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
            {/* STEP 1: Owner & Entity */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="owner_name">Authorized Owner / License Holder Name *</Label>
                    <Input
                      id="owner_name"
                      name="owner_name"
                      placeholder="e.g. Ramesh Chandra Verma"
                      value={formData.owner_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="entity_type">Business Entity Type</Label>
                    <select
                      id="entity_type"
                      name="entity_type"
                      value={formData.entity_type}
                      onChange={handleInputChange}
                      className="flex min-h-[44px] h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <option value="Proprietorship">Sole Proprietorship</option>
                      <option value="Partnership">Partnership Firm</option>
                      <option value="LLP">Limited Liability Partnership (LLP)</option>
                      <option value="PrivateLimited">Private Limited Company</option>
                      <option value="JanAushadhiKendra">Jan Aushadhi Kendra (PMBI Franchise)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Official Business Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="ramesh@vermapharmacy.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Registered Mobile Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 98200 12345"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pan_number">Entity Permanent Account Number (PAN)</Label>
                  <Input
                    id="pan_number"
                    name="pan_number"
                    placeholder="ABCDE1234F"
                    value={formData.pan_number}
                    onChange={handleInputChange}
                    className="font-mono uppercase"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Store Location & Facilities */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="space-y-1.5">
                  <Label htmlFor="pharmacy_name">Pharmacy Trade Name (as per Drug License) *</Label>
                  <Input
                    id="pharmacy_name"
                    name="pharmacy_name"
                    placeholder="e.g. Verma Chemist & Druggist"
                    value={formData.pharmacy_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address">Physical Store Address & Landmark *</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Shop No. 4, Ground Floor, Station Road"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City / District</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Mumbai"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pincode">Postal PIN Code *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      placeholder="400050"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="operating_hours">Store Operating Hours</Label>
                    <Input
                      id="operating_hours"
                      name="operating_hours"
                      value={formData.operating_hours}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="delivery_radius_km">Delivery Fulfillment Radius (km)</Label>
                    <select
                      id="delivery_radius_km"
                      name="delivery_radius_km"
                      value={formData.delivery_radius_km}
                      onChange={handleInputChange}
                      className="flex min-h-[44px] h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <option value="3">Within 3 km (Hyperlocal)</option>
                      <option value="5">Within 5 km (Standard Urban)</option>
                      <option value="10">Within 10 km (Extended City)</option>
                      <option value="15">Within 15 km (Suburban)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-cyan-200 bg-cyan-50/50 flex items-start gap-3">
                  <ThermometerSnowflake className="h-5 w-5 text-cyan-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="has_cold_storage"
                        checked={formData.has_cold_storage}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, has_cold_storage: checked }))
                        }
                      />
                      <label htmlFor="has_cold_storage" className="text-xs font-bold text-slate-900 cursor-pointer">
                        Premises Equipped with Verified 2°C–8°C Medical Refrigeration
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 pl-6">
                      Required for storing temperature-sensitive insulins, vaccines, and eye drops.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Drug Licensing & Pharmacist */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">
                    Statutory Requirement under Drugs &amp; Cosmetics Rules, 1945:
                  </p>
                  <p>
                    Every dispensing retail pharmacy must operate under the personal supervision of a Registered Pharmacist holding Form 20 and Form 21 licenses issued by the State Licensing Authority.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="license_number">Drug License Number (Form 20 / Form 21) *</Label>
                    <Input
                      id="license_number"
                      name="license_number"
                      placeholder="e.g. MH-TZ3-149821 / MH-TZ3-149822"
                      value={formData.license_number}
                      onChange={handleInputChange}
                      className="font-mono text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gst_number">Goods &amp; Services Tax Identification Number (GSTIN)</Label>
                    <Input
                      id="gst_number"
                      name="gst_number"
                      placeholder="27AAAAA0000A1Z5"
                      value={formData.gst_number}
                      onChange={handleInputChange}
                      className="font-mono uppercase text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pharmacist_name">Registered Pharmacist Full Name *</Label>
                    <Input
                      id="pharmacist_name"
                      name="pharmacist_name"
                      placeholder="e.g. Sneha S. Deshmukh"
                      value={formData.pharmacist_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pharmacist_reg_number">State Pharmacy Council Reg. No.</Label>
                    <Input
                      id="pharmacist_reg_number"
                      name="pharmacist_reg_number"
                      placeholder="e.g. MSPC-194821"
                      value={formData.pharmacist_reg_number}
                      onChange={handleInputChange}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Document Uploads */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Upload legible, uncropped scans. File size must be under 3MB (PDF, JPG, or PNG). Do not upload password-protected documents.
                  </span>
                </div>

                {/* Upload 1: Form 20/21 */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="doc_license" className="font-semibold text-slate-800">
                      Drug License Certificate (Form 20 &amp; 21) *
                    </Label>
                    {formData.pharmacy_license ? (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <Check className="h-3 w-3" /> Attached
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-red-500 font-bold">Mandatory</span>
                    )}
                  </div>
                  <Input
                    id="doc_license"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "pharmacy_license")}
                    className="cursor-pointer file:cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500">
                    Front and back of the valid Form 20/21 issued by your state FDA.
                  </p>
                </div>

                {/* Upload 2: Pharmacist Registration Certificate */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="doc_pharmacist" className="font-semibold text-slate-800">
                      State Pharmacy Council Registration Certificate
                    </Label>
                    {formData.pharmacist_cert && (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <Check className="h-3 w-3" /> Attached
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="doc_pharmacist"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "pharmacist_cert")}
                    className="cursor-pointer file:cursor-pointer"
                  />
                </div>

                {/* Upload 3: GST Certificate */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="doc_gst" className="font-semibold text-slate-800">
                      GSTIN Registration Certificate (Form REG-06)
                    </Label>
                    {formData.gst_certificate && (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <Check className="h-3 w-3" /> Attached
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="doc_gst"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "gst_certificate")}
                    className="cursor-pointer file:cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* STEP 5: Review & Submit */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide">
                    Application Summary Review
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div><span className="text-slate-500">Pharmacy:</span> {formData.pharmacy_name}</div>
                    <div><span className="text-slate-500">Owner:</span> {formData.owner_name}</div>
                    <div><span className="text-slate-500">Email:</span> {formData.email}</div>
                    <div><span className="text-slate-500">Mobile:</span> {formData.phone}</div>
                    <div><span className="text-slate-500">PIN Code:</span> {formData.pincode}</div>
                    <div><span className="text-slate-500">Drug License:</span> {formData.license_number}</div>
                    <div><span className="text-slate-500">Pharmacist:</span> {formData.pharmacist_name}</div>
                    <div><span className="text-slate-500">Cold Storage:</span> {formData.has_cold_storage ? "Yes (2°C–8°C)" : "Standard"}</div>
                  </div>
                </div>

                {/* Statutory Declaration */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms_agreed"
                      name="terms_agreed"
                      checked={formData.terms_agreed}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, terms_agreed: checked }))
                      }
                      className="mt-0.5"
                    />
                    <label htmlFor="terms_agreed" className="text-xs text-slate-800 leading-relaxed cursor-pointer font-medium">
                      I hereby solemnly affirm that the information provided is true and accurate. I hold a valid retail drug license in accordance with the Drugs and Cosmetics Act, 1940. I understand that submitting this application does not authorize immediate medicine dispensing, and that final activation is subject to physical verification and administrative review.
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Action Buttons */}
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
                      <span>Submitting Dossier...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Submit Application for Audit</span>
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

export default PharmacyOnboardingPage;

