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
  AlertCircle,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

export default function WritingPage() {
  const [essay, setEssay] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

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
          userName: user?.name
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysis(data.analysis);
        toast.success("Analysis Complete", { description: "Your essay has been evaluated by AI." });
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
          {/* Left: Input Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 shadow-none rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/30 border-b border-slate-100 p-8">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Badge className="bg-blue-50 text-blue-600 border-blue-100">Task 2</Badge>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Discussion Essay</span>
                </div>
                <CardTitle className="text-lg font-bold leading-relaxed text-slate-800">
                  {prompt}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Textarea 
                  placeholder="Type your essay here... (minimum 250 words recommended)"
                  className="min-h-[400px] border-0 focus-visible:ring-0 text-slate-700 leading-relaxed p-8 rounded-none resize-none text-base"
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                />
              </CardContent>
              <CardFooter className="bg-slate-50/30 border-t border-slate-100 p-6 flex justify-between items-center">
                <div className="text-xs font-medium text-slate-400">
                  Words: <span className="text-slate-900 font-bold">{essay ? essay.trim().split(/\s+/).length : 0}</span>
                </div>
                <Button 
                  onClick={handleEvaluate} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 font-bold flex gap-2 h-12 shadow-lg shadow-blue-200"
                >
                  {loading ? "Analyzing..." : <>Evaluate with AI <Sparkles className="w-4 h-4" /></>}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right: Analysis Results */}
          <div className="space-y-6">
            {!analysis && !loading && (
              <Card className="border-dashed border-slate-200 bg-slate-50/50 shadow-none rounded-3xl h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center mb-6 text-slate-300">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Awaiting Submission</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">Write your essay and click evaluate to see your predicted IELTS band score.</p>
              </Card>
            )}

            {analysis && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-slate-200 shadow-xl shadow-blue-50/50 rounded-3xl overflow-hidden border-t-4 border-t-blue-600">
                  <CardHeader className="text-center p-8 bg-blue-50/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Predicted Band Score</p>
                    <div className="text-6xl font-black text-blue-600 tracking-tighter">{analysis.overallScore}</div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                      {Object.entries(analysis.criteriaScores).map(([key, score]: any) => (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-blue-600">Band {score}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-1000" 
                              style={{ width: `${(score / 9) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none rounded-3xl overflow-hidden">
                  <CardHeader className="bg-slate-50/30 p-6 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Key Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4 font-medium text-slate-600 text-sm leading-relaxed">
                    {analysis.suggestions.map((s: string, i: number) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-blue-600 font-bold">{i+1}.</span>
                        {s}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
