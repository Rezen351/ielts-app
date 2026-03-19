'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  PenTool, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp,
  Languages,
  Eye,
  EyeOff,
  Loader2,
  Info
} from 'lucide-react';

export default function WritingPage() {
  const [essay, setEssay] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isSelecting, setIsSelecting] = useState(true);
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [promptData, setPromptData] = useState<any>(null);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [recommendedTopics, setRecommendedTopics] = useState<string[]>([]);
  const [showSample, setShowSample] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/recommendations/topics');
      const result = await response.json();
      if (result.success) {
        setRecommendedTopics(result.topics.Writing || []);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations");
    }
  };

  const startPractice = async (selectedTopic: string) => {
    setGeneratingPrompt(true);
    setGeneratingPrompt(true);
    setIsSelecting(false);
    try {
      const response = await fetch('/api/generate/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'Writing',
          topic: selectedTopic,
          difficulty: difficulty,
          userId: user?.id
        }),
      });
      const result = await response.json();
      if (result.success) {
        setPromptData(result.data);
        setTopic(selectedTopic);
        setEssay('');
        setAnalysis(null);
      } else {
        toast.error("Failed to load prompt");
        setIsSelecting(true);
      }
    } catch (err) {
      toast.error("Network error");
      setIsSelecting(true);
    } finally {
      setGeneratingPrompt(false);
    }
  };

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
          prompt: promptData.prompt,
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

  if (isSelecting) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-sky-100 rounded-[24px] flex items-center justify-center text-sky-600 mx-auto mb-4">
              <PenTool className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Writing Practice</h1>
            <p className="text-slate-500 font-medium">Choose a topic to generate a unique essay prompt.</p>
          </div>

          <Card className="border-slate-200 shadow-sm rounded-[32px] p-8 space-y-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Custom Scenario</Label>
                    <div className="flex gap-2">
                        <Input 
                        placeholder="e.g., Environment, Education, Career..." 
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        className="h-12 rounded-xl border-slate-200 focus-visible:ring-blue-600"
                        />
                    </div>
                </div>
                <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Difficulty</Label>
                    <select 
                        value={difficulty} 
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full h-12 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-bold text-sm"
                    >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                    </select>
                </div>
            </div>

            <Button 
                onClick={() => startPractice(customTopic)}
                disabled={!customTopic.trim() || generatingPrompt}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100"
            >
                {generatingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Custom Prompt"}
            </Button>

            <div className="space-y-4">

              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recommended Topics</Label>
              <div className="flex flex-wrap gap-2">
                {recommendedTopics.map((t) => (
                  <Button 
                    key={t}
                    variant="outline" 
                    onClick={() => startPractice(t)}
                    disabled={generatingPrompt}
                    className="rounded-full border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 font-bold text-xs"
                  >
                    <Sparkles className="w-3 h-3 mr-2 text-amber-400" /> {t}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
          
          <Button variant="ghost" asChild className="mx-auto block w-fit text-slate-400 font-bold text-xs uppercase tracking-widest">
            <Link href="/dashboard" className="flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (generatingPrompt) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generating prompt...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:px-8 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsSelecting(true)} className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
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
                  <Badge className="bg-blue-50 text-blue-600 border-blue-100 uppercase text-[10px]">TASK 2: {topic.toUpperCase()}</Badge>
                </div>
                <CardTitle className="text-lg font-bold leading-relaxed text-slate-800">
                  {promptData?.prompt}
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-400 mt-2">
                  {promptData?.instructions}
                </CardDescription>
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
                <Card className="border-slate-200 shadow-xl shadow-blue-50/50 rounded-3xl overflow-hidden border-t-4 border-t-blue-600 bg-white">
                  <CardHeader className="text-center p-8 bg-blue-50/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Predicted Band</p>
                    <div className="text-6xl font-black text-blue-600 tracking-tighter">{analysis.overallScore}</div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    {user?.nativeLanguage !== 'en' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowTranslation(!showTranslation)}
                        className="w-full rounded-xl border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest gap-2"
                      >
                        {showTranslation ? <><EyeOff className="w-3 h-3" /> Original</> : <><Eye className="w-3 h-3" /> Translation</>}
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
                <Button variant="outline" onClick={() => setIsSelecting(true)} className="w-full rounded-xl py-6 border-slate-200 text-slate-600 font-bold">
                  Try New Prompt
                </Button>

                {promptData?.sampleAnswer && (
                  <div className="space-y-4 pt-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowSample(!showSample)}
                      className="w-full rounded-xl py-6 border-blue-200 text-blue-600 font-black uppercase tracking-widest text-[10px] bg-blue-50/50 flex items-center justify-center gap-2"
                    >
                      <Info className="w-4 h-4" /> {showSample ? "Hide Sample Answer" : "View Band 9 Sample"}
                    </Button>
                    
                    {showSample && (
                      <Card className="rounded-[32px] border-blue-100 bg-blue-50/20 shadow-none overflow-hidden animate-in slide-in-from-top-4 duration-300">
                        <CardHeader className="bg-blue-600 text-white p-6">
                          <CardTitle className="text-sm font-black uppercase tracking-widest">Model Answer (Band 9.0)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 text-sm text-slate-700 leading-relaxed italic prose prose-blue max-w-none">
                          {promptData.sampleAnswer}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
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
