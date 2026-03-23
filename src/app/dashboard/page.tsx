'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  Headphones, 
  BookOpen, 
  PenTool, 
  Mic, 
  LogOut, 
  TrendingUp, 
  Calendar,
  Trophy,
  Zap,
  Bot,
  ChevronRight,
  MessageSquare,
  Settings,
  Sparkles,
  ArrowRight,
  Languages,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [insight, setInsight] = useState<any>(null);
  const [insightTranslated, setInsightTranslated] = useState<string>('');
  const [translatingInsight, setTranslatingInsight] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchProgress(parsedUser.id);
      fetchInsight(parsedUser.id);
    }
  }, []);

  const fetchProgress = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/progress?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setProgress(data);
      }
    } catch (err) {
      console.error("Failed to fetch progress");
    } finally {
      setLoading(false);
    }
  };

  const fetchInsight = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/insights?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setInsight(data.insight);
      }
    } catch (err) {
      console.error("Failed to fetch insight");
    }
  };

  const toggleInsightTranslation = () => {
    if (insightTranslated) {
      setInsightTranslated('');
    } else if (insight?.contentTranslated) {
      setInsightTranslated(insight.contentTranslated);
    }
  };

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('open-ielts-chat'));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  };

  const sidebarLinks = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", active: true },
    { label: "Learning", icon: Sparkles, href: "/dashboard/learning" },
    { label: "Practice", icon: TrendingUp, href: "/dashboard/practice" },
    { label: "Examiner", icon: Trophy, href: "/dashboard/examiner" },
  ];

  const getModuleAvg = (module: string) => {
    const stat = progress?.stats.find((s: any) => s._id === module);
    return stat ? stat.avgScore.toFixed(1) : "0.0";
  };

