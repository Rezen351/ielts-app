'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Headphones, 
  BookOpen, 
  PenTool, 
  Mic, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Zap
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function PracticeHubPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const practiceModules = [
    {
      id: 'listening',
      label: 'Listening',
      icon: Headphones,
      href: '/dashboard/listening',
      color: 'blue',
      description: 'Practice identifying key information from diverse audio recordings and accents.'
    },
    {
      id: 'reading',
      label: 'Reading',
      icon: BookOpen,
      href: '/dashboard/reading',
      color: 'indigo',
      description: 'Enhance your skimming and scanning skills with academic and general interest texts.'
    },
    {
      id: 'writing',
      label: 'Writing',
      icon: PenTool,
      href: '/dashboard/writing',
      color: 'sky',
      description: 'Master Task 1 data analysis and Task 2 essay structure with AI-powered feedback.'
    },
    {
      id: 'speaking',
      label: 'Speaking',
      icon: Mic,
      href: '/dashboard/speaking',
      color: 'violet',
      description: 'Practice real-time speaking prompts with automated speech-to-text and evaluation.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:px-8 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-600" />
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Practice Hub</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 pb-20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Select your focus</h2>
              <p className="text-slate-500 font-medium">Daily practice is key to reaching Band {user?.goalBand || '7.5'}.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {practiceModules.map((m) => (
            <Link key={m.id} href={m.href} className="group">
              <Card className="border-slate-200 shadow-none rounded-[32px] overflow-hidden bg-white transition-all group-hover:border-blue-300 group-hover:shadow-xl group-hover:shadow-blue-50/50 h-full flex flex-col">
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${m.color}-200 bg-${m.color}-600`}>
                      <m.icon className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-0 font-bold uppercase tracking-widest text-[9px] px-2 py-1">
                      Adaptive AI
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-2">{m.label}</CardTitle>
                  <CardDescription className="text-slate-500 font-medium leading-relaxed">
                    {m.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="p-8 pt-4 mt-auto border-t border-slate-50 group-hover:bg-blue-50/30 transition-colors flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Zap className="w-4 h-4 text-amber-500 fill-current" />
                    Start Session
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
