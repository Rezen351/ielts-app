'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <Link href="/" className="text-2xl font-bold text-blue-600 tracking-tight">IELTS<span className="text-gray-900">Master</span></Link>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-medium" asChild>
            <Link href="/dashboard">🏠 Dashboard</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg text-gray-600" asChild>
            <Link href="#">🎧 Listening</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg text-gray-600" asChild>
            <Link href="#">📖 Reading</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg text-gray-600" asChild>
            <Link href="#">✍️ Writing</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg text-gray-600" asChild>
            <Link href="#">🗣️ Speaking</Link>
          </Button>
        </nav>
        <div className="p-4 mt-auto border-t border-gray-100">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg">
            🚪 Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4 md:px-8 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 hidden md:block">Track your IELTS preparation progress</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">{user?.name || 'Candidate'}</p>
              <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
            </div>
            <Avatar className="h-10 w-10 border border-gray-200">
              <AvatarFallback className="bg-blue-600 text-white font-bold">
                {user?.name?.[0] || 'C'}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
          {/* Welcome Message */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0] || 'Candidate'}! 👋</h2>
            <p className="text-gray-500">You're making great progress. Your average band score is improving.</p>
          </section>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Practice Tests</CardDescription>
                <CardTitle className="text-3xl font-bold">12</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">↑ 3 this week</Badge>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-blue-600 text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-blue-100">Current Band Score</CardDescription>
                <CardTitle className="text-3xl font-bold">7.5</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-blue-100">Target: Band 8.5</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Study Streak</CardDescription>
                <CardTitle className="text-3xl font-bold">24 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0">Perfect Consistency!</Badge>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white p-1 border border-gray-200 rounded-xl inline-flex">
              <TabsTrigger value="overview" className="rounded-lg px-6">Overview</TabsTrigger>
              <TabsTrigger value="activities" className="rounded-lg px-6">Activities</TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg px-6">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <Card className="border-0 shadow-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Sessions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                      {[
                        { type: 'Reading', score: '8.0', date: '2 hours ago' },
                        { type: 'Listening', score: '7.5', date: 'Yesterday' },
                        { type: 'Writing Task 1', score: '7.0', date: '2 days ago' },
                      ].map((item, i) => (
                        <div key={i} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                              {item.type[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{item.type}</p>
                              <p className="text-xs text-gray-500">{item.date}</p>
                            </div>
                          </div>
                          <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-3">Band {item.score}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Ready for more practice?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full justify-between h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold shadow-lg" size="lg">
                      <span>Start Full Mock Test</span>
                      <span className="bg-blue-500/50 p-1 rounded">⚡</span>
                    </Button>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-20 flex flex-col gap-2 rounded-xl border-gray-200">
                        <span className="text-xl">✍️</span>
                        <span className="text-xs font-bold">Writing Task</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2 rounded-xl border-gray-200">
                        <span className="text-xl">🗣️</span>
                        <span className="text-xs font-bold">Speaking AI</span>
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