return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col-reverse md:flex-row">
      {/* Sidebar */}
      <aside className={`fixed inset-0 z-50 md:static md:z-auto md:translate-x-0 bg-white md:bg-transparent w-full md:w-64 md:border-r border-slate-200 flex flex-col h-screen overflow-y-auto transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">IELTS Master</span>
            </Link>
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-slate-100" 
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        
        <nav className="flex-1 px-3 space-y-1">
          {sidebarLinks.map((link) => (
            <Button 
              key={link.label}
              variant="ghost" 
              className={`w-full justify-start gap-3 rounded-lg text-sm font-medium transition-all ${
                link.active 
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`} 
              asChild={!!link.href}
            >
              {link.href ? (
                <Link href={link.href}>
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ) : (
                <>
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </>
              )}
            </Button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100 space-y-1">
          <Button variant="ghost" asChild className="w-full justify-start gap-3 text-slate-500 hover:bg-slate-50 rounded-lg text-sm">
            <Link href="/dashboard/settings"><Settings className="w-4 h-4" /> Settings</Link>
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
<main className={`flex-1 flex flex-col min-w-0 order-1 md:order-none ${sidebarOpen ? 'md:ml-0 -ml-0 blur-sm pointer-events-none md:pointer-events-auto' : ''}`}>
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:px-8 flex items-center justify-between sticky top-0 z-40 relative">
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-slate-100" 
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex-1 text-center md:text-left md:ml-0">Dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900">{user?.name || 'Candidate'}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{user?.email}</p>
            </div>
            <Avatar className="h-8 w-8 border border-slate-100">
              <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                {user?.name?.[0] || 'C'}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6 md:space-y-8 pb-20">
          {/* Daily Insight Section */}
         <section className="animate-in fade-in duration-1000 slide-in-from-top-4 w-full">
  <Card className="border-0 shadow-xl md:shadow-2xl bg-white/80 backdrop-blur-xl rounded-[24px] sm:rounded-[32px] md:rounded-[40px] overflow-hidden group w-full mx-auto">
    <CardContent className="p-5 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-between gap-6 md:gap-8 w-full">
      
      {/* Container Teks & Header */}
      <div className="space-y-4 md:space-y-6 w-full min-w-0"> 
        
        {/* Header / Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </div>
          <div className="flex flex-col justify-center">
            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black uppercase tracking-widest text-[9px] sm:text-[10px] px-2 sm:px-3 py-0.5 sm:py-1 w-fit">
              English Check ⚡: {insight?.topic || 'Cool English'}
            </Badge>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 ml-0.5">
              Powered AI Coach
            </p>
          </div>
        </div>

        {/* Area Quote / Insight */}
        <div className="space-y-3 sm:space-y-4 w-full">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            {/* UKURAN QUOTE DIPERKECIL DI SINI */}
            <p className={`text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900 leading-relaxed tracking-tight flex-1 ${!insight && 'animate-pulse bg-slate-100 h-16 sm:h-20 rounded-xl md:rounded-2xl w-full max-w-2xl'}`}>
              {insight ? `"${insight.content}"` : ""}
            </p>
            {insight && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setInsight(null);
                  setInsightTranslated('');
                  fetchInsight(user.id);
                }}
                className="text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl shrink-0 h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center transition-colors"
                title="Ganti Vibe"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            )}
          </div>

          {/* Kotak Terjemahan */}
          {insightTranslated && (
            <div className="p-3 sm:p-4 md:p-5 rounded-xl md:rounded-2xl bg-indigo-50/50 border border-indigo-100/50 animate-in fade-in slide-in-from-top-2 duration-500">
              {/* UKURAN TERJEMAHAN DIPERKECIL DI SINI */}
              <p className="text-[11px] sm:text-xs md:text-sm font-bold text-indigo-700 leading-relaxed">
                {insightTranslated}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tombol Aksi - Selalu di bawah */}
      {insight && (
        <div className="flex justify-start w-full">
          <Button 
            variant="outline" 
            onClick={toggleInsightTranslation}
            className="w-full md:w-auto rounded-xl md:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all gap-2 sm:gap-3 h-12 md:h-14 px-4 sm:px-6 md:px-8 shrink-0 shadow-sm hover:shadow-md bg-white"
          >
            <Languages className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{insightTranslated ? "Back to English" : "Terjemahan"}</span>
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
</section>

          {/* Hero Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-slate-900 rounded-[32px] p-6 md:p-8 text-white relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <Badge className="bg-blue-500/20 text-blue-300 border-0 uppercase tracking-widest text-[10px] font-bold">Recommended for you</Badge>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight leading-snug max-w-md">
                    {progress?.recommendation || "Loading your personalized plan..."}
                  </h2>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 font-bold h-10 md:h-11 w-full sm:w-auto" 
                    onClick={handleOpenChat}
                  >
                    Discuss with AI <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
                <Sparkles className="absolute top-8 right-8 w-24 h-24 text-white/5 rotate-12" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Listening", val: getModuleAvg("Listening"), color: "bg-blue-500" },
                  { label: "Reading", val: getModuleAvg("Reading"), color: "bg-indigo-500" },
                  { label: "Writing", val: getModuleAvg("Writing"), color: "bg-sky-500" },
                  { label: "Speaking", val: getModuleAvg("Speaking"), color: "bg-violet-500" }
                ].map((m) => (
                  <Card key={m.label} className="border-slate-200 shadow-none rounded-2xl">
                    <CardContent className="p-4 text-center space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</p>
                      <p className="text-2xl font-black text-slate-900">{m.val}</p>
                      <div className={`h-1 w-8 mx-auto rounded-full ${m.color}`}></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="border-slate-200 shadow-none rounded-[32px] bg-white p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall Progress</p>
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-black text-slate-900">{progress?.totalOverallTests || 0}</span>
                  <span className="text-xs font-bold text-slate-400 mb-1">Tests Completed</span>
                </div>
                <Progress value={(progress?.totalOverallTests / 40) * 100} className="h-2 bg-slate-100" />
                <p className="text-[10px] font-medium text-slate-400">Target: 40 tests for Band 8.5</p>
              </div>
              

            </Card>
          </section>

          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2">Activity</h3>
            <div className="grid lg:grid-cols-1 gap-6">
              <Card className="border-slate-200 shadow-none rounded-[32px] overflow-hidden">
                <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {!progress?.recentActivities.length ? (
                    <div className="p-12 text-center text-slate-400 font-medium text-sm">
                      No tests completed yet. Start your first session!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {progress.recentActivities.map((item: any, i: number) => (
                        <div key={i} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-9 h-9 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                              {item.module === 'Reading' ? <BookOpen className="w-4 h-4" /> : item.module === 'Writing' ? <PenTool className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{item.module}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{new Date(item.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Badge className="bg-blue-50 text-blue-600 border-blue-100">Band {item.score}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
