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
  Globe
} from 'lucide-react';

export default function Home() {
  const features = [
    { 
      title: "Listening", 
      desc: "40+ full mock tests with studio-quality audio.", 
      icon: Headphones,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    { 
      title: "Reading", 
      desc: "Interactive passages with real-time feedback.", 
      icon: BookOpen,
      color: "text-indigo-500",
      bg: "bg-indigo-50"
    },
    { 
      title: "Writing", 
      desc: "AI-powered evaluation for Task 1 & 2.", 
      icon: PenTool,
      color: "text-sky-500",
      bg: "bg-sky-50"
    },
    { 
      title: "Speaking", 
      desc: "Live simulations with AI examiners.", 
      icon: Mic,
      color: "text-violet-500",
      bg: "bg-violet-50"
    }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">IELTS Master</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            {["Listening", "Reading", "Writing", "Speaking"].map((item) => (
              <a key={item} href="#" className="hover:text-blue-600 transition-colors">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="font-semibold text-slate-600">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full px-6">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-40 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3 h-3 fill-blue-700" /> New: AI Speaking Coach v2.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            The intelligent path to <br />
            <span className="text-blue-600">Band 8.5</span>
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Personalized IELTS preparation platform. Master all four modules with 
            AI-driven feedback and realistic exam simulations.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-2xl shadow-xl shadow-blue-200" asChild>
              <Link href="/auth/signup" className="flex items-center gap-2">
                Start Learning Now <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 border-slate-200 text-slate-600 text-lg font-bold rounded-2xl hover:bg-slate-50">
              View Curriculum
            </Button>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="group p-8 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`${f.bg} ${f.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">{f.desc}</p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest">
                  Explore Module <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Why thousands choose <br />IELTS Master.</h2>
            <div className="space-y-4">
              {[
                "Real-time AI Writing Evaluation",
                "Advanced Voice Analysis for Speaking",
                "Full-length Adaptive Mock Tests",
                "Personalized Performance Roadmap"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden aspect-square flex items-center justify-center">
            <div className="relative z-10 text-center space-y-2">
              <span className="text-8xl font-black block tracking-tighter">8.5</span>
              <span className="text-blue-400 font-bold uppercase tracking-widest text-sm">Target Band</span>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20 translate-y-1/2 -translate-x-1/2"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-900">IELTS Master</span>
          </div>
          <p className="text-sm text-slate-400 font-medium">
            © 2026 IELTS Master. Precision in Education.
          </p>
          <div className="flex items-center gap-6 text-slate-400 text-sm font-medium">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
