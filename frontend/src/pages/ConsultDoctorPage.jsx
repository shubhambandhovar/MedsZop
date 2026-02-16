import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import {
    MessageSquare,
    Send,
    User,
    Stethoscope,
    Video,
    Clock,
    UserCheck,
    CalendarCheck
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";

const API_URL = import.meta.env.VITE_API_URL;

const ConsultDoctorPage = () => {
    const { token } = useAuth();
    const [doctors, setDoctors] = useState([]);
    const [symptoms, setSymptoms] = useState("");
    const [consultations, setConsultations] = useState([]); // Track user's consultations
    const [loadingDocs, setLoadingDocs] = useState(true);

    // Chat State
    const [selectedChat, setSelectedChat] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const chatScrollRef = useRef(null);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await axios.get(`${API_URL}/doctor/list`);
                setDoctors(res.data);
            } catch (err) {
                console.error("Failed to fetch doctors", err);
            } finally {
                setLoadingDocs(false);
            }
        };
        fetchDoctors();

        let interval;
        if (token) {
            fetchConsultations();
            interval = setInterval(fetchConsultations, 3000); // Poll every 3 seconds for status updates
        }
        return () => clearInterval(interval);
    }, [token]);

    const fetchConsultations = async () => {
        try {
            const res = await axios.get(`${API_URL}/doctor/my-consultations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConsultations(res.data);
        } catch (err) {
            console.error("Failed fetch consultations");
        }
    };

    // Chat Logic
    const fetchChatMessages = async (id) => {
        try {
            const res = await axios.get(`${API_URL}/doctor/consultation/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChatMessages(res.data.messages || []);
        } catch (err) {
            console.error("Failed to fetch messages", err);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            const res = await axios.post(`${API_URL}/doctor/consultation/${selectedChat._id}/chat`, {
                message: newMessage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChatMessages(res.data.messages || []);
            setNewMessage("");
        } catch (err) {
            toast.error("Failed to send message");
        }
    };

    useEffect(() => {
        let interval;
        if (selectedChat) {
            fetchChatMessages(selectedChat._id);
            interval = setInterval(() => fetchChatMessages(selectedChat._id), 3000);
        }
        return () => clearInterval(interval);
    }, [selectedChat]);

    useEffect(() => {
        chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const handleConsultRequest = async (doctorId) => {
        if (!token) return toast.error("Please login to consulting a doctor");
        if (!symptoms) return toast.error("Please describe your symptoms");

        try {
            await axios.post(`${API_URL}/doctor/consult`, {
                doctor_id: doctorId,
                symptoms
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Consultation requested! The doctor will review shortly.");
            setSymptoms("");
            fetchConsultations(); // Refresh status
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to request consultation");
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <div className="text-center md:text-left">
                        <Badge className="mb-4 bg-blue-500/10 text-blue-600 border-0">
                            <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                            Verified Specialists
                        </Badge>
                        <h1 className="font-heading text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">
                            Consult a Doctor
                        </h1>
                        <p className="text-muted-foreground max-w-xl">
                            Connect with top specialists for diagnosis, prescriptions, and medical advice via chat or video call.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="gap-2">
                            <CalendarCheck className="h-4 w-4" />
                            My Consultations
                        </Button>
                    </div>
                </div>

                {/* Doctor Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loadingDocs ? (
                        <div className="col-span-full py-20 flex justify-center text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                                Loading Doctors...
                            </div>
                        </div>
                    ) : doctors.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl border-slate-200">
                            No verified doctors available at the moment.
                        </div>
                    ) : doctors.map(doc => {
                        const docConsultations = consultations.filter(c => (c.doctor_id?._id || c.doctor_id) === doc._id);
                        // Sort descending just to be safe, though backend does it
                        docConsultations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                        const activeConsultation = docConsultations.find(c => ['PENDING', 'ACCEPTED'].includes(c.status));
                        const lastCompleted = docConsultations.find(c => c.status === 'COMPLETED');

                        return (
                            <Card key={doc._id} className="hover:shadow-lg transition-all group border-slate-200 dark:border-slate-800">
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-2xl border border-blue-100 shadow-sm group-hover:scale-105 transition-transform">
                                        {doc.name[0]}
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors">{doc.name}</CardTitle>
                                        <p className="text-sm font-medium text-emerald-600 flex items-center gap-1 mt-0.5">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                            Available Now
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                            <Stethoscope className="h-4 w-4 text-primary shrink-0" />
                                            <span className="font-medium">{doc.specialization || "General Physician"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                            <Clock className="h-4 w-4 text-primary shrink-0" />
                                            <span>{doc.experience_years || 1}+ Years Experience</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                            <Video className="h-4 w-4 text-primary shrink-0" />
                                            <span>Video & Chat Consultation</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {/* ACTIVE / PENDING STATUS & NEW REQUEST */}
                                        {activeConsultation ? (
                                            activeConsultation.status === 'ACCEPTED' ? (
                                                <div className="flex gap-2">
                                                    <Button className="flex-1 bg-green-600 hover:bg-green-700 shadow-sm" onClick={() => setSelectedChat(activeConsultation)}>
                                                        <MessageSquare className="w-4 h-4 mr-2" /> Resume Chat
                                                    </Button>
                                                    <Button className="flex-1 border-slate-300" variant="outline" onClick={() => window.open(`/video-call/${activeConsultation._id}`, '_blank')}>
                                                        <Video className="w-4 h-4 mr-2" /> Join Video
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button className="w-full bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200" variant="ghost" disabled>
                                                    <Clock className="w-4 h-4 mr-2 animate-pulse" /> Consulting Request Pending
                                                </Button>
                                            )
                                        ) : (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm font-medium h-11">
                                                        Book Consultation
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Consult with {doc.name}</DialogTitle>
                                                    </DialogHeader>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        Please describe your symptoms briefly. The doctor will review and accept your request shortly.
                                                    </p>
                                                    <Textarea
                                                        placeholder="I have a fever and headache since yesterday..."
                                                        value={symptoms}
                                                        onChange={(e) => setSymptoms(e.target.value)}
                                                        className="mb-4 min-h-[120px]"
                                                    />
                                                    <div className="bg-blue-50 p-3 rounded-md mb-4 text-xs text-blue-700 leading-relaxed">
                                                        Note: Consultation fees may apply. By proceeding, you agree to share your limited health data with the doctor.
                                                    </div>
                                                    <Button onClick={() => handleConsultRequest(doc._id)} className="w-full">
                                                        Send Request
                                                    </Button>
                                                </DialogContent>
                                            </Dialog>
                                        )}

                                        {/* PAST HISTORY BUTTON */}
                                        {lastCompleted && (
                                            <Button className="w-full" variant="ghost" onClick={() => setSelectedChat(lastCompleted)}>
                                                View Past Consultation
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* CHAT DIALOG */}
                <Dialog open={!!selectedChat} onOpenChange={(o) => !o && setSelectedChat(null)}>
                    <DialogContent className="sm:max-w-md h-[600px] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
                        <DialogHeader className="p-4 border-b bg-slate-50 dark:bg-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 text-xs rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                                    {selectedChat?.doctor_id?.name?.[0] || "D"}
                                </div>
                                <div>
                                    <DialogTitle className="text-base">{selectedChat?.doctor_id?.name || "Doctor"}</DialogTitle>
                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Active Session
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>

                        <ScrollArea className="flex-1 p-4 bg-slate-50/30">
                            <div className="space-y-4">
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.sender === 'patient' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-slate-700 rounded-bl-none'
                                            }`}>
                                            <p>{msg.content}</p>
                                            <span className={`text-[10px] block text-right mt-1 ${msg.sender === 'patient' ? 'text-blue-200' : 'text-slate-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatScrollRef} />
                            </div>
                        </ScrollArea>

                        <div className="p-3 bg-white border-t">
                            <div className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="h-11 rounded-full border-slate-200 focus:border-blue-500"
                                />
                                <Button onClick={handleSendMessage} size="icon" className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 shrink-0">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

            </main>

            <Footer />
        </div>
    );
};

export default ConsultDoctorPage;
