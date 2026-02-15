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
  Loader2,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  Stethoscope,
  Video,
  Clock
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";

const API_URL = import.meta.env.VITE_API_URL;

const DoctorChatPage = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm Dr. MedsZop, your AI health assistant. I can help you with:\n\n• General health information\n• Medicine dosage guidance\n• Symptom awareness\n• Health tips\n\n**Important:** I provide informational guidance only. Always consult a real healthcare professional for medical conditions.\n\nHow can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [symptoms, setSymptoms] = useState("");
  const [consultations, setConsultations] = useState([]); // Track user's consultations

  // Chat State
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatScrollRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axios.get(`${API_URL}/doctor/list`);
        setDoctors(res.data);
      } catch (err) {
        console.error("Failed to fetch doctors", err);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/ai/doctor-chat`, {
        message: userMessage,
        session_id: sessionId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.data.response
      }]);

      if (response.data.session_id) {
        setSessionId(response.data.session_id);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        error: true
      }]);
      toast.error("Failed to get response");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "What are the side effects of Paracetamol?",
    "How much water should I drink daily?",
    "I have a headache, what should I do?",
    "What foods are good for immunity?"
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <div className="mb-6">
          <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 border-0">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            AI-Powered
          </Badge>
          <h1 className="font-heading text-3xl font-bold mb-2" data-testid="doctor-chat-title">
            AI Doctor Chat
          </h1>
          <p className="text-muted-foreground">
            Get instant health guidance from our AI assistant
          </p>
        </div>

        <Tabs defaultValue="ai" className="flex-1 flex flex-col">
          <TabsList className="mb-4 w-full justify-start">
            <TabsTrigger value="ai" className="flex-1 md:flex-none">AI Assistant</TabsTrigger>
            <TabsTrigger value="human" className="flex-1 md:flex-none">Specialist Doctors</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="flex-1 flex flex-col data-[state=active]:flex">

            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="border-b py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="font-heading text-lg">Dr. MedsZop</CardTitle>
                    <p className="text-sm text-emerald-600 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${message.role === "user"
                          ? "bg-primary text-white"
                          : "bg-emerald-100"
                          }`}>
                          {message.role === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "user"
                          ? "bg-primary text-white"
                          : message.error
                            ? "bg-destructive/10 border border-destructive/20"
                            : "bg-muted"
                          }`}>
                          <div className="text-sm markdown-content max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="bg-muted rounded-2xl px-4 py-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Quick Questions */}
                {messages.length <= 2 && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {quickQuestions.map((q, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-auto py-1.5 rounded-full"
                          onClick={() => {
                            setInput(q);
                            inputRef.current?.focus();
                          }}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder="Type your health question..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                      className="h-12 rounded-xl"
                      data-testid="chat-input"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className="h-12 w-12 rounded-xl"
                      data-testid="send-btn"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="mt-4 flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-sm">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-amber-800 dark:text-amber-200">
                <strong>Disclaimer:</strong> This AI assistant provides general health information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.
              </p>
            </div>
          </TabsContent>

          {/* HUMAN DOCTORS TAB */}
          <TabsContent value="human">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No verified doctors available at the moment.
                </div>
              ) : doctors.map(doc => {
                const docConsultations = consultations.filter(c => (c.doctor_id?._id || c.doctor_id) === doc._id);
                // Sort descending just to be safe, though backend does it
                docConsultations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                const activeConsultation = docConsultations.find(c => ['PENDING', 'ACCEPTED'].includes(c.status));
                const lastCompleted = docConsultations.find(c => c.status === 'COMPLETED');

                return (
                  <Card key={doc._id} className="hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                        {doc.name[0]}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{doc.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{doc.specialization || "General Physician"}</p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Stethoscope className="h-4 w-4" />
                          <span>{doc.qualification || "MBBS"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{doc.experience_years || 1}+ Years Exp</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Video className="h-4 w-4" />
                          <span>Video / Chat</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* ACTIVE / PENDING STATUS & NEW REQUEST */}
                        {activeConsultation ? (
                          activeConsultation.status === 'ACCEPTED' ? (
                            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setSelectedChat(activeConsultation)}>
                              <MessageSquare className="w-4 h-4 mr-2" /> Chat Now
                            </Button>
                          ) : (
                            <Button className="w-full" variant="outline" disabled>Request Pending</Button>
                          )
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="w-full">Consult Now</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <h3 className="text-lg font-bold mb-2">Request Consultation</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                Describe your symptoms for {doc.name}.
                              </p>
                              <Textarea
                                placeholder="I have a fever and headache since yesterday..."
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                className="mb-4"
                              />
                              <Button onClick={() => handleConsultRequest(doc._id)} className="w-full">
                                Send Request
                              </Button>
                            </DialogContent>
                          </Dialog>
                        )}

                        {/* PAST HISTORY BUTTON */}
                        {lastCompleted && (
                          <Button className="w-full" variant="secondary" onClick={() => setSelectedChat(lastCompleted)}>
                            View Past Chat
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
              <DialogContent className="sm:max-w-md h-[500px] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Chat with {selectedChat?.doctor_id?.name || "Doctor"}</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-4 border rounded-md">
                  <div className="space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${msg.sender === 'patient' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                          <p>{msg.content}</p>
                          <span className="text-[10px] opacity-70 block text-right mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={chatScrollRef} />
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
          </TabsContent>
        </Tabs>
      </main >

      <Footer />
    </div >
  );
};

export default DoctorChatPage;
