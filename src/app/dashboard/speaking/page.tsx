'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { 
  Mic, 
  ArrowLeft, 
  Bot, 
  Sparkles, 
  StopCircle,
  TrendingUp,
  Volume2,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

export default function SpeakingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentPart, setCurrentPart] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isSelecting, setIsSelecting] = useState(true);
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [recommendedTopics, setRecommendedTopics] = useState<string[]>([]);
  
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchRecommendations();
    
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.close();
      }
    };
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/recommendations/topics');
      const result = await response.json();
      if (result.success) {
        setRecommendedTopics(result.topics.Speaking || []);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations");
    }
  };

  const startPractice = async (selectedTopic: string) => {
    setGeneratingQuestions(true);
    setIsSelecting(false);
    try {
      const speakingProgress = user?.progress?.Speaking || { difficulty: 'Medium' };
      const difficulty = speakingProgress.difficulty;

      const response = await fetch('/api/generate/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'Speaking',
          topic: selectedTopic,
          difficulty: difficulty
        }),
      });
      const result = await response.json();
      if (result.success) {
        setQuestions(result.data.questions);
        setTopic(selectedTopic);
        setCurrentPart(0);
        setTranscript('');
        setFeedback(null);
      } else {
        toast.error("Failed to load questions");
        setIsSelecting(true);
      }
    } catch (err) {
      toast.error("Network error");
      setIsSelecting(true);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const startStreaming = async () => {
    try {
      const response = await fetch('/api/auth/speech-token');
      const { token, region } = await response.json();

      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = 'en-US';
      
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

      recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          setTranscript(prev => prev + ' ' + e.result.text);
        }
      };

      recognizer.startContinuousRecognitionAsync();
      recognizerRef.current = recognizer;
      setIsRecording(true);
      toast.info("Recording started");

    } catch (err) {
      toast.error("Speech Service Error");
    }
  };

  const stopStreaming = async () => {
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync();
      setIsRecording(false);
      setLoading(true);
      await analyzeSpeaking(transcript);
    }
  };

  const analyzeSpeaking = async (text: string) => {
    try {
      const response = await fetch('/api/evaluate/writing', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay: text,
          taskType: 'Speaking Part 1',
          prompt: questions[currentPart],
          userId: user?.id
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setFeedback(data.analysis);
        toast.success("Analysis Complete");
      }
    } catch (err) {
      toast.error("Analysis Failed");
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    setCurrentPart(prev => (prev + 1) % questions.length);
    setTranscript('');
    setFeedback(null);
    setShowTranslation(false);
  };

  if (isSelecting) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-violet-100 rounded-[24px] flex items-center justify-center text-violet-600 mx-auto mb-4">
              <Mic className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Speaking Coach</h1>
            <p className="text-slate-500 font-medium">Generate IELTS Speaking Part 1 questions based on your interest.</p>
          </div>

          <Card className="border-slate-200 shadow-sm rounded-[32px] p-8 space-y-6 bg-white">
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Custom Topic</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g., Photography, Hometown, Childhood, Future Plans..." 
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 focus-visible:ring-violet-600"
                />
                <Button 
                  onClick={() => startPractice(customTopic)}
                  disabled={!customTopic.trim() || generatingQuestions}
                  className="h-12 px-6 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl"
                >
                  {generatingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
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
                    disabled={generatingQuestions}
                    className="rounded-full border-slate-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 font-bold text-xs"
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

  if (generatingQuestions) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI is preparing your interview questions...</p>
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
            <Mic className="w-5 h-5 text-violet-600" />
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Speaking Coach</h1>
          </div>
        </div>
        <Badge className="bg-violet-50 text-violet-600 border-violet-100 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]">
          Topic: {topic.toUpperCase()}
        </Badge>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        <Card className="border-slate-200 shadow-2xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-white p-12 text-center space-y-8">
          <div className="mx-auto w-24 h-24 bg-violet-100 rounded-[32px] flex items-center justify-center text-violet-600 relative">
            <Bot className="w-12 h-12" />
            <div className={`absolute -bottom-2 -right-2 w-8 h-8 ${isRecording ? 'bg-red-500' : 'bg-emerald-500'} border-4 border-white rounded-full flex items-center justify-center transition-colors shadow-lg`}>
              {isRecording ? <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div> : <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">AI Examiner asks:</p>
            <p className="text-3xl font-black text-slate-900 leading-tight max-w-2xl mx-auto tracking-tight">
              "{questions[currentPart]}"
            </p>
          </div>

          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <Button size="lg" onClick={startStreaming} className="h-16 px-10 rounded-[28px] bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-2xl shadow-violet-200 flex gap-4 text-base transition-all active:scale-95">
                <Mic className="w-5 h-5" /> Start Speaking
              </Button>
            ) : (
              <Button size="lg" onClick={stopStreaming} className="h-16 px-10 rounded-[28px] bg-red-600 hover:bg-red-700 text-white font-bold shadow-2xl shadow-red-200 flex gap-4 text-base animate-pulse">
                <StopCircle className="w-5 h-5" /> Finish Answer
              </Button>
            )}
          </div>
        </Card>

        {isRecording && transcript && (
          <div className="text-center p-8 animate-in fade-in duration-500">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Live Transcription</p>
             <p className="text-xl font-medium text-slate-700 italic leading-relaxed">"{transcript}..."</p>
          </div>
        )}

        {(loading || feedback) && (
          <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">AI Evaluation</h3>
              <Button variant="ghost" className="text-xs font-bold text-violet-600 uppercase tracking-widest" onClick={nextQuestion}>
                Next Question
              </Button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 border-slate-200 shadow-none rounded-[32px] p-8 space-y-8 bg-white">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Response</p>
                    {user?.nativeLanguage !== 'en' && feedback && (
                      <Button variant="ghost" size="sm" onClick={() => setShowTranslation(!showTranslation)} className="text-[10px] font-bold text-violet-600 uppercase tracking-widest gap-2">
                        {showTranslation ? <><EyeOff className="w-3 h-3" /> Original</> : <><Eye className="w-3 h-3" /> Translation</>}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-600 italic leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    "{transcript}"
                  </p>
                </div>
                {feedback && (
                  <div className="space-y-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Feedback</p>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{showTranslation ? feedback.translatedFeedback : feedback.feedback}</p>
                    <div className="space-y-3">
                      {(showTranslation ? feedback.translatedSuggestions : feedback.suggestions).slice(0, 2).map((s: string, i: number) => (
                        <div key={i} className="flex gap-4 p-4 rounded-xl bg-violet-50/50 border border-violet-100 text-xs font-medium text-slate-600">
                          <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              <Card className="border-0 bg-slate-900 text-white rounded-[32px] p-8 flex flex-col items-center justify-center text-center shadow-2xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6">Estimated Band</p>
                {loading ? (
                  <div className="h-20 w-20 border-4 border-slate-800 border-t-violet-600 rounded-full animate-spin"></div>
                ) : (
                  <div className="text-8xl font-black text-violet-500 tracking-tighter mb-4">{feedback?.overallScore || 'N/A'}</div>
                )}
                <Badge variant="outline" className="border-slate-800 text-slate-500 text-[10px] tracking-widest uppercase">Real-time analysis</Badge>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
