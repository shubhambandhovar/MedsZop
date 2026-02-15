import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";

const API_URL = import.meta.env.VITE_API_URL;

const PharmacistApplicationPage = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        owner_name: "",
        email: "",
        phone: "",
        pharmacy_name: "",
        license_number: "",
        address: "",
        pharmacy_license: "", // Base64
        gst_certificate: "", // Base64 (Optional)
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("File size must be less than 2MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({ ...prev, [fieldName]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/onboarding/apply/pharmacist`, formData);
            toast.success("Application Submitted Successfully!");
            window.location.href = `/application-status/${res.data.applicationId}`;
        } catch (err) {
            toast.error(err.response?.data?.message || "Application submission failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container max-w-3xl mx-auto py-10 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Pharmacist Partner Application</CardTitle>
                        <CardDescription>Register your pharmacy with MedsZop.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Owner Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="owner_name">Owner Name</Label>
                                    <Input id="owner_name" name="owner_name" required placeholder="Jane Doe" onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required placeholder="jane@pharmacy.com" onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" name="phone" required placeholder="+91 9876543210" onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* Pharmacy Details */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pharmacy_name">Pharmacy Name</Label>
                                    <Input id="pharmacy_name" name="pharmacy_name" required placeholder="MedsZop Health Store" onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="license_number">Drug License Number</Label>
                                    <Input id="license_number" name="license_number" required placeholder="DL-123456" onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input id="address" name="address" required placeholder="123, Main St, City" onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="space-y-4 border p-4 rounded-md">
                                <h3 className="font-medium">Upload Documents (Max 2MB per file)</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="pharmacy_license">Pharmacy License Copy</Label>
                                    <Input id="pharmacy_license" type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={(e) => handleFileChange(e, "pharmacy_license")} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gst">GST Certificate (Optional)</Label>
                                    <Input id="gst" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, "gst_certificate")} />
                                </div>
                            </div>

                            {/* Declaration */}
                            <div className="flex items-center space-x-2">
                                <Checkbox id="terms" required />
                                <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    I agree to the MedsZop Partner Terms & Conditions.
                                </label>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Submitting..." : "Submit Application"}
                            </Button>

                        </form>
                    </CardContent>
                </Card>
            </main>

            <Footer />
        </div>
    );
};

export default PharmacistApplicationPage;
