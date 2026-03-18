'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { 
  Headphones, 
  ArrowLeft, 
  Play, 
  Pause,
  CheckCircle2, 
  Clock,
  Volume2,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function ListeningPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  const playerRef = useRef<SpeechSDK.SpeakerAudioDestination | null>(null);
  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);

  useEffect(() => {
    fetchNewContent();
    return () => {
      stopAudio();
    };
  }, []);

  const fetchNewContent = async () => {
    setLoading(true);
    stopAudio();
    try {
      const response = await fetch('/api/generate/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'Listening',
          topic: 'Academic Life and Services',
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

  const stopAudio = () => {
    if (playerRef.current) {
      playerRef.current.pause();
    }
    setIsPlaying(false);
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!data?.script) return;

    try {
      // 1. Get Token
      const tokenRes = await fetch('/api/auth/speech-token');
      const { token, region } = await tokenRes.json();

      // 2. Setup Config
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechSynthesisVoiceName = "en-US-AndrewMultilingualNeural"; // High quality male voice
      
      playerRef.current = new SpeechSDK.SpeakerAudioDestination();
      const audioConfig = SpeechSDK.AudioConfig.fromSpeakerOutput(playerRef.current);
      
      synthesizerRef.current = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);

      playerRef.current.onAudioEnd = () => {
        setIsPlaying(false);
      };

      setIsPlaying(true);
      synthesizerRef.current.speakTextAsync(
        data.script,
        result => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            console.log("Synthesis finished.");
          } else {
            console.error("Speech synthesis cancelled or failed: " + result.errorDetails);
            setIsPlaying(false);
          }
          synthesizerRef.current?.close();
        },
        err => {
          console.error(err);
          setIsPlaying(false);
          synthesizerRef.current?.close();
        }
      );

    } catch (err) {
      toast.error("Audio Error", { description: "Failed to initialize AI voice." });
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
    stopAudio();
    let correctCount = 0;
    data.questions.forEach((q: any) => {
      if (answers[q.id] === q.correct) correctCount++;
    });
    setScore(correctCount);
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      await fetch('/api/user/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          module: 'Listening',
          topic: 'Academic Life Conversation',
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
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-6">
          AI is composing a unique listening scenario for you...
        </p>
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
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Listening Practice</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 px-4 py-2 rounded-full font-mono font-bold text-sm text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
          <Button onClick={handleSubmit} disabled={submitted} className="bg-blue-600 hover:bg-blue-700 rounded-full font-bold px-6 shadow-lg shadow-blue-200">
            Finish Test
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        <Card className="border-slate-200 shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-slate-900 text-white p-10 relative">
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-blue-500/40 relative">
              <Volume2 className="w-10 h-10 text-white" />
              {isPlaying && <div className="absolute -inset-2 border-2 border-blue-400 rounded-[36px] animate-ping opacity-25"></div>}
            </div>
            <div className="flex-1 text-center md:text-left space-y-3">
              <Badge className="bg-blue-500/20 text-blue-400 border-0 uppercase tracking-widest text-[10px] font-bold">Dynamic AI Content</Badge>
              <h2 className="text-2xl font-bold">Social & Academic Conversation</h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Listen to the recording and answer the questions. You can replay the audio if needed in this practice mode.
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={handlePlayAudio}
              className={`h-20 w-20 rounded-full shadow-2xl transition-all active:scale-95 ${isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </Button>
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]"></div>
        </Card>

        <div className="space-y-6 pb-24">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Questions 1-3</h3>
            <Button variant="ghost" size="sm" onClick={fetchNewContent} className="text-slate-400 hover:text-blue-600 gap-2">
              <RefreshCw className="w-3 h-3" /> New Script
            </Button>
          </div>
          
          {data?.questions.map((q: any) => (
            <Card key={q.id} className={`border-slate-200 shadow-none rounded-3xl overflow-hidden bg-white transition-all duration-500 ${submitted && (answers[q.id] === q.correct ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30')}`}>
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${submitted ? (answers[q.id] === q.correct ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 text-slate-400'}`}>
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
                {submitted && answers[q.id] !== q.correct && (
                  <div className="mt-4 text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3" /> Correct: {q.correct}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {submitted && (
            <Card className="border-0 bg-blue-600 text-white rounded-[40px] p-12 text-center shadow-2xl shadow-blue-200 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <TrophyIcon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black mb-2">Practice Complete</h3>
              <p className="text-blue-100 mb-8 font-medium">Excellent work! Your listening skills are improving.</p>
              <div className="text-6xl font-black mb-8">{(score/data.questions.length * 9).toFixed(1)} <span className="text-xl opacity-50">Band</span></div>
              <div className="flex gap-4 justify-center">
                <Button variant="secondary" className="rounded-full font-bold px-10 h-12 bg-white text-slate-900" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="outline" onClick={fetchNewContent} className="rounded-full font-bold px-10 h-12 border-white/20 text-white hover:bg-white/10">
                  Try Another
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function TrophyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
