import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { GlassCard, GlassButton } from "../components/glass";
import {
    Send,
    Loader2,
    Bot,
    User,
    Sparkles,
    AlertCircle,
    Stethoscope,
    ShieldAlert,
    ArrowRight
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AIDoctorPage = () => {
    const { t } = useTranslation(['consult', 'common']);
    const { token } = useAuth();
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hello! I'm Dr. MedsZop, your AI health assistant. I can help you with:\n\n• General health information\n• Medicine dosage guidance\n• Symptom awareness\n• Everyday wellness tips\n\n**Important:** I provide informational guidance only. Always consult a real healthcare professional for medical conditions.\n\nHow can I help you today?"
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = (behavior = "smooth") => {
        const doScroll = () => {
            if (scrollContainerRef.current) {
                // Direct scrollTop scroll to ensure bottom is fully reached
                scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
            }
        };

        // Scroll immediately, then after frame reflow and markdown rendering
        doScroll();
        requestAnimationFrame(doScroll);
        setTimeout(doScroll, 60);
        setTimeout(doScroll, 180);
        setTimeout(doScroll, 350);
    };

    useEffect(() => {
        scrollToBottom("smooth");
    }, [messages, loading]);

    // Use ResizeObserver on scroll container content to ensure chat auto-scrolls
    // whenever markdown content expands or dynamically renders
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        let resizeObserver;
        try {
            resizeObserver = new ResizeObserver(() => {
                if (container) {
                    // If user is reasonably close to the bottom (within 250px), auto-scroll down
                    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
                    if (isNearBottom) {
                        container.scrollTop = container.scrollHeight;
                    }
                }
            });
            if (container.firstElementChild) {
                resizeObserver.observe(container.firstElementChild);
            }
        } catch {
            // ResizeObserver fallback
        }

        return () => {
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, []);

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
        "What foods are good for immunity?",
        "Can I take ibuprofen on an empty stomach?"
    ];

    return (
        <div className="min-h-screen glass-ambient-mesh flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col">
                {/* Header Section */}
                <div className="mb-4 sm:mb-6 text-center">
                    <Badge className="mb-2 sm:mb-3 backdrop-blur-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-3.5 py-1 text-xs font-semibold rounded-full shadow-xs">
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        AI-Powered Self Help
                    </Badge>
                    <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        {t("consult:ai_chat.title")}
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto mt-1">
                        {t("consult:ai_chat.subtitle")}
                    </p>
                </div>

                {/* Main Chat Interface Container */}
                <GlassCard variant="elevated" className="flex-1 min-h-0 flex flex-col rounded-3xl overflow-hidden p-0 h-[620px] max-h-[calc(100dvh-220px)] min-h-[460px]">
                    <div className="border-b border-slate-200/60 dark:border-slate-800/60 py-3.5 px-4 sm:px-6 backdrop-blur-md bg-white/50 dark:bg-slate-900/50 shrink-0">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 shadow-xs">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-heading text-base sm:text-lg font-bold text-foreground">Dr. MedsZop (AI)</h2>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Always Available • Informational Guidance
                                    </p>
                                </div>
                            </div>
                            <Link to="/consult-doctor" className="hidden sm:inline-flex">
                                <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold h-8 gap-1.5 border-slate-200 dark:border-slate-800 backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 shadow-xs">
                                    <Stethoscope className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    {t("common:nav.consult_doctor")}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col p-0 overflow-hidden bg-slate-50/30 dark:bg-slate-950/30">
                        {/* Messages Scroll Area with Native Smooth Momentum Scrolling */}
                        <div
                            ref={scrollContainerRef}
                            className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 scroll-smooth overscroll-contain"
                            data-testid="chat-messages-container"
                        >
                            <div className="space-y-4 sm:space-y-5 max-w-3xl mx-auto">
                                {messages.map((message, index) => {
                                    const isUser = message.role === "user";
                                    return (
                                        <div
                                            key={index}
                                            className={`flex gap-2.5 sm:gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                                        >
                                            <div
                                                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                                                    isUser
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                                                }`}
                                            >
                                                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                            </div>
                                            <div
                                                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 shadow-xs break-words ${
                                                    isUser
                                                        ? "bg-primary text-primary-foreground rounded-tr-xs"
                                                        : message.error
                                                        ? "bg-destructive/10 border border-destructive/20 text-destructive rounded-tl-xs"
                                                        : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-foreground rounded-tl-xs"
                                                }`}
                                            >
                                                <div className="text-xs sm:text-sm markdown-content leading-relaxed">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {loading && (
                                    <div className="flex gap-2.5 sm:gap-3">
                                        <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-tl-xs px-4 py-3 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                                                <span>Dr. MedsZop is thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Suggested Topics Horizontal Pills */}
                        {messages.length <= 2 && (
                            <div className="px-3 sm:px-4 py-2 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                <div className="max-w-3xl mx-auto">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                                        Suggested Questions
                                    </p>
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                                        {quickQuestions.map((q, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-foreground hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active-press shrink-0 shadow-xs"
                                                onClick={() => {
                                                    setInput(q);
                                                    inputRef.current?.focus();
                                                }}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chat Input Bar */}
                        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="max-w-3xl mx-auto flex items-center gap-2 sm:gap-3">
                                <Input
                                    ref={inputRef}
                                    placeholder={t("consult:ai_chat.input_placeholder")}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={loading}
                                    className="h-12 rounded-2xl px-4 sm:px-5 shadow-xs border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus-visible:ring-emerald-500 text-foreground"
                                    data-testid="chat-input"
                                />
                                <GlassButton
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    variant="primary"
                                    size="icon"
                                    className="h-12 w-12 rounded-2xl shrink-0"
                                    data-testid="send-btn"
                                    aria-label="Send message"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                </GlassButton>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Medical Safety Disclaimer Callout */}
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/70 rounded-2xl text-xs max-w-4xl mx-auto w-full">
                    <div className="flex items-start gap-2.5">
                        <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-amber-900 dark:text-amber-200/90 leading-relaxed">
                            <strong className="font-semibold">Medical Disclaimer:</strong> Dr. MedsZop provides general educational guidance only. It is not a licensed physician and cannot prescribe or diagnose.
                        </p>
                    </div>
                    <Link to="/consult-doctor" className="shrink-0 self-end sm:self-center">
                        <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 p-0 sm:px-2 gap-1">
                            Speak with Doctor
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AIDoctorPage;
