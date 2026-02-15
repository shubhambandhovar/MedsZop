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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const API_URL = import.meta.env.VITE_API_URL;

const DeliveryApplicationPage = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        vehicle_type: "bike",
        driving_license: "", // Base64
        id_proof: "", // Base64
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value) => {
        setFormData((prev) => ({ ...prev, vehicle_type: value }));
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
            const res = await axios.post(`${API_URL}/onboarding/apply/delivery`, formData);
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
                        <CardTitle className="text-2xl">Delivery Partner Application</CardTitle>
                        <CardDescription>Become a MedsZop delivery hero.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" required placeholder="John Doe" onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required placeholder="john@example.com" onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" name="phone" required placeholder="+91 9876543210" onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Vehicle Type</Label>
                                    <Select onValueChange={handleSelectChange} defaultValue="bike">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select vehicle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bike">Bike / Scooter</SelectItem>
                                            <SelectItem value="cycle">Bicycle</SelectItem>
                                            <SelectItem value="van">Van / Car</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4 border p-4 rounded-md">
                                <h3 className="font-medium">Upload Documents (Max 2MB per file)</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="license">Driving License</Label>
                                    <Input id="license" type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={(e) => handleFileChange(e, "driving_license")} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="id_proof">ID Proof (Aadhar/PAN/Voter)</Label>
                                    <Input id="id_proof" type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={(e) => handleFileChange(e, "id_proof")} />
                                </div>
                            </div>

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

export default DeliveryApplicationPage;
