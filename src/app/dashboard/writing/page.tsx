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
  Info,
  ChevronRight
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

  const [recentPractices, setRecentPractices] = useState<any[]>([]);
  const [recentPage, setRecentPage] = useState(1);
  const itemsPerPage = 5;

  // AI Assistant States
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantData, setAssistantData] = useState<any>(null);
  const [lastAnalyzedSentence, setLastAnalyzedSentence] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchRecommendations();
    fetchRecentPractices();
  }, []);

  // Debounced AI Assistant
  useEffect(() => {
    if (!essay || !promptData?.prompt || isSelecting) return;

    const sentences = essay.trim().split(/[.!?]+/);
    const lastSentence = sentences[sentences.length - 1]?.trim();

    if (!lastSentence || lastSentence.split(' ').length < 5 || lastSentence === lastAnalyzedSentence) return;

    const timer = setTimeout(() => {
      handleGetAssistant(lastSentence);
    }, 2500); // 2.5s debounce

    return () => clearTimeout(timer);
  }, [essay]);

  const handleGetAssistant = async (lastSentence: string) => {
    setAssistantLoading(true);
    try {
      const response = await fetch('/api/chat/writing-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay,
          prompt: promptData.prompt,
          lastSentence
        })
      });
      const data = await response.json();
      if (data.success) {
        setAssistantData(data.assistant);
        setLastAnalyzedSentence(lastSentence);
      }
    } catch (err) {
      console.error("Assistant failed");
    } finally {
      setAssistantLoading(false);
    }
  };

  const applyImprovement = () => {
    if (!assistantData?.improvement) return;
    const sentences = essay.trim().split(/[.!?]+/);
    sentences[sentences.length - 1] = " " + assistantData.improvement;
    setEssay(sentences.join('.').trim() + " ");
    setAssistantData(null);
  };

  const applyNextStep = () => {
    if (!assistantData?.nextStep) return;
    setEssay(essay.trim() + " " + assistantData.nextStep + " ");
    setAssistantData(null);
  };

  const fetchRecentPractices = async () => {
    try {
      const response = await fetch('/api/generate/content?module=Writing');
      const result = await response.json();
      if (result.success) {
        setRecentPractices(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch recent practices");
    }
  };

  const paginatedPractices = recentPractices.slice(
    (recentPage - 1) * itemsPerPage,
    recentPage * itemsPerPage
  );

  const totalPages = Math.ceil(recentPractices.length / itemsPerPage);

  const loadExistingPractice = (practice: any) => {
    setPromptData(practice.content);
    setTopic(practice.topic);
    setDifficulty(practice.difficulty);
    setIsSelecting(false);
    setEssay('');
    setAnalysis(null);
    toast.success("Resuming Practice: " + practice.topic);
  };

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
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4 md:p-6">
        <div className="max-w-2xl w-full space-y-6 md:space-y-8">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-sky-100 rounded-[20px] md:rounded-[24px] flex items-center justify-center text-sky-600 mx-auto mb-4">
              <PenTool className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Writing Practice ✍️</h1>
            <p className="text-sm md:text-base text-slate-500 font-medium">Choose a topic to generate a unique essay prompt.</p>
          </div>

          <Card className="border-slate-200 shadow-sm rounded-[24px] md:rounded-[32px] p-6 md:p-8 space-y-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3 md:space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Custom Scenario</Label>
                    <div className="flex gap-2">
                        <Input 
                        placeholder="e.g., Environment, Education, Career..." 
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        className="h-10 md:h-12 rounded-xl border-slate-200 focus-visible:ring-blue-600 text-sm"
                        />
                    </div>
                </div>
                <div className="space-y-3 md:space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Difficulty</Label>
                    <select 
                        value={difficulty} 
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full h-10 md:h-12 p-2 md:p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-bold text-xs md:text-sm"
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
                className="w-full h-11 md:h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 text-sm"
            >
                {generatingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Custom Prompt"}
            </Button>

            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recent Practices</Label>
              <div className="space-y-2 max-h-[250px] md:max-h-none overflow-y-auto pr-1">
                {recentPractices.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No saved practices found.</p>
                ) : (
                    <>
                      {paginatedPractices.map((p) => (
                          <button 
                              key={p._id}
                              onClick={() => loadExistingPractice(p)}
                              className="w-full flex items-center justify-between p-3 md:p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                      <PenTool className="w-4 h-4" />
                                  </div>
                                  <div>
                                      <p className="text-xs md:text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-1">{p.topic}</p>
                                      <Badge variant="secondary" className="text-[8px] h-3.5 uppercase">{p.difficulty}</Badge>
                                  </div>
                              </div>
                              <Sparkles className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-all shrink-0" />
                          </button>
                      ))}

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {recentPage} of {totalPages}</p>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={recentPage === 1}
                              onClick={() => setRecentPage(p => p - 1)}
                              className="h-7 w-7 md:h-8 md:w-8 p-0 rounded-lg border-slate-200"
                            >
                              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 rotate-180" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={recentPage === totalPages}
                              onClick={() => setRecentPage(p => p + 1)}
                              className="h-7 w-7 md:h-8 md:w-8 p-0 rounded-lg border-slate-200"
                            >
                              <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recommended Topics</Label>
              <div className="flex flex-wrap gap-2">
                {recommendedTopics.map((t) => (
                  <Button 
                    key={t}
                    variant="outline" 
                    onClick={() => startPractice(t)}
                    disabled={generatingPrompt}
                    className="rounded-full border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 font-bold text-[10px] px-3 h-8"
                  >
                    <Sparkles className="w-3 h-3 mr-1.5 text-amber-400" /> {t}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
          
          <Button variant="ghost" asChild className="mx-auto block w-fit text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-transparent">
            <Link href="/dashboard/practice" className="flex items-center gap-2"><ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /> Back to Practice Hub</Link>
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
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 shadow-none rounded-[24px] md:rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/30 border-b border-slate-100 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-50 text-blue-600 border-blue-100 uppercase text-[9px] md:text-[10px] whitespace-normal h-auto py-1 px-3">TASK 2: {topic.toUpperCase()}</Badge>
                </div>
                <CardTitle className="text-base md:text-lg font-bold leading-relaxed text-slate-800 break-words">
                  {promptData?.prompt}
                </CardTitle>
                <CardDescription className="text-[10px] md:text-xs font-medium text-slate-400 mt-2">
                  {promptData?.instructions}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Textarea 
                  placeholder="Type your essay here..."
                  className="min-h-[300px] md:min-h-[400px] border-0 focus-visible:ring-0 text-slate-700 leading-relaxed p-6 md:p-8 rounded-none resize-none text-sm md:text-base"
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                />
              </CardContent>
              <CardFooter className="bg-slate-50/30 border-t border-slate-100 p-4 md:p-6 flex justify-between items-center gap-4">
                <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                  Words: <span className="text-slate-900">{essay ? essay.trim().split(/\s+/).length : 0}</span>
                </div>
                <Button 
                  onClick={handleEvaluate} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 md:px-8 font-bold h-10 md:h-12 shadow-lg shadow-blue-200 text-xs md:text-sm"
                >
                  {loading ? "Analyzing..." : "Evaluate Essay"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            {/* AI Assistant / Copilot Panel */}
            <Card className="border-none shadow-xl shadow-indigo-100/50 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-50 to-white border-t-4 border-t-indigo-600">
              <CardHeader className="p-6 md:p-8 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-indigo-600 text-white border-none uppercase text-[8px] md:text-[9px] font-black tracking-widest px-3">
                    AI Writing Copilot
                  </Badge>
                  {assistantLoading && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
                </div>
                <CardTitle className="text-sm md:text-base font-black text-indigo-900">
                  Real-time Assistance
                </CardTitle>
                <CardDescription className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">
                  Keep writing to see suggestions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 pt-0 space-y-6">
                {assistantData ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                        <Sparkles className="w-3.5 h-3.5" /> Sentence Improvement
                      </div>
                      <div className="bg-white/80 p-4 rounded-2xl border border-indigo-100 shadow-sm">
                        <p className="text-sm font-medium text-slate-700 italic leading-relaxed">
                          "{assistantData.improvement}"
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                           <span className="text-[9px] font-bold text-slate-400 uppercase">{assistantData.explanation}</span>
                           <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={applyImprovement}
                              className="h-7 rounded-lg text-indigo-600 hover:bg-indigo-50 font-bold text-[10px] uppercase"
                           >
                              Apply
                           </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-indigo-100/50 pt-6">
                      <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                        <TrendingUp className="w-3.5 h-3.5" /> Logical Next Step
                      </div>
                      <div className="bg-white/80 p-4 rounded-2xl border border-indigo-100 shadow-sm">
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">
                          "{assistantData.nextStep}"
                        </p>
                        <div className="mt-3 flex justify-end">
                           <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={applyNextStep}
                              className="h-7 rounded-lg text-indigo-600 hover:bg-indigo-50 font-bold text-[10px] uppercase"
                           >
                              Continue with this
                           </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <p className="text-xs font-medium text-slate-400 max-w-[180px]">
                      {assistantLoading ? "Analyzing your writing style..." : "Write a complete sentence (min 5 words) to get AI suggestions."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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

                    {analysis.errors && analysis.errors.length > 0 && (
                      <div className="space-y-4 border-t border-slate-100 pt-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Grammar & Accuracy</p>
                        <div className="space-y-2">
                          {analysis.errors.map((err: string, i: number) => (
                            <div key={i} className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs font-medium text-red-800 leading-relaxed">
                              {err}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.vocabularyUpgrades && analysis.vocabularyUpgrades.length > 0 && (
                      <div className="space-y-4 border-t border-slate-100 pt-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vocabulary Upgrades</p>
                        <div className="space-y-2">
                          {analysis.vocabularyUpgrades.map((vocab: string, i: number) => (
                            <div key={i} className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-800 leading-relaxed">
                              {vocab}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Button variant="outline" onClick={() => setIsSelecting(true)} className="w-full rounded-xl py-6 border-slate-200 text-slate-600 font-bold">
                  Try New Prompt
                </Button>
                <Button variant="ghost" asChild className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest">
                  <Link href="/dashboard/practice">Return to Practice Hub</Link>
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
