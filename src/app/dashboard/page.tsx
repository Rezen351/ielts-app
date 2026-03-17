'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // In a real app with JWT/Cookies, you'd fetch user data from an API
    // For this prototype, we'll check if user data was saved in localStorage during login
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Redirect to login if no user found
      // window.location.href = '/auth/login';
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/" className="text-2xl font-bold text-blue-600">IELTS<span className="text-gray-900">Master</span></Link>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center space-x-3 p-3 bg-blue-50 text-blue-600 rounded-xl font-medium">
            <span>🏠</span> <span>Dashboard</span>
          </Link>
          <Link href="#" className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <span>🎧</span> <span>Listening</span>
          </Link>
          <Link href="#" className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <span>📖</span> <span>Reading</span>
          </Link>
          <Link href="#" className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <span>✍️</span> <span>Writing</span>
          </Link>
          <Link href="#" className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <span>🗣️</span> <span>Speaking</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full text-left"
          >
            <span>🚪</span> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || 'Candidate'}!</h1>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.[0] || 'C'}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-5xl mx-auto space-y-8">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500">Practice Tests</p>
              <p className="text-3xl font-bold text-gray-900">12</p>
              <p className="text-xs text-green-600 mt-2">↑ 3 this week</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500">Average Band Score</p>
              <p className="text-3xl font-bold text-blue-600">7.5</p>
              <p className="text-xs text-blue-600 mt-2">Target: 8.5</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500">Days Active</p>
              <p className="text-3xl font-bold text-gray-900">24</p>
              <p className="text-xs text-gray-500 mt-2">Keep it up!</p>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Recent Practice Sessions</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { type: 'Reading', score: '8.0', date: '2 hours ago' },
                { type: 'Listening', score: '7.5', date: 'Yesterday' },
                { type: 'Writing Task 1', score: '7.0', date: '2 days ago' },
              ].map((item, i) => (
                <div key={i} className="p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                      {item.type[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{item.type} Practice</p>
                      <p className="text-sm text-gray-500">{item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">Band {item.score}</p>
                    <p className="text-xs text-gray-400">Completed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Practice</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button className="bg-blue-600 text-white p-4 rounded-xl font-bold flex items-center justify-between hover:bg-blue-700 transition-all shadow-lg">
                <span>Start New Full Mock Test</span>
                <span>⚡</span>
              </button>
              <button className="bg-white border-2 border-blue-600 text-blue-600 p-4 rounded-xl font-bold flex items-center justify-between hover:bg-blue-50 transition-all">
                <span>AI Writing Evaluation</span>
                <span>🤖</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
