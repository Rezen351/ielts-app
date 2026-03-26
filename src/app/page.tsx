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
  ArrowRight, 
  CheckCircle2, 
  Zap,
  Globe,
  Star,
  BrainCircuit,
  TrendingUp,
  Target,
  Sparkles,
  Trophy,
  MessageSquare,
  GraduationCap,
  Lightbulb,
  ShieldCheck
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setIsLoggedIn(true);
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { 
      title: "Adaptive Learning Roadmap", 
      desc: "Start with a 5-minute diagnostic test. AI identifies your gaps and builds a skill-based roadmap just for you.", 
      icon: Target,
      color: "text-blue-600",
      bg: "bg-blue-50",
      badge: "Diagnostic System"
    },
    { 
      title: "Milestone Gatekeeper", 
      desc: "Pass AI-driven mastery checks to unlock new levels. If you struggle, we generate 'Remedial Deep Dives' just for you.", 
      icon: ShieldCheck,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      badge: "Adaptive Mastery"
    },
    { 
      title: "AI-Curated Study Materials", 
      desc: "Get blog-style lessons tailored to your background. Includes interactive flashcards and context-aware AI Tutoring.", 
      icon: BookOpen,
      color: "text-sky-600",
      bg: "bg-sky-50",
      badge: "Smart Content"
    },
    { 
      title: "Professional AI Examiner", 
      desc: "Full-length simulations with official Band scoring (1.0 - 9.0) and deep technical analysis of your mistakes.", 
      icon: Trophy,
      color: "text-amber-600",
      bg: "bg-amber-50",
      badge: "Real Exam Simulation"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 selection:bg-blue-600/10 selection:text-blue-600 font-sans text-slate-900">
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform duration-300">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              IELTS<span className="text-blue-600">Master</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
            {["Learning", "Practice", "Examiner", "Chat Tutor"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="hover:text-blue-600 transition-colors relative group">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button size="lg" asChild className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl px-6 shadow-xl transition-all duration-300">
                <Link href="/dashboard" className="flex items-center gap-2">Dashboard <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="font-bold text-slate-500 hover:text-blue-600 rounded-2xl hidden sm:flex">
                  <Link href="/auth/login">Log In</Link>
                </Button>
                <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl px-6 shadow-lg shadow-blue-200 transition-all duration-300">
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-48 pb-20 px-6 z-10 flex flex-col items-center justify-center min-h-[90vh]">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          {/* HUGE IDENTITY ICON */}
          <div className="mx-auto w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-blue-200 animate-in zoom-in duration-1000 mb-8">
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <div className="space-y-4">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-[12px] px-4 md:px-6 py-2 rounded-full text-center">
              The All-in-One AI IELTS Examiner ⚡
            </Badge>
            <h1 className="text-5xl md:text-8xl lg:text-9xl font-black text-slate-900 tracking-tighter leading-[0.9] md:leading-[0.9] select-none">
              IELTS<span className="text-blue-600">Master</span>
            </h1>
            <p className="text-lg md:text-3xl font-bold text-slate-400 tracking-tight">
              Shatter your limits. <span className="text-slate-900">Achieve Band 8.5+</span>
            </p>
          </div>
          
          <p className="text-lg md:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-medium px-4">
            The world's first IELTS preparation ecosystem that adapts to <span className="text-slate-900 font-bold underline decoration-blue-500 underline-offset-[12px] decoration-4">YOU</span>. Personalized roadmaps and professional simulations.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 pt-6 px-4 w-full">
            <Button size="lg" className="h-16 md:h-20 w-full sm:w-auto px-10 md:px-12 bg-slate-900 hover:bg-slate-800 text-white text-lg md:text-xl font-bold rounded-[20px] md:rounded-[24px] shadow-2xl transition-all duration-300 hover:-translate-y-2 active:scale-95" asChild>
              <Link href={isLoggedIn ? "/dashboard" : "/auth/signup"} className="flex items-center justify-center gap-3">
                {isLoggedIn ? "Resume Training" : "Start Journey"} <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-16 md:h-20 w-full sm:w-auto px-10 md:px-12 border-2 border-slate-200 bg-white text-slate-600 text-lg md:text-xl font-bold rounded-[20px] md:rounded-[24px] hover:bg-slate-50 hover:border-slate-300 transition-all duration-300" asChild>
              <Link href="#learning" className="flex items-center justify-center gap-2">
                <BrainCircuit className="w-5 h-5 md:w-6 md:h-6" /> Methodology
              </Link>
            </Button>
          </div>

          <div className="pt-12 flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2 group cursor-default">
              <Star className="w-4 h-4 text-amber-500 fill-current group-hover:scale-125 transition-transform" /> 
              4.9/5 Student Rating
            </span>
            <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-200"></span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Professional AI Examiner</span>
            <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-200"></span>
            <span className="flex items-center gap-2 text-slate-900 font-black tracking-tighter">Diagnostic test included</span>
          </div>
        </div>
      </header>

      {/* Daily Vibe Check Preview */}
      <section className="relative z-10 py-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-12 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
            
            <div className="flex-1 space-y-6 relative z-10">
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black uppercase tracking-widest text-[10px] px-3 py-1">
                English Vibe Check ⚡
              </Badge>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                Master English with<br /><span className="text-blue-600 italic">Personality.</span>
              </h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed">
                Daily AI-generated tips using "Native Mode" translations. From local slang to Band 9 Academic English, we keep the learning process engaging and fun.
              </p>
              <div className="flex gap-4">
                <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-500">
                  Multilingual
                </div>
                <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-500">
                  Idiomatic
                </div>
              </div>
            </div>

            <div className="flex-1 w-full relative z-10">
              <Card className="border-slate-200 shadow-xl rounded-3xl overflow-hidden bg-white md:rotate-3 group-hover:rotate-0 transition-transform duration-700">
                <CardHeader className="bg-slate-900 text-white p-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-70">
                    <Zap className="w-3 h-3 fill-current text-blue-400" /> Tip of the day
                  </div>
                  <CardTitle className="text-xl font-bold mt-2 italic text-blue-300">"Break the ice"</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">
                    Means "to make people feel more relaxed in a social situation." Perfect for Speaking Part 1 introduction!
                  </p>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-[11px] font-bold text-blue-700 italic">
                    "Biar ga kaku pas ketemu penguji."
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section id="learning" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <div className="text-blue-600 font-bold uppercase tracking-[0.2em] text-xs">Four Pillars of Mastery</div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">Everything you need<br />to hit Band 8.5.</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium leading-relaxed">Our AI engines meticulously analyze every aspect of your performance against official IELTS Band Descriptors.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <Card key={i} className="group p-10 border-slate-200 rounded-[40px] shadow-none bg-white hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-50 transition-all duration-500 hover:-translate-y-2 overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-48 h-48 ${f.bg} rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`}></div>
                
                <CardHeader className="p-0 mb-8 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${f.bg} border border-slate-100 shadow-inner shadow-white/50`}>
                      <f.icon className={`w-8 h-8 ${f.color}`} />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-slate-200 px-3 py-1">
                      {f.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-3xl font-black text-slate-900 mb-4">{f.title}</CardTitle>
                  <CardDescription className="text-slate-500 text-lg font-medium leading-relaxed">
                    {f.desc}
                  </CardDescription>
                </CardHeader>
                
                <CardFooter className="p-0 relative z-10 flex items-center gap-3 text-[12px] font-black text-slate-400 group-hover:text-blue-600 transition-colors uppercase tracking-[0.2em]">
                  Explore Architecture <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Tutor Integration */}
      <section id="chat-tutor" className="py-24 px-6 bg-slate-900 text-white relative z-10 overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <MessageSquare className="w-3 h-3" /> Context-Aware Tutor
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.05] tracking-tight">
              A Personal Tutor<br />that actually <span className="text-blue-500">Knows You.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed font-medium">
              Stuck on a Reading passage? Confused by a Grammar rule? Our AI Chat Tutor receives the exact context of what you're studying, so it's always ready with the right answer.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Sparkles, title: "No Explanation Needed", desc: "Tutor knows exactly which question you're solving." },
                { icon: ShieldCheck, title: "Band 9 Verified", desc: "Expert logic based on official examiner guidelines." }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                  <item.icon className="w-6 h-6 text-blue-500" />
                  <h4 className="font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full relative z-10">
            <div className="bg-slate-800 rounded-[40px] p-8 border border-white/10 shadow-2xl relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">IELTS AI Tutor</div>
                  <div className="text-white font-bold text-sm">Online for assistance</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-700/50 p-4 rounded-2xl rounded-tl-none mr-12 text-sm text-slate-300">
                  "I see you're reading about 'Environmental Vocabulary'. Would you like to see 5 high-scoring collocations for this topic?"
                </div>
                <div className="bg-blue-600 p-4 rounded-2xl rounded-tr-none ml-12 text-sm text-white font-medium">
                  "Yes, please! Especially ones for Writing Task 2."
                </div>
                <div className="bg-slate-700/50 p-4 rounded-2xl rounded-tl-none mr-12 text-sm text-slate-300">
                  "Got it. Use 'Mitigating circumstances' or 'Irreversible damage' to show a high lexical resource level!"
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative z-10 text-center">
        <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-[64px] p-16 md:p-24 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-100/50 blur-[120px] rounded-full pointer-events-none"></div>
          
          <h2 className="relative z-10 text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight">Ready to break<br />your limits?</h2>
          <p className="relative z-10 text-xl md:text-2xl text-slate-500 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            Create your personalized preparation journey today. Join thousands of students who have already boosted their scores by +1.5 bands using our Adaptive AI.
          </p>
          
          <Button size="lg" className="relative z-10 h-20 px-16 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold rounded-[32px] shadow-2xl shadow-blue-200 hover:-translate-y-1 transition-all duration-300" asChild>
            <Link href={isLoggedIn ? "/dashboard" : "/auth/signup"}>
              {isLoggedIn ? "Resume Learning" : "Start For Free"}
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
            <span className="font-bold text-slate-900 tracking-tight text-xl">IELTS<span className="text-blue-600">Master</span></span>
          </div>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
            © 2026 IELTS Master. Built with Adaptive AI.
          </p>
          <div className="flex items-center gap-8 text-slate-500 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
