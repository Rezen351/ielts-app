'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Settings, 
  Globe, 
  Save,
  Languages
} from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [nativeLang, setNativeLang] = useState('id');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setNativeLang(parsed.nativeLanguage || 'id');
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          nativeLanguage: nativeLang
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Settings saved", { description: "Your profile has been updated." });
        // Update local storage
        const updatedUser = { ...user, nativeLanguage: nativeLang };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        toast.error("Error", { description: data.message });
      }
    } catch (err) {
      toast.error("Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:px-8 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Settings</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full space-y-8">
        <Card className="border-slate-200 shadow-none rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <Languages className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-xl font-bold text-slate-900">Language Preferences</CardTitle>
            </div>
            <CardDescription className="text-slate-500 font-medium">
              Choose your native language to receive feedback translations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Native Language</label>
              <select 
                value={nativeLang}
                onChange={(e) => setNativeLang(e.target.value)}
                className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="id">Indonesian (Bahasa Indonesia)</option>
                <option value="en">English (No Translation)</option>
                <option value="zh">Chinese (简体中文)</option>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="ar">Arabic (العربية)</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-8 font-bold flex gap-2"
            >
              {loading ? "Saving..." : <><Save className="w-4 h-4" /> Save Preferences</>}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
