import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertCircle,
  Save,
  RotateCcw,
  ShieldCheck,
  ThermometerSnowflake,
  Loader2,
  Check
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { Badge } from "../../components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const DRAFT_KEY = "medszop_fe_draft_pharmacy";

const PharmacistApplicationPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const [formData, setFormData] = useState({
    owner_name: "",
    email: "",
    phone: "",
    entity_type: "Proprietorship",
    pan_number: "",
    pharmacy_name: "",
    address: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    operating_hours: "09:00 AM - 10:00 PM",
    delivery_radius_km: "5",
    has_cold_storage: true,
    license_number: "",
    pharmacist_name: "",
    pharmacist_reg_number: "",
    gst_number: "",
    pharmacy_license: "",
    pharmacist_cert: "",
    gst_certificate: "",
    terms_agreed: false
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) setHasDraft(true);
    } catch (e) {
      console.warn("Draft check failed:", e);
    }
  }, []);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        setFormData(JSON.parse(saved));
        setHasDraft(false);
        toast.success("Pharmacy application draft restored");
      }
    } catch (e) {
      toast.error("Could not restore draft");
    }
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      toast.success("Draft saved to this device");
    } catch (e) {
      toast.error("Failed to save draft");
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    toast.info("Draft discarded");
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
      toast.error("Invalid file format. Upload PDF, JPG, or PNG files only.");
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
      if (!formData.owner_name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        toast.error("Please fill in Owner Name, Email, and Phone.");
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        toast.error("Please enter a valid email address.");
        return false;
      }
    } else if (step === 2) {
      if (!formData.pharmacy_name.trim() || !formData.address.trim() || !formData.pincode.trim()) {
        toast.error("Please fill in Pharmacy Name, Address, and PIN code.");
        return false;
      }
    } else if (step === 3) {
      if (!formData.license_number.trim() || !formData.pharmacist_name.trim()) {
        toast.error("Please provide the Drug License Number and Pharmacist Name.");
        return false;
      }
    } else if (step === 4) {
      if (!formData.pharmacy_license) {
        toast.error("Please upload your Form 20/21 Drug License certificate.");
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
      return toast.error("Please confirm the statutory compliance declaration.");
    }

    setLoading(true);
    try {
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
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/application-status/${res.data.applicationId}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Submission failed");
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            <Building2 className="h-4 w-4" />
            <span>Institutional Pharmacy Network &bull; Bharat Swasthya Grid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            Pharmacist Partner Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Register your licensed retail dispensary or Jan Aushadhi Kendra with MedsZop. All applications are verified against state licensing authority databases.
          </p>
        </div>

        {/* Draft Alert */}
        {hasDraft && currentStep === 1 && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-emerald-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Unfinished Pharmacy Draft Available</p>
                <p className="text-[11px] text-emerald-700">Resume your previously saved registration details.</p>
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

        {/* Stepper Progress */}
        <div className="mb-8">
          <div className="grid grid-cols-5 gap-2">
            {stepsList.map((step) => {
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div key={step.num} className="space-y-1.5 text-center">
                  <div
                    className={`h-2 rounded-full transition-colors ${
                      isCompleted ? "bg-emerald-600" : isCurrent ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                  <span
                    className={`block text-[11px] font-semibold truncate ${
                      isCurrent ? "text-emerald-800 font-bold" : isCompleted ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {step.num}. {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-slate-200/90 shadow-md rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between py-4 px-6">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Step {currentStep}: {stepsList[currentStep - 1].title}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Ensure details strictly match your official Form 20/21 drug license
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
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in-50 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="owner_name">Owner / Licensee Full Name *</Label>
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
                      <Label htmlFor="entity_type">Business Constitution</Label>
                      <select
                        id="entity_type"
                        name="entity_type"
                        value={formData.entity_type}
                        onChange={handleInputChange}
                        className="flex min-h-[44px] h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        <option value="Proprietorship">Sole Proprietorship</option>
                        <option value="Partnership">Partnership Firm</option>
                        <option value="LLP">LLP / Private Limited</option>
                        <option value="JanAushadhiKendra">Jan Aushadhi Kendra (PMBI)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Official Business Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="ramesh@pharmacy.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone Number *</Label>
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
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in-50 duration-200">
                  <div className="space-y-1.5">
                    <Label htmlFor="pharmacy_name">Pharmacy Trade Name *</Label>
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
                    <Label htmlFor="address">Full Physical Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Shop 4, Ground Floor, Station Road"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city">City / District</Label>
                      <Input id="city" name="city" placeholder="Mumbai" value={formData.city} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" name="state" value={formData.state} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pincode">PIN Code *</Label>
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
                  <div className="p-3.5 rounded-xl border border-cyan-200 bg-cyan-50/50 flex items-start gap-3">
                    <ThermometerSnowflake className="h-5 w-5 text-cyan-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="has_cold_storage"
                          checked={formData.has_cold_storage}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_cold_storage: checked }))}
                        />
                        <label htmlFor="has_cold_storage" className="text-xs font-bold text-slate-900 cursor-pointer">
                          Premises Equipped with Verified 2°C–8°C Medical Refrigeration
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 pl-6">
                        Required for insulins, vaccines, and biotechnology medicines.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in-50 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="license_number">Drug License Number (Form 20/21) *</Label>
                      <Input
                        id="license_number"
                        name="license_number"
                        placeholder="MH-TZ3-149821 / Form 20-21"
                        value={formData.license_number}
                        onChange={handleInputChange}
                        className="font-mono text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gst_number">GSTIN Number</Label>
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
                      <Label htmlFor="pharmacist_name">Registered Pharmacist Name *</Label>
                      <Input
                        id="pharmacist_name"
                        name="pharmacist_name"
                        placeholder="Sneha S. Deshmukh"
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
                        placeholder="MSPC-194821"
                        value={formData.pharmacist_reg_number}
                        onChange={handleInputChange}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-5 animate-in fade-in-50 duration-200">
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Upload clear, legible scans in PDF, JPG, or PNG format (&lt; 3MB).</span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="doc_license" className="font-semibold text-slate-800">
                        Form 20 &amp; Form 21 Drug License Scan *
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
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="doc_pharmacist" className="font-semibold text-slate-800">
                        Registered Pharmacist Registration Certificate
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
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase">Application Dossier Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div><span className="text-slate-500">Pharmacy:</span> {formData.pharmacy_name}</div>
                      <div><span className="text-slate-500">Owner:</span> {formData.owner_name}</div>
                      <div><span className="text-slate-500">License:</span> {formData.license_number}</div>
                      <div><span className="text-slate-500">Pharmacist:</span> {formData.pharmacist_name}</div>
                      <div><span className="text-slate-500">PIN Code:</span> {formData.pincode}</div>
                      <div><span className="text-slate-500">Email:</span> {formData.email}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms_agreed"
                        name="terms_agreed"
                        checked={formData.terms_agreed}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, terms_agreed: checked }))}
                        className="mt-0.5"
                      />
                      <label htmlFor="terms_agreed" className="text-xs text-slate-800 leading-relaxed cursor-pointer font-medium">
                        I hereby declare that all information submitted is authentic and valid under the Drugs and Cosmetics Act, 1940. I understand that submitting this application does not authorize medicine dispensing until verified by authorized compliance personnel.
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                {currentStep > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep} className="gap-2 min-h-[44px]">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </Button>
                ) : <div />}

                {currentStep < 5 ? (
                  <Button type="button" onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 min-h-[44px] px-6">
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2 min-h-[44px] px-8 shadow-md">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Submit for Verification</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default PharmacistApplicationPage;
