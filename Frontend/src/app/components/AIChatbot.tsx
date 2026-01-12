import { useState } from 'react';
import { X, Send, Bot, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Language } from '../types';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface AIChatbotProps {
  onClose: () => void;
  language: Language;
}

export function AIChatbot({ onClose, language }: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text:
        language === 'en'
          ? 'Hello! I\'m your MedsZop AI assistant. How can I help you today?'
          : 'नमस्ते! मैं आपका मेड्सज़ॉप AI सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const quickResponses = language === 'en'
    ? [
        'Track my order',
        'Medicine availability',
        'Upload prescription',
        'Talk to pharmacist',
      ]
    : [
        'मेरा ऑर्डर ट्रैक करें',
        'दवा की उपलब्धता',
        'प्रिस्क्रिप्शन अपलोड करें',
        'फार्मासिस्ट से बात करें',
      ];

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputMessage;
    if (!messageText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text:
          language === 'en'
            ? `I understand you're asking about "${messageText}". Our team is working on this feature. For immediate assistance, please call our helpline at 1800-123-4567.`
            : `मैं समझता हूं कि आप "${messageText}" के बारे में पूछ रहे हैं। हमारी टीम इस सुविधा पर काम कर रही है। तत्काल सहायता के लिए, कृपया हमारी हेल्पलाइन 1800-123-4567 पर कॉल करें।`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed bottom-0 left-0 right-0 top-16 md:bottom-4 md:left-auto md:right-4 md:top-auto md:h-[600px] md:w-[400px]">
        <Card className="h-full shadow-2xl">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-[var(--health-blue)] to-[var(--trust-blue)] p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {language === 'en' ? 'AI Health Assistant' : 'AI स्वास्थ्य सहायक'}
                  </h3>
                  <p className="text-xs opacity-90">
                    {language === 'en' ? 'Online 24/7' : 'ऑनलाइन 24/7'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        message.sender === 'user'
                          ? 'bg-[var(--health-blue)]'
                          : 'bg-[var(--health-green)]'
                      }`}
                    >
                      {message.sender === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-[var(--health-blue)] text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`mt-1 text-xs ${
                          message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Quick Responses */}
            <div className="border-t p-3">
              <div className="flex flex-wrap gap-2">
                {quickResponses.map((response, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(response)}
                    className="rounded-full text-xs"
                  >
                    {response}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder={
                    language === 'en' ? 'Type your message...' : 'अपना संदेश लिखें...'
                  }
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim()}
                  className="bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)]"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
