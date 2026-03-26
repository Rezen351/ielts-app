'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User,
  X,
  Languages,
  RefreshCw,
  Globe,
  ChevronDown,
  AlertCircle
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translatedContent?: string;
  isTranslated?: boolean;
  timestamp: Date;
}

interface ChatWidgetProps {
  context?: string;
}

export default function ChatWidget({ context }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your IELTS Study Assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [nativeLang, setNativeLang] = useState('id');
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [isExamMode, setIsExamMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is on an exam/practice page
    const checkPath = () => {
      const path = window.location.pathname;
      setIsExamMode(path.includes('/practice') || path.includes('/exam'));
    };
    
    checkPath();
    const storedLang = localStorage.getItem('ielts-native-lang');
    if (storedLang) setNativeLang(storedLang);

    // Listen for custom event to open chat
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-ielts-chat', handleOpenChat);

    window.addEventListener('popstate', checkPath);
    return () => {
      window.removeEventListener('popstate', checkPath);
      window.removeEventListener('open-ielts-chat', handleOpenChat);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleTranslate = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.role !== 'assistant') return;

    if (message.translatedContent) {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isTranslated: !m.isTranslated } : m));
      return;
    }

    setTranslatingId(messageId);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.content, targetLang: nativeLang }),
      });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, translatedContent: data.translatedText, isTranslated: true } : m));
      }
    } catch (err) {
      toast.error("Translation error");
    } finally {
      setTranslatingId(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat/ielts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map(m => ({ role: m.role, content: m.content })),
          context: context || ""
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date()
        }]);
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 z-50 transition-all hover:scale-110 active:scale-95 group"
      >
        <MessageSquare className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        {isExamMode && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 md:bottom-6 w-[calc(100%-32px)] sm:w-[380px] h-[600px] max-h-[85vh] flex flex-col z-50 animate-in slide-in-from-bottom-5 duration-300">
      <Card className="flex-1 flex flex-col shadow-2xl border-slate-200 overflow-hidden bg-white rounded-3xl relative">
        <header className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">IELTS Tutor</h3>
              <p className="text-[10px] opacity-70 font-medium">Online for your assistance</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 rounded-full h-8 w-8">
              <ChevronDown className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {isExamMode && (
          <div className="bg-red-50 p-2 px-4 border-b border-red-100 flex items-center gap-2 text-[10px] font-bold text-red-600 uppercase tracking-widest shrink-0">
            <AlertCircle className="w-3 h-3" /> Exam Mode Active: Ask for tips only!
          </div>
        )}

        <div className="flex-1 relative min-h-0 bg-slate-50/30">
          <div className="absolute inset-0 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className={`h-8 w-8 border ${m.role === 'assistant' ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <AvatarFallback className="text-[10px]">
                    {m.role === 'assistant' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-slate-500" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[85%] space-y-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {m.role === 'assistant' && (
                    <button 
                      onClick={() => handleTranslate(m.id)}
                      className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-colors px-1 ${
                        m.isTranslated ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'
                      }`}
                    >
                      {translatingId === m.id ? <RefreshCw className="w-2 h-2 animate-spin" /> : <Languages className="w-2 h-2" />}
                      {m.isTranslated ? 'English' : 'Terjemahkan'}
                    </button>
                  )}
                  <div className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                    m.role === 'assistant' 
                      ? "bg-white text-slate-800 rounded-tl-none border border-slate-100" 
                      : "bg-blue-600 text-white rounded-tr-none"
                  }`}>
                    {m.isTranslated && m.translatedContent && (
                      <div className="mb-1 pb-1 border-b border-blue-50 text-blue-600 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                        <Globe className="w-2 h-2" /> ID
                      </div>
                    )}
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        ul: ({ children }) => <ul className="list-disc ml-4 space-y-1 my-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-4 space-y-1 my-1">{children}</ol>,
                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-blue-700">{children}</strong>,
                      }}
                    >
                      {m.isTranslated && m.translatedContent ? m.translatedContent : m.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 items-start animate-pulse">
                <Avatar className="h-8 w-8 bg-blue-600"><AvatarFallback><Bot className="w-4 h-4 text-white" /></AvatarFallback></Avatar>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1">
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        <CardFooter className="p-4 border-t border-slate-100 bg-white shrink-0">
          <div className="flex w-full gap-2 relative">
            <Input 
              placeholder="Ask me anything..." 
              className="flex-1 h-11 rounded-xl border-slate-100 bg-slate-50 pr-12 text-sm focus-visible:ring-blue-600"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <Button 
              size="icon" 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-1.5 top-1.5 h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 shadow-md"
            >
              <Send className="w-3 h-3 text-white" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
