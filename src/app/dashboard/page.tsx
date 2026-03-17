'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  };

  const sidebarLinks = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", active: true },
    { label: "Listening", icon: Headphones, href: "/dashboard/listening" },
    { label: "Reading", icon: BookOpen, href: "/dashboard/reading" },
    { label: "Writing", icon: PenTool, href: "/dashboard/writing" },
    { label: "Speaking", icon: Mic, href: "/dashboard/speaking" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen overflow-y-auto">
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

        <div className="p-4 mt-auto border-t border-slate-100">
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="w-full justify-start gap-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:px-8 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Overview</h1>
          </div>
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

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
          <section className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h2>
            <p className="text-sm text-slate-500 font-medium">Here is your preparation summary for today.</p>
          </section>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Practice Tests", val: "12", sub: "↑ 3 this week", icon: Calendar, color: "text-blue-600" },
              { label: "Average Band", val: "7.5", sub: "Target: 8.5", icon: TrendingUp, color: "text-emerald-600" },
              { label: "Study Streak", val: "24", sub: "Days consistent", icon: Zap, color: "text-amber-500" }
            ].map((stat, i) => (
              <Card key={i} className="border-slate-200 shadow-none rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-3xl font-bold text-slate-900">{stat.val}</p>
                    </div>
                    <div className={`p-2 rounded-lg bg-slate-50 ${stat.color}`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0 text-[10px] font-bold px-2 py-0">
                      {stat.sub}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-slate-100/50 p-1 border border-slate-200 rounded-xl inline-flex h-10">
              <TabsTrigger value="overview" className="rounded-lg px-6 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
              <TabsTrigger value="activities" className="rounded-lg px-6 text-xs font-bold">Activities</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6 outline-none">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <Card className="border-slate-200 shadow-none rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">Recent Sessions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {[
                        { type: 'Reading', score: '8.0', date: '2h ago', icon: BookOpen },
                        { type: 'Listening', score: '7.5', date: 'Yesterday', icon: Headphones },
                        { type: 'Writing Task 1', score: '7.0', date: '2d ago', icon: PenTool },
                      ].map((item, i) => (
                        <div key={i} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div className="w-9 h-9 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                              <item.icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{item.type}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{item.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-blue-600">Band {item.score}</span>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-slate-200 shadow-none rounded-2xl overflow-hidden flex flex-col">
                  <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">Recommended</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4 flex-1">
                    <Button className="w-full justify-between h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold" size="lg" asChild>
                      <Link href="/dashboard/reading">
                        Start Full Mock Test
                        <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                      </Link>
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-24 flex flex-col gap-3 rounded-2xl border-slate-200 hover:bg-slate-50 group" asChild>
                        <Link href="/dashboard/speaking">
                          <Bot className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Speaking AI</span>
                        </Link>
                      </Button>
                      <Button variant="outline" className="h-24 flex flex-col gap-3 rounded-2xl border-slate-200 hover:bg-slate-50 group" asChild>
                        <Link href="/dashboard/writing">
                          <PenTool className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Writing AI</span>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
