'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function ListeningPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [dialogue, setDialogue] = useState<{voice: string, text: string}[]>([]);
  const [currentLine, setCurrentLine] = useState(-1);
  const [topic, setTopic] = useState('Academic Life and Services');
  const [customTopic, setCustomTopic] = useState('');
  const [isSelecting, setIsSelecting] = useState(true);
  const [recommendedTopics, setRecommendedTopics] = useState<string[]>([]);
  
  const playerRef = useRef<SpeechSDK.SpeakerAudioDestination | null>(null);
  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);
  const authRef = useRef<{token: string, region: string} | null>(null);

  useEffect(() => {
    fetchRecommendations();
    return () => {
      stopAudio();
    };
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/recommendations/topics');
      const result = await response.json();
      if (result.success) {
        setRecommendedTopics(result.topics.Listening || []);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations");
    }
  };

  const startPractice = async (selectedTopic: string) => {
    setLoading(true);
    setIsSelecting(false);
    stopAudio();
    try {
      const response = await fetch('/api/generate/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'Listening',
          topic: selectedTopic,
          difficulty: 'Medium'
        }),
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);

        // INTELLIGENT PARSER: Detect unique speakers and map to voices
        const lines = result.data.script.split('\n').filter((l: string) => l.trim() !== '');
        
        const uniqueSpeakers: string[] = [];
        let lastAssignedVoice = "en-GB-RyanNeural"; // Start opposite to Female
        
        const parsedDialogue = lines.map((line: string, index: number) => {
          const match = line.match(/^([^:]+):/);
          let speakerName = match ? match[1].trim().toLowerCase() : null;
          let content = match ? line.substring(match[0].length).trim() : line.trim();

          let voice = "";

          if (speakerName) {
            if (!uniqueSpeakers.includes(speakerName)) {
              uniqueSpeakers.push(speakerName);
            }
            const speakerIndex = uniqueSpeakers.indexOf(speakerName);
            // Speaker 1 = Libby, Speaker 2 = Ryan, etc.
            voice = speakerIndex % 2 === 0 ? "en-GB-LibbyNeural" : "en-GB-RyanNeural";
          } else {
            // Fallback: Just alternate every line if no speaker tag found
            voice = lastAssignedVoice === "en-GB-LibbyNeural" ? "en-GB-RyanNeural" : "en-GB-LibbyNeural";
          }

          lastAssignedVoice = voice;
          return { voice, text: content };
        });

        setDialogue(parsedDialogue);

        setTopic(selectedTopic);
        setTimeLeft(1800);
        setAnswers({});
        setSubmitted(false);
        setCurrentLine(-1);
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

  const stopAudio = () => {
    if (synthesizerRef.current) {
      try {
        synthesizerRef.current.close();
      } catch (e) {}
      synthesizerRef.current = null;
    }
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch (e) {}
    }
    setIsPlaying(false);
    setCurrentLine(-1);
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!dialogue.length) return;

    try {
      const tokenRes = await fetch('/api/auth/speech-token');
      const { token, region } = await tokenRes.json();

      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
      // Important: Do NOT set a default voice name here when using multi-voice SSML
      speechConfig.speechSynthesisLanguage = "en-GB"; 

      playerRef.current = new SpeechSDK.SpeakerAudioDestination();
      const audioConfig = SpeechSDK.AudioConfig.fromSpeakerOutput(playerRef.current);
      synthesizerRef.current = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);

      playerRef.current.onAudioEnd = () => {
        setIsPlaying(false);
        stopAudio();
      };

      // Helper to escape XML
      const escapeXml = (unsafe: string) => {
        return unsafe.replace(/[<>&"']/g, (c) => {
          switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            case "'": return '&apos;';
            default: return c;
          }
        });
      };

      // Generate ONE single SSML for the entire conversation
      let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">`;
      
      dialogue.forEach((line) => {
        // Move the break INSIDE the voice tag to avoid 'RootSpeak' children errors
        ssml += `<voice name="${line.voice}">${escapeXml(line.text)}<break time="500ms"/></voice>`;
      });
      
      ssml += `</speak>`;

      console.log("[Listening] Starting multi-voice playback...");
      setIsPlaying(true);

      synthesizerRef.current.speakSsmlAsync(
        ssml,
        result => {
          if (result.reason === SpeechSDK.ResultReason.Canceled) {
            // Get error details directly from the result object
            const errorDetails = (result as any).errorDetails || "No detailed error provided by Azure.";
            console.error("Synthesis Canceled. Details:", errorDetails);
            
            // Log full result for deep debugging
            console.log("[Speech Debug] Full Result Object:", result);
            
            setIsPlaying(false);
          }
        },
        err => {
          console.error("Speech Execution Error:", err);
          setIsPlaying(false);
        }
      );

    } catch (err) {
      toast.error("Audio Initialization Error");
      setIsPlaying(false);
    }
  };

  // Remove the old playLine function as it's no longer needed


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
          topic: topic,
          score: (correctCount / data.questions.length) * 9,
          maxScore: 9,
          data: { answers }
        }),
      });
    }
    
    toast.success("Listening Test Complete");
  };

  if (isSelecting) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-100 rounded-[24px] flex items-center justify-center text-blue-600 mx-auto mb-4">
              <Headphones className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Listening Practice</h1>
            <p className="text-slate-500 font-medium">Generate a unique listening scenario based on your choice.</p>
          </div>

          <Card className="border-slate-200 shadow-sm rounded-[32px] p-8 space-y-6 bg-white">
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Custom Scenario</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g., Job Interview, Hotel Check-in, Campus Tour..." 
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 focus-visible:ring-blue-600"
                />
                <Button 
                  onClick={() => startPractice(customTopic)}
                  disabled={!customTopic.trim() || loading}
                  className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
                </Button>
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
          AI is composing a unique listening scenario for you...
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
              <Badge className="bg-blue-500/20 text-blue-400 border-0 uppercase tracking-widest text-[10px] font-bold">TOPIC: {topic.toUpperCase()}</Badge>
              <h2 className="text-2xl font-bold">Social & Academic Conversation</h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Listen to the recording and answer the questions.
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
        </Card>

        <div className="space-y-6 pb-24">
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
              </CardContent>
            </Card>
          ))}

          {submitted && (
            <Card className="border-0 bg-blue-600 text-white rounded-[40px] p-12 text-center shadow-2xl shadow-blue-200">
              <h3 className="text-2xl font-black mb-2">Practice Complete</h3>
              <div className="text-6xl font-black mb-8">{(score/data.questions.length * 9).toFixed(1)} <span className="text-xl opacity-50">Band</span></div>
              <div className="flex gap-4 justify-center">
                <Button variant="secondary" className="rounded-full font-bold px-10 h-12 bg-white text-slate-900" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="outline" onClick={() => setIsSelecting(true)} className="rounded-full font-bold px-10 h-12 border-white/20 text-white hover:bg-white/10">
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
