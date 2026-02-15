import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const ApplicationStatusPage = () => {
    const { id } = useParams();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await axios.get(`${API_URL}/onboarding/status/${id}`);
                setApplication(res.data);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load application status");
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    const getStatusIcon = (status) => {
        switch (status) {
            case "APPROVED": return <CheckCircle className="h-12 w-12 text-green-500" />;
            case "REJECTED": return <XCircle className="h-12 w-12 text-red-500" />;
            default: return <Clock className="h-12 w-12 text-yellow-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "APPROVED": return "bg-green-100 text-green-800";
            case "REJECTED": return "bg-red-100 text-red-800";
            default: return "bg-yellow-100 text-yellow-800";
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container max-w-2xl mx-auto py-16 px-4">
                <Card className="text-center py-8">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            {getStatusIcon(application.status)}
                        </div>
                        <CardTitle className="text-3xl font-bold">Application Status</CardTitle>
                        <CardDescription>Tracking ID: <span className="font-mono">{id}</span></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="bg-muted p-4 rounded-lg inline-block min-w-[300px]">
                            <p className="text-sm text-muted-foreground mb-1">Applicant Name</p>
                            <p className="font-semibold text-lg">{application.applicant_name}</p>

                            <div className="my-3 border-t border-gray-200"></div>

                            <p className="text-sm text-muted-foreground mb-1">Role Applied</p>
                            <p className="font-semibold">{application.role}</p>

                            <div className="my-3 border-t border-gray-200"></div>

                            <p className="text-sm text-muted-foreground mb-1">Current Status</p>
                            <Badge className={`text-base px-4 py-1 mt-1 ${getStatusColor(application.status)}`}>
                                {application.status}
                            </Badge>
                        </div>

                        {application.status === "PENDING" && (
                            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-md text-left max-w-md mx-auto">
                                <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-blue-900">Under Review</h4>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Your application is currently being reviewed by our admin team. You will receive an email update once a decision is made.
                                    </p>
                                </div>
                            </div>
                        )}

                        {application.status === "APPROVED" && (
                            <div className="flex items-start gap-3 bg-green-50 p-4 rounded-md text-left max-w-md mx-auto">
                                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-green-900">Congratulations!</h4>
                                    <p className="text-sm text-green-700 mt-1">
                                        Your application has been approved. Please check your email for login credentials.
                                    </p>
                                </div>
                            </div>
                        )}

                        {application.status === "REJECTED" && (
                            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-md text-left max-w-md mx-auto">
                                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-red-900">Application Rejected</h4>
                                    <p className="text-sm text-red-700 mt-1">
                                        Reason: {application.rejection_reason || "Requirements not met."}
                                    </p>
                                    <p className="text-sm text-red-700 mt-2">
                                        Please modify your application and try again via the application form.
                                    </p>
                                </div>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </main>

            <Footer />
        </div>
    );
};

export default ApplicationStatusPage;
