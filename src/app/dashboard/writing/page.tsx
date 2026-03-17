'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  PenTool, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp,
  Languages,
  Eye,
  EyeOff
} from 'lucide-react';

export default function WritingPage() {
  const [essay, setEssay] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  const prompt = "Some people believe that it is best to accept a bad situation, such as an unsatisfactory job or shortage of money. Others argue that it is better to try and improve such situations. Discuss both these views and give your own opinion.";

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleEvaluate = async () => {
    if (!essay || essay.split(' ').length < 10) {
      toast.error("Essay too short", { description: "Please write at least 10 words." });
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const response = await fetch('/api/evaluate/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay,
          taskType: 'Writing Task 2',
          prompt,
          userId: user?.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysis(data.analysis);
        toast.success("Analysis Complete");
      } else {
        toast.error("Evaluation Failed", { description: data.message });
      }
    } catch (err) {
      toast.error("Error", { description: "Failed to connect to evaluation service." });
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
            <PenTool className="w-5 h-5 text-blue-600" />
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Writing Module</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 shadow-none rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/30 border-b border-slate-100 p-8">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-50 text-blue-600 border-blue-100 uppercase text-[10px]">Task 2</Badge>
                </div>
                <CardTitle className="text-lg font-bold leading-relaxed text-slate-800">
                  {prompt}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Textarea 
                  placeholder="Type your essay here..."
                  className="min-h-[400px] border-0 focus-visible:ring-0 text-slate-700 leading-relaxed p-8 rounded-none resize-none text-base"
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                />
              </CardContent>
              <CardFooter className="bg-slate-50/30 border-t border-slate-100 p-6 flex justify-between items-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Words: <span className="text-slate-900">{essay ? essay.trim().split(/\s+/).length : 0}</span>
                </div>
                <Button 
                  onClick={handleEvaluate} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 font-bold h-12 shadow-lg shadow-blue-200"
                >
                  {loading ? "Analyzing..." : "Evaluate Essay"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            {analysis && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Score Card */}
                <Card className="border-slate-200 shadow-xl shadow-blue-50/50 rounded-3xl overflow-hidden border-t-4 border-t-blue-600 bg-white">
                  <CardHeader className="text-center p-8 bg-blue-50/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Predicted Band</p>
                    <div className="text-6xl font-black text-blue-600 tracking-tighter">{analysis.overallScore}</div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    {/* Translation Toggle */}
                    {user?.nativeLanguage !== 'en' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowTranslation(!showTranslation)}
                        className="w-full rounded-xl border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest gap-2"
                      >
                        {showTranslation ? <><EyeOff className="w-3 h-3" /> Hide Translation</> : <><Eye className="w-3 h-3" /> Show Translation ({user?.nativeLanguage.toUpperCase()})</>}
                      </Button>
                    )}

                    <div className="space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detailed Feedback</p>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">
                        {showTranslation ? analysis.translatedFeedback : analysis.feedback}
                      </p>
                    </div>

                    <div className="space-y-4 border-t border-slate-100 pt-6">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Key Suggestions</p>
                      <div className="space-y-3">
                        {(showTranslation ? analysis.translatedSuggestions : analysis.suggestions).map((s: string, i: number) => (
                          <div key={i} className="flex gap-3 text-xs font-medium text-slate-500">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!analysis && !loading && (
              <Card className="border-dashed border-slate-200 bg-white shadow-none rounded-3xl h-[400px] flex flex-col items-center justify-center p-12 text-center">
                <Sparkles className="w-8 h-8 text-slate-200 mb-4" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Awaiting Analysis</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
