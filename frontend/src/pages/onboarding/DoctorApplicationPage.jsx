import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";

const API_URL = import.meta.env.VITE_API_URL;

const DoctorApplicationPage = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        registration_number: "",
        qualification: "",
        specialization: "",
        experience_years: "",
        consultation_type: "Chat",
        degree_certificate: "", // Base64
        medical_registration_proof: "", // Base64
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value) => {
        setFormData((prev) => ({ ...prev, consultation_type: value }));
    };

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit for base64 safety
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
            const res = await axios.post(`${API_URL}/onboarding/apply/doctor`, formData);
            toast.success("Application Submitted Successfully!");
            // Redirect to status page
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
                        <CardTitle className="text-2xl">Doctor Partner Application</CardTitle>
                        <CardDescription>Join MedsZop as a verified medical practitioner. Provide your details below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Personal Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" required placeholder="Dr. John Doe" onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required placeholder="john@example.com" onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" name="phone" required placeholder="+91 9876543210" onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* Professional Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="registration_number">Medical Registration Number</Label>
                                    <Input id="registration_number" name="registration_number" required placeholder="MCI-123456" onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="qualification">Qualification</Label>
                                    <Input id="qualification" name="qualification" required placeholder="MBBS, MD" onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="specialization">Specialization</Label>
                                    <Input id="specialization" name="specialization" required placeholder="Cardiologist" onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="experience_years">Years of Experience</Label>
                                    <Input id="experience_years" name="experience_years" type="number" required placeholder="5" onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Consultation Type</Label>
                                    <Select onValueChange={handleSelectChange} defaultValue="Chat">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Chat">Chat Only</SelectItem>
                                            <SelectItem value="Video">Video Only</SelectItem>
                                            <SelectItem value="Both">Both (Chat & Video)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="space-y-4 border p-4 rounded-md">
                                <h3 className="font-medium">Upload Documents (Max 2MB per file)</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="degree">Degree Certificate</Label>
                                    <Input id="degree" type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={(e) => handleFileChange(e, "degree_certificate")} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reg_proof">Medical Registration Proof</Label>
                                    <Input id="reg_proof" type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={(e) => handleFileChange(e, "medical_registration_proof")} />
                                </div>
                            </div>

                            {/* Declaration */}
                            <div className="flex items-center space-x-2">
                                <Checkbox id="terms" required />
                                <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    I declare that all information provided is true and correct.
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

export default DoctorApplicationPage;
