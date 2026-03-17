'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
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
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchProgress(parsedUser.id);
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  };

  const sidebarLinks = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", active: true },
    { label: "Study Chat", icon: MessageSquare, href: "/dashboard/chat" },
    { label: "Listening", icon: Headphones, href: "/dashboard/listening" },
    { label: "Reading", icon: BookOpen, href: "/dashboard/reading" },
    { label: "Writing", icon: PenTool, href: "/dashboard/writing" },
    { label: "Speaking", icon: Mic, href: "/dashboard/speaking" },
  ];

  const getModuleAvg = (module: string) => {
    const stat = progress?.stats.find((s: any) => s._id === module);
    return stat ? stat.avgScore.toFixed(1) : "0.0";
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen overflow-y-auto z-20">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">IELTS Master</span>
          </Link>
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
              asChild
            >
              <Link href={link.href}>
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
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
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:px-8 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Dashboard</h1>
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

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 pb-20">
          {/* Hero Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <Badge className="bg-blue-500/20 text-blue-300 border-0 uppercase tracking-widest text-[10px] font-bold">Recommended for you</Badge>
                  <h2 className="text-2xl font-bold tracking-tight leading-snug">
                    {progress?.recommendation || "Loading your personalized plan..."}
                  </h2>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 font-bold h-11" asChild>
                    <Link href="/dashboard/chat">Discuss with AI <ArrowRight className="ml-2 w-4 h-4" /></Link>
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
              
              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <Zap className="w-4 h-4 fill-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Study Streak</p>
                    <p className="text-[10px] font-medium text-slate-400">7 Days consistent</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-slate-100/50 p-1 border border-slate-200 rounded-xl inline-flex h-10">
              <TabsTrigger value="overview" className="rounded-lg px-6 text-xs font-bold">Activity</TabsTrigger>
              <TabsTrigger value="curriculum" className="rounded-lg px-6 text-xs font-bold">Curriculum</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
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

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2">Quick Practice</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <Button variant="outline" className="h-20 justify-between rounded-2xl border-slate-200 bg-white hover:bg-slate-50 p-6 group" asChild>
                      <Link href="/dashboard/reading">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-slate-900">Academic Reading</p>
                            <p className="text-[10px] font-medium text-slate-400 italic">Topic: Climate Change</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-20 justify-between rounded-2xl border-slate-200 bg-white hover:bg-slate-50 p-6 group" asChild>
                      <Link href="/dashboard/writing">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
                            <PenTool className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-slate-900">AI Writing Task 2</p>
                            <p className="text-[10px] font-medium text-slate-400 italic">Topic: Education & Technology</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
