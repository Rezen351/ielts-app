'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  BookOpen, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Info
} from 'lucide-react';

export default function ReadingPage() {
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [topic, setTopic] = useState('Technology and Environment');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [isSelecting, setIsSelecting] = useState(true);
  const [recommendedTopics, setRecommendedTopics] = useState<string[]>([]);

  const [recentPractices, setRecentPractices] = useState<any[]>([]);
  const [recentPage, setRecentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchRecommendations();
    fetchRecentPractices();
  }, []);

  const fetchRecentPractices = async () => {
    try {
      const response = await fetch('/api/generate/content?module=Reading');
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
    setData(practice.content);
    setTopic(practice.topic);
    setDifficulty(practice.difficulty);
    setIsSelecting(false);
    setSubmitted(false);
    setAnswers({});
    toast.success("Resuming Practice: " + practice.topic);
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/recommendations/topics');
      const result = await response.json();
      if (result.success) {
        setRecommendedTopics(result.topics.Reading || []);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations");
    }
  };

  const startPractice = async (selectedTopic: string) => {
    setLoading(true);
    setIsSelecting(false);
    try {
      const response = await fetch('/api/generate/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'Reading',
          topic: selectedTopic,
          difficulty: difficulty
        }),
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setTopic(selectedTopic);
        setTimeLeft(3600);
        setAnswers({});
        setSubmitted(false);
      } else {
        toast.error("Failed to load content");
        setIsSelecting(true);
      }
    } catch (err) {
      toast.error("Network error");
      setIsSelecting(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft > 0 && !submitted && !loading && !isSelecting) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, submitted, loading, isSelecting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    let correctCount = 0;
    data.questions.forEach((q: any) => {
      if (answers[q.id] === q.correct) correctCount++;
    });
    setScore(correctCount);
    
    // Save to DB
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      await fetch('/api/user/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          module: 'Reading',
          topic: data?.title || topic,
          score: (correctCount / data.questions.length) * 9, 
          maxScore: 9,
          data: { answers }
        }),
      });
    }
    
    toast.success("Test Submitted");
  };

  if (isSelecting) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-100 rounded-[24px] flex items-center justify-center text-blue-600 mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reading Practice📖</h1>
            <p className="text-slate-500 font-medium">Select a topic or enter your own to generate a unique IELTS passage.</p>
          </div>

          <Card className="border-slate-200 shadow-sm rounded-[32px] p-8 space-y-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Custom Scenario</Label>
                    <div className="flex gap-2">
                        <Input 
                        placeholder="e.g., Archaeology, Space, Health..." 
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
                disabled={!customTopic.trim() || loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Custom Practice"}
            </Button>

            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recent Practices</Label>
              <div className="space-y-2">
                {recentPractices.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No saved practices found.</p>
                ) : (
                    <>
                      {paginatedPractices.map((p) => (
                          <button 
                              key={p._id}
                              onClick={() => loadExistingPractice(p)}
                              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                      <BookOpen className="w-4 h-4" />
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{p.topic}</p>
                                      <Badge variant="secondary" className="text-[8px] h-3.5 uppercase">{p.difficulty}</Badge>
                                  </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-all" />
                          </button>
                      ))}

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {recentPage} of {totalPages}</p>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={recentPage === 1}
                              onClick={() => setRecentPage(p => p - 1)}
                              className="h-8 w-8 p-0 rounded-lg border-slate-200"
                            >
                              <ChevronRight className="w-4 h-4 rotate-180" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={recentPage === totalPages}
                              onClick={() => setRecentPage(p => p + 1)}
                              className="h-8 w-8 p-0 rounded-lg border-slate-200"
                            >
                              <ChevronRight className="w-4 h-4" />
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
                    disabled={loading}
                    className="rounded-full border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 font-bold text-xs"
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-6">
          AI is generating your unique IELTS passage...
        </p>
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
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Reading Practice</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-sm ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
          <Button onClick={handleSubmit} disabled={submitted} className="bg-blue-600 hover:bg-blue-700 rounded-full font-bold px-6">
            Submit Test
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2 space-y-6">
          <Card className="border-slate-200 shadow-none rounded-[32px] overflow-hidden h-fit sticky top-24 bg-white">
            <CardHeader className="p-10 pb-4">
              <Badge variant="outline" className="mb-4 border-slate-200 text-slate-400 font-bold tracking-widest text-[10px]">DYNAMIC PASSAGE: {topic.toUpperCase()}</Badge>
              <CardTitle className="text-3xl font-black text-slate-900 leading-tight">
                {data?.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 pt-4 text-slate-600 leading-relaxed text-lg font-medium space-y-6">
              {data?.passage.split('\n\n').map((p: string, i: number) => (
                <p key={i}>{p}</p>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:w-1/2 space-y-6 pb-20">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 px-2">Questions</h2>
          
          {data?.questions.map((q: any) => (
            <Card key={q.id} className={`border-slate-200 shadow-none rounded-3xl overflow-hidden bg-white transition-all ${submitted && (answers[q.id] === q.correct ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30')}`}>
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 ${submitted ? (answers[q.id] === q.correct ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 text-slate-400'}`}>
                    {q.id}
                  </div>
                  <p className="font-bold text-slate-800 leading-snug">{q.text}</p>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 pl-20">
                <RadioGroup 
                  value={answers[q.id] || ""} 
                  onValueChange={(val) => setAnswers({...answers, [q.id]: val})}
                  disabled={submitted}
                >
                  {q.options.map((opt: string) => (
                    <div key={opt} className="flex items-center space-x-3 space-y-2">
                      <RadioGroupItem value={opt} id={`q${q.id}-${opt}`} className="text-blue-600 border-slate-300" />
                      <Label htmlFor={`q${q.id}-${opt}`} className={`text-sm font-medium ${submitted && opt === q.correct ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                
                {submitted && (
                  <div className={`mt-6 p-4 rounded-2xl border flex gap-4 ${answers[q.id] === q.correct ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-sm space-y-1">
                      <p className="font-black">Correct Answer: {q.correct}</p>
                      <p className="font-medium italic leading-relaxed">
                        {data?.discussion?.find((d: any) => d.questionId === q.id)?.explanation || "No discussion available for this question."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {submitted && (
            <Card className="border-blue-200 bg-slate-900 text-white rounded-[32px] p-10 text-center shadow-xl">
              <h3 className="text-xl font-bold mb-2">Test Completed!</h3>
              <p className="text-slate-400 mb-6 font-bold uppercase tracking-widest text-[10px]">Your dynamic score</p>
              <div className="text-6xl font-black text-blue-500 mb-8">{score} / {data.questions.length}</div>
              <div className="flex gap-4 justify-center">
                <Button variant="secondary" className="rounded-full font-bold px-8 bg-white text-slate-900 hover:bg-slate-100" asChild>
                  <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
                <Button variant="outline" onClick={() => setIsSelecting(true)} className="rounded-full font-bold px-8 border-white/20 text-white hover:bg-white/10">
                  Try New Topic
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
