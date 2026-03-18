'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
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
  Target
} from 'lucide-react';

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
      title: "Interactive Listening", 
      desc: "Master diverse accents with 40+ dynamic mock tests and studio-quality audio.", 
      icon: Headphones,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20"
    },
    { 
      title: "Academic Reading", 
      desc: "Tackle complex texts with AI-guided breakdowns and instant vocabulary support.", 
      icon: BookOpen,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20"
    },
    { 
      title: "Precision Writing", 
      desc: "Receive Band 9 evaluations powered by GPT-4o with line-by-line feedback.", 
      icon: PenTool,
      color: "text-fuchsia-500",
      bg: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/20"
    },
    { 
      title: "Live Speaking AI", 
      desc: "Simulate real exams with our Phi-4 powered voice examiner. 100% realistic pacing.", 
      icon: Mic,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden font-sans text-slate-50">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/10 blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] rounded-full bg-sky-600/15 blur-[130px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-500 group-hover:scale-105 group-hover:rotate-3">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white flex items-center">
              IELTS<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400 ml-1">Master</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-300">
            {["Platform", "Methodology", "Pricing", "Testimonials"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-fuchsia-400 transition-all duration-300 group-hover:w-full rounded-full"></span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Button size="lg" asChild className="bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-full px-8 shadow-xl hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:-translate-y-0.5">
                <Link href="/dashboard">Enter Dashboard <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="lg" asChild className="font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-full">
                  <Link href="/auth/login">Log In</Link>
                </Button>
                <Button size="lg" asChild className="bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 text-white font-bold rounded-full px-8 shadow-lg shadow-indigo-500/25 hover:shadow-fuchsia-500/40 transition-all duration-300 border border-white/10 hover:-translate-y-0.5">
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-48 pb-32 px-6 z-10 flex flex-col items-center justify-center min-h-[90vh]">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md shadow-2xl hover:bg-white/10 transition-colors cursor-default">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Now Powered by Multi-Model AI Orchestration
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[1.05]">
            Shatter your limits.<br />
            Achieve <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 animate-gradient-x">Band 8.5+</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
            The world's most advanced IELTS preparation ecosystem. We adapt to your hobbies, occupation, and learning style to generate 100% personalized mock tests.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <Button size="lg" className="h-16 px-10 bg-white hover:bg-slate-100 text-slate-900 text-lg font-bold rounded-full shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] transition-all duration-500 hover:-translate-y-1" asChild>
              <Link href={isLoggedIn ? "/dashboard" : "/auth/signup"} className="flex items-center gap-3">
                {isLoggedIn ? "Resume Training" : "Start Your Journey Free"} <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-16 px-10 border-white/10 bg-white/5 text-white text-lg font-bold rounded-full hover:bg-white/10 backdrop-blur-md transition-all duration-300">
              <TrendingUp className="w-5 h-5 mr-3" /> View Curriculum
            </Button>
          </div>

          <div className="pt-16 flex items-center justify-center gap-8 text-slate-500 text-sm font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2"><Star className="w-4 h-4 text-fuchsia-500" /> 4.9/5 User Rating</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 10,000+ Success Stories</span>
          </div>
        </div>
      </header>

      {/* Persona Context Banner */}
      <section className="relative z-10 py-12 border-y border-white/5 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-2">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-indigo-400" /> Hyper-Personalized Learning
            </h3>
            <p className="text-slate-400 font-medium">Are you an Engineer who loves Photography? We tailor your Reading passages and Speaking questions specifically to your background.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Your Occupation</p>
              <p className="text-white font-semibold">Software Developer</p>
            </div>
            <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner hidden sm:block">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Your Target</p>
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-rose-400 font-black text-xl leading-none">Band 8.0</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="platform" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Four Pillars of Mastery.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Our AI engines meticulously analyze every aspect of your performance against official IELTS Band Descriptors.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className={`group p-10 bg-slate-900/40 border ${f.border} rounded-[32px] backdrop-blur-md hover:bg-slate-900/80 transition-all duration-500 hover:-translate-y-2 overflow-hidden relative`}>
                <div className={`absolute top-0 right-0 w-64 h-64 ${f.bg} rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700 opacity-50`}></div>
                
                <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${f.bg} border ${f.border}`}>
                  <f.icon className={`w-8 h-8 ${f.color}`} />
                </div>
                <h3 className="relative z-10 text-2xl font-bold text-white mb-4">{f.title}</h3>
                <p className="relative z-10 text-slate-400 text-base leading-relaxed mb-8">{f.desc}</p>
                
                <div className="relative z-10 flex items-center gap-2 text-sm font-bold text-slate-500 group-hover:text-white transition-colors uppercase tracking-widest cursor-pointer">
                  Explore Engine <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-2 ${f.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats/Proof Section */}
      <section className="py-32 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <Target className="w-3 h-3" /> Proven Results
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Stop guessing.<br />Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Knowing.</span>
            </h2>
            <div className="space-y-6">
              {[
                { title: "Mistral Large", desc: "Crafts complex, university-level reading passages and dynamic listening scripts." },
                { title: "GPT-4o (High)", desc: "Acts as a Senior Examiner, grading your essays exactly like a human would." },
                { title: "Phi-4 Mini", desc: "Powers our low-latency, real-time conversational speaking agent." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{item.title}</h4>
                    <p className="text-slate-400 leading-relaxed mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full">
            <div className="bg-slate-900 rounded-[40px] p-12 border border-white/10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/10 via-transparent to-rose-500/10 pointer-events-none"></div>
              
              <div className="space-y-10 relative z-10">
                <div>
                  <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-2">Average Score Increase</p>
                  <p className="text-7xl font-black text-white tracking-tighter">+1.5 <span className="text-3xl text-slate-500 font-bold">Bands</span></p>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent"></div>
                <div>
                  <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-2">Tests Evaluated by AI</p>
                  <p className="text-5xl font-black text-white tracking-tight">1.2M+</p>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent"></div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                        {`U${i}`}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-slate-400 max-w-[200px] leading-tight">
                    Join thousands of students who achieved their dreams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative z-10 text-center">
        <div className="max-w-4xl mx-auto bg-gradient-to-b from-indigo-900/50 to-slate-900 border border-indigo-500/20 rounded-[48px] p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/30 blur-[120px] rounded-full pointer-events-none"></div>
          
          <h2 className="relative z-10 text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">Ready to ace your test?</h2>
          <p className="relative z-10 text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">Create your free account today. Tell us your goals, and let our AI craft your perfect preparation journey.</p>
          
          <Button size="lg" className="relative z-10 h-16 px-12 bg-white hover:bg-indigo-50 text-indigo-950 text-xl font-bold rounded-full shadow-2xl hover:-translate-y-1 transition-all duration-300" asChild>
            <Link href={isLoggedIn ? "/dashboard" : "/auth/signup"}>
              {isLoggedIn ? "Enter Dashboard" : "Start For Free"}
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-slate-950 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <Globe className="w-5 h-5 text-white" />
            <span className="font-bold text-white tracking-tight">IELTS Master</span>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            © 2026 IELTS Master. Crafted with Multi-Model AI.
          </p>
          <div className="flex items-center gap-8 text-slate-500 text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}