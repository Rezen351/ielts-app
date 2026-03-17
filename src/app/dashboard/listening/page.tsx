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
  Headphones, 
  ArrowLeft, 
  Play, 
  Pause,
  CheckCircle2, 
  Clock,
  Volume2,
  Loader2
} from 'lucide-react';

export default function ListeningPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
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
          module: 'Listening',
          topic: 'University Campus Life',
          difficulty: 'Medium'
        }),
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      toast.error("Failed to load content");
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
          module: 'Listening',
          topic: 'University Campus Life',
          score: (correctCount / data.questions.length) * 9,
          maxScore: 9,
          data: { answers }
        }),
      });
    }
    
    toast.success("Listening Test Complete");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generating Audio Experience...</p>
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
            <Headphones className="w-5 h-5 text-blue-500" />
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Listening Module</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 px-4 py-2 rounded-full font-mono font-bold text-sm text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
          <Button onClick={handleSubmit} disabled={submitted} className="bg-blue-600 hover:bg-blue-700 rounded-full font-bold px-6">
            Finish Test
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-slate-900 text-white p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-blue-600 rounded-[24px] flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <Volume2 className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <Badge className="bg-blue-500/20 text-blue-400 border-0 uppercase tracking-widest text-[10px] font-bold">DYNAMIC SECTION 1</Badge>
              <h2 className="text-2xl font-bold">Social Needs Conversation</h2>
              <p className="text-slate-400 text-sm font-medium">Click play to listen to the AI-generated script.</p>
            </div>
            <Button 
              size="lg" 
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-16 w-16 rounded-full bg-white text-slate-900 hover:bg-slate-100 shadow-xl"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-slate-900" /> : <Play className="w-6 h-6 fill-slate-900 ml-1" />}
            </Button>
          </div>
          
          {isPlaying && (
            <div className="mt-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-500">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Transcript (For Practice Only)</p>
              <p className="text-sm text-slate-300 leading-relaxed italic">"{data?.script}"</p>
            </div>
          )}
        </Card>

        <div className="space-y-6 pb-20">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 px-2">Questions</h3>
          
          {data?.questions.map((q: any) => (
            <Card key={q.id} className={`border-slate-200 shadow-none rounded-3xl overflow-hidden bg-white transition-all ${submitted && (answers[q.id] === q.correct ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30')}`}>
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {q.id}
                  </div>
                  <p className="font-bold text-slate-800 leading-snug">{q.text}</p>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 pl-20">
                <RadioGroup 
                  value={answers[q.id]} 
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
              </CardContent>
            </Card>
          ))}

          {submitted && (
            <Card className="border-0 bg-blue-600 text-white rounded-[40px] p-12 text-center shadow-2xl">
              <h3 className="text-2xl font-black mb-2">Section Complete</h3>
              <p className="text-blue-100 mb-8 font-medium">Your score has been updated in your profile.</p>
              <div className="text-6xl font-black mb-8">{(score/data.questions.length * 9).toFixed(1)} Band</div>
              <Button variant="secondary" className="rounded-full font-bold px-10 h-12 bg-white text-slate-900" asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
