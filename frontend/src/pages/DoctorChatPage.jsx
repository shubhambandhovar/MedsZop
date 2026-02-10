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
  AlertCircle
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

const DoctorChatPage = () => {
  const { t } = useTranslation();
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        content: t("doctor_chat.error_message"),
        error: true
      }]);
      toast.error(t("doctor_chat.failed_response"));
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
    t("doctor_chat.quick1"),
    t("doctor_chat.quick2"),
    t("doctor_chat.quick3"),
    t("doctor_chat.quick4")
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <div className="mb-6">
          <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 border-0">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            {t("doctor_chat.badge")}
          </Badge>
          <h1 className="font-heading text-3xl font-bold mb-2" data-testid="doctor-chat-title">
            {t("doctor_chat.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("doctor_chat.subtitle")}
          </p>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Bot className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="font-heading text-lg">{t("doctor_chat.bot_name")}</CardTitle>
                <p className="text-sm text-emerald-600 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t("doctor_chat.online")}
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
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === "user" 
                        ? "bg-primary text-white" 
                        : "bg-emerald-100"
                    }`}>
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : message.error
                        ? "bg-destructive/10 border border-destructive/20"
                        : "bg-muted"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                <p className="text-xs text-muted-foreground mb-2">{t("doctor_chat.quick_questions")}</p>
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
                  placeholder={t("doctor_chat.input_placeholder")}
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
            <strong>{t("doctor_chat.disclaimer_title")}</strong> {t("doctor_chat.disclaimer_body")}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DoctorChatPage;
