'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  BookOpen, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function ReadingPage() {
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchNewContent();
  }, []);

  const fetchNewContent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'Reading',
          topic: 'Technology and Environment',
          difficulty: 'Medium'
        }),
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Failed to load content");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft > 0 && !submitted && !loading) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, submitted, loading]);

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
          topic: 'Technology and Environment',
          score: (correctCount / data.questions.length) * 9, // Convert to IELTS band
          maxScore: 9,
          data: { answers }
        }),
      });
    }
    
    toast.success("Test Submitted");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generating IELTS Content...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:px-8 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Reading Module</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-sm ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
          <Button onClick={handleSubmit} disabled={submitted} className="bg-indigo-600 hover:bg-indigo-700 rounded-full font-bold px-6">
            Submit Test
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2 space-y-6">
          <Card className="border-slate-200 shadow-none rounded-[32px] overflow-hidden h-fit sticky top-24 bg-white">
            <CardHeader className="p-10 pb-4">
              <Badge variant="outline" className="mb-4 border-slate-200 text-slate-400 font-bold tracking-widest text-[10px]">DYNAMIC PASSAGE</Badge>
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
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
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
                      <RadioGroupItem value={opt} id={`q${q.id}-${opt}`} className="text-indigo-600 border-slate-300" />
                      <Label htmlFor={`q${q.id}-${opt}`} className={`text-sm font-medium ${submitted && opt === q.correct ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}

          {submitted && (
            <Card className="border-indigo-200 bg-slate-900 text-white rounded-[32px] p-10 text-center shadow-xl">
              <h3 className="text-xl font-bold mb-2">Test Completed!</h3>
              <p className="text-slate-400 mb-6 font-bold uppercase tracking-widest text-[10px]">Your dynamic score</p>
              <div className="text-6xl font-black text-indigo-500 mb-8">{score} / {data.questions.length}</div>
              <Button variant="secondary" className="rounded-full font-bold px-8 bg-white text-slate-900 hover:bg-slate-100" asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
