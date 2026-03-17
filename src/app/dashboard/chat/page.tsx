'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  MessageSquare, 
  ArrowLeft, 
  Send, 
  Bot, 
  User,
  Sparkles,
  Info,
  BookOpen
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your IELTS Study Assistant. How can I help you today? You can ask me about grammar, vocabulary, or tips for any IELTS module.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
          messages: messages.concat(userMessage).map(m => ({
            role: m.role,
            content: m.content
          }))
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
      } else {
        toast.error("Assistant error", { description: data.message });
      }
    } catch (err) {
      toast.error("Network error", { description: "Failed to connect to AI assistant." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col h-screen overflow-hidden">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:px-8 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">IELTS Tutor AI</h1>
          </div>
        </div>
        <Badge variant="outline" className="border-blue-100 text-blue-600 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">
          Active Session
        </Badge>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full p-4 md:p-8">
        <Card className="flex-1 flex flex-col border-slate-200 shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-white">
          <ScrollArea className="flex-1 p-6 md:p-8">
            <div className="space-y-6">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className={`h-9 w-9 border ${m.role === 'assistant' ? 'bg-blue-600 border-blue-500' : 'bg-slate-100 border-slate-200'}`}>
                    <AvatarFallback className={m.role === 'assistant' ? 'text-white' : 'text-slate-500'}>
                      {m.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[80%] space-y-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-4 rounded-[24px] text-sm leading-relaxed shadow-sm ${
                      m.role === 'assistant' 
                        ? "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100" 
                        : "bg-blue-600 text-white rounded-tr-none font-medium"
                    }`}>
                      {m.content}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-4 items-start animate-pulse">
                  <Avatar className="h-9 w-9 bg-blue-600 border border-blue-500">
                    <AvatarFallback><Bot className="w-5 h-5 text-white" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-slate-50 p-4 rounded-[24px] rounded-tl-none border border-slate-100 flex gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <CardFooter className="p-6 border-t border-slate-100 bg-slate-50/30">
            <div className="flex w-full gap-3 relative">
              <Input 
                placeholder="Ask about grammar, tips, or IELTS strategies..." 
                className="flex-1 h-14 rounded-2xl border-slate-200 bg-white pr-14 shadow-sm focus-visible:ring-blue-600"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button 
                size="icon" 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
              >
                <Send className="w-4 h-4 text-white" />
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-6 flex justify-center gap-6">
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
             <BookOpen className="w-3 h-3" /> Vocabulary Tips
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
             <Sparkles className="w-3 h-3" /> Grammar Check
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
             <Info className="w-3 h-3" /> Scoring Advice
           </div>
        </div>
      </main>
    </div>
  );
}
