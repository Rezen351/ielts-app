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
  Sparkles,
  Info,
  ChevronRight
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
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [isSelecting, setIsSelecting] = useState(true);
  const [recommendedTopics, setRecommendedTopics] = useState<string[]>([]);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  
  const playerRef = useRef<SpeechSDK.SpeakerAudioDestination | null>(null);
  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);
  const authRef = useRef<{token: string, region: string} | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [recentPractices, setRecentPractices] = useState<any[]>([]);
  const [recentPage, setRecentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchRecommendations();
    fetchRecentPractices();
    return () => {
      stopAudio();
    };
  }, []);

  const fetchRecentPractices = async () => {
    try {
      const response = await fetch('/api/generate/content?module=Listening');
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
    
    // Parse dialogue
    const lines = practice.content.script.split('\n').filter((l: string) => l.trim() !== '');
    const uniqueSpeakers: string[] = [];
    let lastAssignedVoice = "en-GB-RyanNeural";

    const getVoiceForSpeaker = (name: string, index: number) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('woman') || lowerName.includes('female') || lowerName.includes('girl') || lowerName.includes('mrs') || lowerName.includes('ms')) {
            return "en-GB-LibbyNeural";
        }
        if (lowerName.includes('man') || lowerName.includes('male') || lowerName.includes('boy') || lowerName.includes('mr')) {
            return "en-GB-RyanNeural";
        }
        return index % 2 === 0 ? "en-GB-RyanNeural" : "en-GB-LibbyNeural";
    };

    const parsedDialogue = lines.map((line: string) => {
      const match = line.match(/^([^:]+):/);
      let speakerName = match ? match[1].trim() : null;
      let content = match ? line.substring(match[0].length).trim() : line.trim();
      let voice = "";

      if (speakerName) {
        const lowerName = speakerName.toLowerCase();
        if (!uniqueSpeakers.includes(lowerName)) uniqueSpeakers.push(lowerName);
        const speakerIndex = uniqueSpeakers.indexOf(lowerName);
        voice = getVoiceForSpeaker(speakerName, speakerIndex);
      } else {
        voice = lastAssignedVoice === "en-GB-LibbyNeural" ? "en-GB-RyanNeural" : "en-GB-LibbyNeural";
      }
      lastAssignedVoice = voice;
      return { voice, text: content };
    });

    setDialogue(parsedDialogue);
    toast.success("Resuming Practice: " + practice.topic);
  };

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

  const getSpeechToken = async () => {
    try {
      const response = await fetch('/api/auth/speech-token');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      console.error("Failed to get speech token:", err);
      throw err;
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
          difficulty: difficulty
        }),
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);

        // Flexible Speaker Detection
        const lines = result.data.script.split('\n').filter((l: string) => l.trim() !== '');
        const uniqueSpeakers: string[] = [];
        let lastAssignedVoice = "en-GB-RyanNeural";

        const getVoiceForSpeaker = (name: string, index: number) => {
            const lowerName = name.toLowerCase();
            if (lowerName.includes('woman') || lowerName.includes('female') || lowerName.includes('girl') || lowerName.includes('mrs') || lowerName.includes('ms')) {
                return "en-GB-LibbyNeural";
            }
            if (lowerName.includes('man') || lowerName.includes('male') || lowerName.includes('boy') || lowerName.includes('mr')) {
                return "en-GB-RyanNeural";
            }
            return index % 2 === 0 ? "en-GB-RyanNeural" : "en-GB-LibbyNeural";
        };

        const parsedDialogue = lines.map((line: string) => {
          const match = line.match(/^([^:]+):/);
          let speakerName = match ? match[1].trim() : null;
          let content = match ? line.substring(match[0].length).trim() : line.trim();
          let voice = "";

          if (speakerName) {
            const lowerName = speakerName.toLowerCase();
            if (!uniqueSpeakers.includes(lowerName)) uniqueSpeakers.push(lowerName);
            const speakerIndex = uniqueSpeakers.indexOf(lowerName);
            voice = getVoiceForSpeaker(speakerName, speakerIndex);
          } else {
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
    const cacheKey = `listening-practice-${topic}-${difficulty}`;

    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // Check Cache
    if (audioCache[cacheKey]) {
      if (audioRef.current) {
        audioRef.current.src = audioCache[cacheKey];
        audioRef.current.play();
        setIsPlaying(true);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      return;
    }

    try {
      const { token, region } = await getSpeechToken();
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechSynthesisLanguage = "en-GB";

      // Helper to escape XML
      const escapeXml = (unsafe: string) => {
        return unsafe.replace(/[<>&"']/g, (c) => {
          switch (c) {
            case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;';
            case '"': return '&quot;'; case "'": return '&apos;'; default: return c;
          }
        });
      };

      // Generate ONE single SSML for the entire conversation
      let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">`;
      dialogue.forEach((line) => {
        ssml += `<voice name="${line.voice}">${escapeXml(line.text)}<break time="500ms"/></voice>`;
      });
      ssml += `</speak>`;

      const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);
      
      synthesizer.speakSsmlAsync(ssml, result => {
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          const blob = new Blob([result.audioData], { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          
          setAudioCache(prev => ({ ...prev, [cacheKey]: url }));
          
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play();
            setIsPlaying(true);
            audioRef.current.onended = () => setIsPlaying(false);
          }
        } else {
          toast.error("Speech Synthesis Failed");
        }
        synthesizer.close();
      }, err => {
        console.error(err);
        toast.error("Audio Generation Error");
      });

    } catch (err) {
      toast.error("Synthesis failed");
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
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4 md:p-6">
        <div className="max-w-2xl w-full space-y-6 md:space-y-8">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-[20px] md:rounded-[24px] flex items-center justify-center text-blue-600 mx-auto mb-4">
              <Headphones className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Listening Practice🎧</h1>
            <p className="text-sm md:text-base text-slate-500 font-medium">Generate a unique listening scenario based on your choice.</p>
          </div>

          <Card className="border-slate-200 shadow-sm rounded-[24px] md:rounded-[32px] p-6 md:p-8 space-y-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3 md:space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Custom Scenario</Label>
                    <div className="flex gap-2">
                        <Input 
                        placeholder="e.g., Job Interview, Hotel..." 
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
                disabled={!customTopic.trim() || loading}
                className="w-full h-11 md:h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 text-sm"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Custom Practice"}
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
                                      <Headphones className="w-4 h-4" />
                                  </div>
                                  <div>
                                      <p className="text-xs md:text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-1">{p.topic}</p>
                                      <Badge variant="secondary" className="text-[8px] h-3.5 uppercase">{p.difficulty}</Badge>
                                  </div>
                              </div>
                              <Play className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-all shrink-0" />
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
                    disabled={loading}
                    className="rounded-full border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 font-bold text-[10px] px-3 h-8"
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
        <audio ref={audioRef} className="hidden" />
        <Card className="border-slate-200 shadow-2xl shadow-slate-200/50 rounded-[32px] md:rounded-[40px] overflow-hidden bg-slate-900 text-white p-6 md:p-10 relative">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10 w-full">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-600 rounded-[24px] md:rounded-[32px] flex items-center justify-center shadow-2xl shadow-blue-500/40 relative shrink-0">
              <Volume2 className="w-8 h-8 md:w-10 md:h-10 text-white" />
              {isPlaying && <div className="absolute -inset-2 border-2 border-blue-400 rounded-[28px] md:rounded-[36px] animate-ping opacity-25"></div>}
            </div>
            <div className="flex-1 text-center md:text-left space-y-3 min-w-0 w-full">
              <Badge className="bg-blue-500/20 text-blue-400 border-0 uppercase tracking-widest text-[10px] font-bold whitespace-normal h-auto py-1.5 px-4 text-center md:text-left inline-block">
                TOPIC: {topic.toUpperCase()}
              </Badge>
              <h2 className="text-xl md:text-2xl font-bold break-words leading-tight">Social & Academic Conversation</h2>
              <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed max-w-md mx-auto md:mx-0">
                Listen to the recording and answer the questions.
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={handlePlayAudio}
              className={`h-16 w-16 md:h-20 md:w-20 rounded-full shadow-2xl transition-all active:scale-95 shrink-0 ${isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
            >
              {isPlaying ? <Pause className="w-6 h-6 md:w-8 md:h-8 fill-current" /> : <Play className="w-6 h-6 md:w-8 md:h-8 fill-current ml-1" />}
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

                {submitted && (
                  <div className={`mt-6 p-4 rounded-2xl border flex gap-4 ${answers[q.id] === q.correct ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-black">Correct Answer: {q.correct}</p>
                      <p className="font-medium italic leading-relaxed">
                        {data?.discussion?.find((d: any) => d.questionId === q.id)?.explanation || "No explanation available for this question."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {submitted && (
            <Card className="border-0 bg-blue-600 text-white rounded-[40px] p-12 text-center shadow-2xl shadow-blue-200">
              <h3 className="text-2xl font-black mb-2">Practice Complete</h3>
              <div className="text-6xl font-black mb-8">{(score/data.questions.length * 9).toFixed(1)} <span className="text-xl opacity-50">Band</span></div>
              <div className="flex gap-4 justify-center">
                <Button variant="secondary" className="rounded-full font-bold px-10 h-12 bg-white text-slate-900" asChild>
                  <Link href="/dashboard/practice">Practice Hub</Link>
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
