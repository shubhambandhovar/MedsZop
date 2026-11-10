import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <Badge className="mb-2.5 bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-3 py-1 rounded-full">
              <UserCheck className="h-3.5 w-3.5 mr-1.5" />
              Verified Healthcare Specialists
            </Badge>
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Consult a Doctor
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mt-1 leading-relaxed">
              Connect with verified medical specialists for diagnosis, guidance, and prescriptions via encrypted chat or high-definition video call.
            </p>
          </div>

          {consultations.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Badge variant="outline" className="text-xs font-medium px-3 py-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-card gap-1.5">
                <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                {consultations.length} {consultations.length === 1 ? "Consultation" : "Consultations"}
              </Badge>
            </div>
          )}
        </div>

        {/* Doctor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingDocs ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              <p className="text-sm font-medium">Connecting to verified doctor directory...</p>
            </div>
          ) : doctors.length === 0 ? (
            <Card className="col-span-full text-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg mx-auto">
              <CardContent className="space-y-3">
                <Stethoscope className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                <h3 className="font-heading font-bold text-lg text-foreground">No Doctors Currently Available</h3>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Our specialists are currently offline or in consultations. Please check back shortly or consult with our AI Health Assistant in the meantime.
                </p>
              </CardContent>
            </Card>
          ) : (
            doctors.map((doc) => {
              const docConsultations = consultations.filter(
                (c) => (c.doctor_id?._id || c.doctor_id) === doc._id
              );
              docConsultations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

              const activeConsultation = docConsultations.find((c) =>
                ["PENDING", "ACCEPTED"].includes(c.status)
              );
              const lastCompleted = docConsultations.find((c) => c.status === "COMPLETED");

              return (
                <Card
                  key={doc._id}
                  className="rounded-3xl border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-200 group overflow-hidden bg-card flex flex-col justify-between"
                >
                  <div>
                    <CardHeader className="flex flex-row items-center gap-3.5 sm:gap-4 p-5 pb-3">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-heading font-extrabold text-xl border border-primary/20 shrink-0 group-hover:scale-105 transition-transform">
                        {doc.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {doc.name}
                        </CardTitle>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                          Available Now
                        </p>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-2">
                      <div className="space-y-2.5 mb-5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                          <Stethoscope className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-semibold text-foreground truncate">
                            {doc.specialization || "General Physician"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                          <Clock className="h-4 w-4 text-primary shrink-0" />
                          <span>{doc.experience_years || 1}+ Years Clinical Practice</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                          <Video className="h-4 w-4 text-primary shrink-0" />
                          <span>HD Video & Encrypted Chat</span>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <CardContent className="p-5 pt-0 space-y-2.5">
                    {/* Active / Pending Status & New Request Actions */}
                    {activeConsultation ? (
                      activeConsultation.status === "ACCEPTED" ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm h-11 active-press"
                            onClick={() => setSelectedChat(activeConsultation)}
                          >
                            <MessageSquare className="w-4 h-4 mr-1.5" /> Resume Chat
                          </Button>
                          <Button
                            className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm h-11 active-press"
                            variant="outline"
                            onClick={() => window.open(`/video-call/${activeConsultation._id}`, "_blank")}
                          >
                            <Video className="w-4 h-4 mr-1.5 text-primary" /> Join Video
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="w-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl font-semibold text-xs sm:text-sm h-11 cursor-not-allowed"
                          variant="ghost"
                          disabled
                        >
                          <Clock className="w-4 h-4 mr-1.5 animate-pulse text-amber-600" /> Request Pending Doctor Review
                        </Button>
                      )
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm h-11 active-press shadow-xs">
                            Book Consultation
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md w-full max-h-[90dvh] rounded-3xl p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
                          <DialogHeader className="pb-2">
                            <DialogTitle className="font-heading text-lg sm:text-xl font-bold">
                              Consult with {doc.name}
                            </DialogTitle>
                          </DialogHeader>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed">
                            Describe your primary symptoms and how long you have experienced them. The doctor will review your request and accept the session.
                          </p>
                          <Textarea
                            placeholder="e.g. Mild fever, dry cough, and headache since yesterday evening..."
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            className="mb-4 min-h-[110px] rounded-xl text-sm p-3.5 focus-visible:ring-primary"
                          />
                          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-3 rounded-xl mb-4 text-xs text-primary leading-relaxed flex items-start gap-2">
                            <UserCheck className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>By submitting, you agree to share your brief health notes with this licensed specialist under medical confidentiality.</span>
                          </div>
                          <Button
                            onClick={() => handleConsultRequest(doc._id)}
                            className="w-full h-11 rounded-xl font-bold text-sm active-press"
                          >
                            Submit Consultation Request
                          </Button>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Past Completed History */}
                    {lastCompleted && (
                      <Button
                        className="w-full text-xs text-muted-foreground hover:text-foreground rounded-xl h-9"
                        variant="ghost"
                        onClick={() => setSelectedChat(lastCompleted)}
                      >
                        View Past Consultation Notes
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Encrypted Consultation Chat Dialog */}
        <Dialog open={!!selectedChat} onOpenChange={(o) => !o && setSelectedChat(null)}>
          <DialogContent className="sm:max-w-md w-full h-[min(620px,85dvh)] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
            <DialogHeader className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 text-xs rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shrink-0">
                    {selectedChat?.doctor_id?.name?.[0] || "D"}
                  </div>
                  <div>
                    <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                      {selectedChat?.doctor_id?.name || "Doctor"}
                    </DialogTitle>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Encrypted Session
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold h-8 gap-1.5"
                  onClick={() => window.open(`/video-call/${selectedChat._id}`, "_blank")}
                >
                  <Video className="h-3.5 w-3.5 text-primary" />
                  Video Call
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-slate-50/30 dark:bg-slate-950/30">
              <div className="space-y-3.5">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    Connected. Type a message below to chat with your doctor.
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs break-words ${
                          msg.sender === "patient"
                            ? "bg-primary text-primary-foreground rounded-tr-xs"
                            : "bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-foreground rounded-tl-xs"
                        }`}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        <span
                          className={`text-[10px] block text-right mt-1 ${
                            msg.sender === "patient" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatScrollRef} />
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message to your doctor..."
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="h-11 rounded-2xl text-xs sm:text-sm px-4 border-slate-200 dark:border-slate-800 focus-visible:ring-primary text-foreground"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="h-11 w-11 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 active-press"
                  aria-label="Send message to doctor"
                >
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
