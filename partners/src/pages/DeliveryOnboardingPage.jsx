import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Truck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  AlertCircle,
  Save,
  RotateCcw,
  ShieldCheck,
  Bike,
  Navigation,
  ThermometerSnowflake,
  Loader2,
  Check,
  QrCode
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const DRAFT_STORAGE_KEY = "medszop_draft_delivery_v2";

const DeliveryOnboardingPage = () => {
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
    emergency_contact: "+91 98200 99881",
    date_of_birth: "",

    // Step 2: Vehicle & Zone
    vehicle_type: "bike", // bike, ev, cycle
    vehicle_number: "",
    operating_city: "Mumbai",
    preferred_zone: "Bandra - Dadar Hub",
    address: "",
    pincode: "",

    // Step 3: DL & Identity
    driving_license_number: "",
    id_proof_number: "", // Aadhaar / Voter

    // Step 4: Documents
    driving_license: "",
    id_proof: "",
    vehicle_rc: "",

    // Step 5: Declaration
    terms_agreed: false
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) setHasDraft(true);
    } catch (e) {
      console.warn("Could not check delivery draft:", e);
    }
  }, []);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        setFormData(JSON.parse(saved));
        setHasDraft(false);
        toast.success("Delivery partner application draft restored");
      }
    } catch (e) {
      toast.error("Failed to restore draft");
    }
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      toast.success("Delivery application draft saved locally.");
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
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        toast.error("Please fill in Legal Name, Email, and Phone Number.");
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        toast.error("Please enter a valid email address.");
        return false;
      }
    } else if (step === 2) {
      if (!formData.operating_city.trim() || !formData.address.trim() || !formData.pincode.trim()) {
        toast.error("Please provide your Address, City, and PIN code.");
        return false;
      }
    } else if (step === 3) {
      if (formData.vehicle_type !== "cycle" && !formData.driving_license_number.trim()) {
        toast.error("Driving License number is mandatory for motorized vehicles.");
        return false;
      }
    } else if (step === 4) {
      if (formData.vehicle_type !== "cycle" && !formData.driving_license) {
        toast.error("Please upload a scan of your Driving License.");
        return false;
      }
      if (!formData.id_proof) {
        toast.error("Please upload a valid Government Identity Proof (Aadhaar / Voter ID).");
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
      return toast.error("You must agree to the Good Distribution Practice fleet protocol.");
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vehicle_type: formData.vehicle_type,
        driving_license: formData.driving_license,
        id_proof: formData.id_proof,
        extra_details: {
          emergency_contact: formData.emergency_contact,
          vehicle_number: formData.vehicle_number,
          operating_city: formData.operating_city,
          preferred_zone: formData.preferred_zone,
          address: `${formData.address} - ${formData.pincode}`,
          driving_license_number: formData.driving_license_number,
          id_proof_number: formData.id_proof_number
        }
      };

      const res = await axios.post(`${API_URL}/onboarding/apply/delivery`, payload);
      toast.success("Delivery Partner application submitted successfully!");
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
    { num: 1, title: "Rider Details" },
    { num: 2, title: "Vehicle & Zone" },
    { num: 3, title: "Driving License" },
    { num: 4, title: "ID Uploads" },
    { num: 5, title: "Review & Agreement" }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-sans">
      {/* Header Banner */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
          <Truck className="h-4 w-4" />
          <span>Last-Mile Healthcare Logistics Fleet &bull; GDP Standards</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          Delivery Partner Registration
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Join the MedsZop temperature-controlled pharmaceutical dispatch fleet. All partners undergo identity and driving credential checks. Couriers receive thermal delivery bags and transparent per-order payouts.
        </p>
      </div>

      {/* Draft Alert */}
      {hasDraft && currentStep === 1 && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-emerald-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900">Unfinished Delivery Application Found</p>
              <p className="text-[11px] text-emerald-700">Resume where you previously left off.</p>
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
              Ensure information matches your driving license and government identity proof
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
            {/* STEP 1: Rider Details */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Legal Name (as per Aadhaar/DL) *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g. Vikram M. Shinde"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="vikram.shinde@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Mobile Phone (Primary) *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 98204 11290"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="emergency_contact">Emergency Contact Mobile</Label>
                    <Input
                      id="emergency_contact"
                      name="emergency_contact"
                      type="tel"
                      value={formData.emergency_contact}
                      onChange={handleInputChange}
                    />
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

            {/* STEP 2: Vehicle & Zone */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                    <select
                      id="vehicle_type"
                      name="vehicle_type"
                      value={formData.vehicle_type}
                      onChange={handleInputChange}
                      className="flex min-h-[44px] h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <option value="bike">Motorcycle / Scooter (Two-Wheeler)</option>
                      <option value="ev">Electric Two-Wheeler (EV)</option>
                      <option value="cycle">Bicycle (Hyperlocal Short-Haul)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="vehicle_number">Vehicle Registration Number (Plate No.)</Label>
                    <Input
                      id="vehicle_number"
                      name="vehicle_number"
                      placeholder="MH-02-DN-4921"
                      value={formData.vehicle_number}
                      onChange={handleInputChange}
                      className="font-mono uppercase text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="operating_city">Operating City *</Label>
                    <Input
                      id="operating_city"
                      name="operating_city"
                      value={formData.operating_city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="preferred_zone">Preferred Dispatch Hub / Sector</Label>
                    <Input
                      id="preferred_zone"
                      name="preferred_zone"
                      value={formData.preferred_zone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="address">Residential Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Room 14, Chawl 2, Bandra East, Mumbai"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pincode">PIN Code *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      placeholder="400051"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="font-mono"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Driving License */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="driving_license_number">Driving License (DL) Number *</Label>
                    <Input
                      id="driving_license_number"
                      name="driving_license_number"
                      placeholder="MH-02-2015009842"
                      value={formData.driving_license_number}
                      onChange={handleInputChange}
                      className="font-mono uppercase text-sm"
                      required={formData.vehicle_type !== "cycle"}
                    />
                    <p className="text-[11px] text-slate-500">
                      Must be a valid Two-Wheeler (MCWG) Indian driving license.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="id_proof_number">Aadhaar / Voter ID Number *</Label>
                    <Input
                      id="id_proof_number"
                      name="id_proof_number"
                      placeholder="XXXX-XXXX-XXXX"
                      value={formData.id_proof_number}
                      onChange={handleInputChange}
                      className="font-mono text-sm"
                      required
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
                    Upload clear smartphone photos or scans of your original documents. File size must be under 3MB (PDF, JPG, or PNG).
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="doc_dl" className="font-semibold text-slate-800">
                      Driving License Copy (Front &amp; Back) *
                    </Label>
                    {formData.driving_license ? (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <Check className="h-3 w-3" /> Attached
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-red-500 font-bold">Mandatory</span>
                    )}
                  </div>
                  <Input
                    id="doc_dl"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "driving_license")}
                    className="cursor-pointer file:cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="doc_id" className="font-semibold text-slate-800">
                      Government Identity Proof (Aadhaar / Voter ID) *
                    </Label>
                    {formData.id_proof ? (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <Check className="h-3 w-3" /> Attached
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-red-500 font-bold">Mandatory</span>
                    )}
                  </div>
                  <Input
                    id="doc_id"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "id_proof")}
                    className="cursor-pointer file:cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="doc_rc" className="font-semibold text-slate-800">
                      Vehicle Registration Certificate (RC)
                    </Label>
                    {formData.vehicle_rc && (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <Check className="h-3 w-3" /> Attached
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="doc_rc"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "vehicle_rc")}
                    className="cursor-pointer file:cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* STEP 5: Review & Agreement */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide">
                    Delivery Partner Application Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div><span className="text-slate-500">Name:</span> {formData.name}</div>
                    <div><span className="text-slate-500">Email:</span> {formData.email}</div>
                    <div><span className="text-slate-500">Mobile:</span> {formData.phone}</div>
                    <div><span className="text-slate-500">Vehicle:</span> {formData.vehicle_type.toUpperCase()} ({formData.vehicle_number || "N/A"})</div>
                    <div><span className="text-slate-500">Operating City:</span> {formData.operating_city}</div>
                    <div><span className="text-slate-500">Zone:</span> {formData.preferred_zone}</div>
                    <div><span className="text-slate-500">PIN Code:</span> {formData.pincode}</div>
                    <div><span className="text-slate-500">DL Number:</span> {formData.driving_license_number || "Bicycle"}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="del_terms_agreed"
                      name="terms_agreed"
                      checked={formData.terms_agreed}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, terms_agreed: checked }))
                      }
                      className="mt-0.5"
                    />
                    <label htmlFor="del_terms_agreed" className="text-xs text-slate-800 leading-relaxed cursor-pointer font-medium">
                      I agree to the MedsZop Fleet Logistics Protocol. I commit to handling sealed medical packages with integrity, using assigned insulated cold-chain bags where indicated, and strictly verifying the 4-digit customer handover OTP at the recipient doorstep. I acknowledge that fleet account activation requires identity and driving record verification.
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
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
                      <span>Submitting Registration...</span>
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

export default DeliveryOnboardingPage;

