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
    Send,
    Loader2,
    Bot,
    User,
    Sparkles,
    AlertCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

const AIDoctorPage = () => {
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

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

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
                <div className="mb-6 text-center">
                    <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 border-0">
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        AI-Powered Self Help
                    </Badge>
                    <h1 className="font-heading text-3xl font-bold mb-2">
                        AI Health Assistant
                    </h1>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Ask questions about symptoms, medicines, or general well-being.
                        <br />
                        <span className="text-amber-600 font-medium">Not a replacement for a real doctor.</span>
                    </p>
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden shadow-lg border-emerald-100 dark:border-emerald-900">
                    <CardHeader className="border-b py-4 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                                <Bot className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle className="font-heading text-lg">Dr. MedsZop (AI)</CardTitle>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Always Online
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
                        {/* Messages */}
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-6 max-w-3xl mx-auto">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                                    >
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${message.role === "user"
                                            ? "bg-primary text-white"
                                            : "bg-white border border-emerald-100 text-emerald-600"
                                            }`}>
                                            {message.role === "user" ? (
                                                <User className="h-4 w-4" />
                                            ) : (
                                                <Bot className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${message.role === "user"
                                            ? "bg-primary text-white rounded-tr-none"
                                            : message.error
                                                ? "bg-destructive/10 border border-destructive/20 text-destructive rounded-tl-none"
                                                : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-none"
                                            }`}>
                                            <div className="text-sm markdown-content max-w-none leading-relaxed">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex gap-3">
                                        <div className="h-8 w-8 rounded-full bg-white border border-emerald-100 flex items-center justify-center">
                                            <Bot className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none px-5 py-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                                                <span className="text-sm text-muted-foreground">Thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Quick Questions */}
                        {messages.length <= 2 && (
                            <div className="px-4 pb-4 max-w-3xl mx-auto w-full">
                                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Suggested Topics</p>
                                <div className="flex flex-wrap gap-2">
                                    {quickQuestions.map((q, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-auto py-2 px-3 rounded-full bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all font-normal"
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
                        <div className="p-4 bg-white dark:bg-slate-900 border-t">
                            <div className="max-w-3xl mx-auto flex gap-3">
                                <Input
                                    ref={inputRef}
                                    placeholder="Type your health question here..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={loading}
                                    className="h-12 rounded-full px-6 shadow-sm border-slate-200 hover:border-emerald-300 focus:border-emerald-500 transition-all"
                                    data-testid="chat-input"
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    className="h-12 w-12 rounded-full shrink-0 bg-emerald-600 hover:bg-emerald-700"
                                    data-testid="send-btn"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Disclaimer */}
                <div className="mt-6 flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-xl text-sm max-w-3xl mx-auto w-full">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="font-semibold text-amber-800 dark:text-amber-200">
                            Medical Disclaimer
                        </p>
                        <p className="text-amber-700 dark:text-amber-300/80 leading-relaxed">
                            Dr. MedsZop is an AI assistant, not a human doctor. It cannot diagnose diseases, prescribe medication, or provide official medical advice.
                            <br />
                            <strong>If you feel unwell, please use the "Consult a Doctor" feature to speak with a verified specialist.</strong>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AIDoctorPage;
