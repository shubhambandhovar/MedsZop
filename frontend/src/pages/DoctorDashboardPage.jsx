import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { useAuth } from "../contexts/AuthContext";
import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { CheckCircle, XCircle, Clock, Video, MessageSquare, Send } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const DoctorDashboardPage = () => {
    const { token } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Chat State
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef(null);

    const fetchAppointments = async () => {
        try {
            const res = await axios.get(`${API_URL}/doctor/appointments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(res.data);
        } catch (err) {
            toast.error("Failed to load appointments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [token]);

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.put(`${API_URL}/doctor/appointments/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Appointment ${status}`);
            fetchAppointments();
        } catch (err) {
            toast.error("Update failed");
        }
    };

    // Chat Functions
    const fetchMessages = async (id) => {
        try {
            const res = await axios.get(`${API_URL}/doctor/consultation/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data.messages || []);
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
            setMessages(res.data.messages || []);
            setNewMessage("");
        } catch (err) {
            toast.error("Failed to send message");
        }
    };

    useEffect(() => {
        let interval;
        if (selectedChat) {
            fetchMessages(selectedChat._id);
            interval = setInterval(() => fetchMessages(selectedChat._id), 3000);
        }
        return () => clearInterval(interval);
    }, [selectedChat]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (loading) return <div className="h-screen flex items-center justify-center">Loading Doctor Dashboard...</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            <main className="flex-1 container py-8 px-4 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
                    <p className="text-gray-500">Manage your consultations and patients.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Consultations</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{appointments.length}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{appointments.filter(a => a.status === 'PENDING').length}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{appointments.filter(a => a.status === 'COMPLETED').length}</div></CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Appointments</CardTitle>
                        <CardDescription>Your upcoming and past consultations.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Symptoms</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointments.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center">No appointments yet.</TableCell></TableRow>
                                ) : appointments.map((appt) => (
                                    <TableRow key={appt._id}>
                                        <TableCell>
                                            <div className="font-medium">{appt.patient_id?.name || "Unknown"}</div>
                                            <div className="text-xs text-muted-foreground">{appt.patient_id?.email}</div>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{appt.symptoms}</TableCell>
                                        <TableCell>{new Date(appt.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                appt.status === 'APPROVED' ? 'success' :
                                                    appt.status === 'PENDING' ? 'secondary' : 'default'
                                            }>
                                                {appt.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {appt.status === 'PENDING' && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => handleStatusUpdate(appt._id, 'ACCEPTED')}>Accept</Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(appt._id, 'REJECTED')}>Reject</Button>
                                                </div>
                                            )}
                                            {appt.status === 'ACCEPTED' && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => setSelectedChat(appt)}>
                                                        <MessageSquare className="w-4 h-4 mr-1" /> Chat
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => window.open('/video-call-placeholder', '_blank')}>
                                                        <Video className="w-4 h-4 mr-1" /> Start Video
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>

            {/* CHAT DIALOG */}
            <Dialog open={!!selectedChat} onOpenChange={(o) => !o && setSelectedChat(null)}>
                <DialogContent className="sm:max-w-md h-[500px] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Chat with {selectedChat?.patient_id?.name}</DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="flex-1 p-4 border rounded-md">
                        <div className="space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${msg.sender === 'doctor' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                        }`}>
                                        <p>{msg.content}</p>
                                        <span className="text-[10px] opacity-70 block text-right mt-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="flex gap-2 mt-4">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button onClick={handleSendMessage} size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
};

export default DoctorDashboardPage;
