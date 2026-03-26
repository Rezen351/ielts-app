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
  Loader2,
  Info,
  ChevronRight
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
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questions, setQuestions] = useState<any[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [recommendedTopics, setRecommendedTopics] = useState<string[]>([]);
  const [showSample, setShowSample] = useState(false);
  
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);

  const [recentPractices, setRecentPractices] = useState<any[]>([]);
  const [recentPage, setRecentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchRecommendations();
    fetchRecentPractices();
    
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.close();
      }
    };
  }, []);

  const fetchRecentPractices = async () => {
    try {
      const response = await fetch('/api/generate/content?module=Speaking');
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
    setQuestions(practice.content.questions);
    setTopic(practice.topic);
    setDifficulty(practice.difficulty);
    setIsSelecting(false);
    setCurrentPart(0);
    setTranscript('');
    setFeedback(null);
    toast.success("Resuming Practice: " + practice.topic);
  };

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
      const response = await fetch('/api/generate/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'Speaking',
          topic: selectedTopic,
          difficulty: difficulty,
          userId: user?.id
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
          prompt: questions[currentPart]?.text,
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
    setShowSample(false);
  };

  if (isSelecting) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4 md:p-6">
        <div className="max-w-2xl w-full space-y-6 md:space-y-8">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-violet-100 rounded-[20px] md:rounded-[24px] flex items-center justify-center text-violet-600 mx-auto mb-4">
              <Mic className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Speaking Practice📢</h1>
            <p className="text-sm md:text-base text-slate-500 font-medium">Generate IELTS Speaking questions based on your interest.</p>
          </div>

          <Card className="border-slate-200 shadow-sm rounded-[24px] md:rounded-[32px] p-6 md:p-8 space-y-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3 md:space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Custom Topic</Label>
                    <div className="flex gap-2">
                        <Input 
                        placeholder="e.g., Daily Routine, Study..." 
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        className="h-10 md:h-12 rounded-xl border-slate-200 focus-visible:ring-violet-600 text-sm"
                        />
                    </div>
                </div>
                <div className="space-y-3 md:space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Difficulty</Label>
                    <select 
                        value={difficulty} 
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full h-10 md:h-12 p-2 md:p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 bg-white font-bold text-xs md:text-sm"
                    >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                    </select>
                </div>
            </div>

            <Button 
                onClick={() => startPractice(customTopic)}
                disabled={!customTopic.trim() || generatingQuestions}
                className="w-full h-11 md:h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-100 text-sm"
            >
                {generatingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Custom Questions"}
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
                              className="w-full flex items-center justify-between p-3 md:p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-violet-200 hover:bg-violet-50/50 transition-all text-left group"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-violet-600 transition-colors">
                                      <Mic className="w-4 h-4" />
                                  </div>
                                  <div>
                                      <p className="text-xs md:text-sm font-bold text-slate-700 group-hover:text-violet-600 transition-colors line-clamp-1">{p.topic}</p>
                                      <Badge variant="secondary" className="text-[8px] h-3.5 uppercase">{p.difficulty}</Badge>
                                  </div>
                              </div>
                              <Sparkles className="w-4 h-4 text-slate-300 group-hover:text-violet-600 transition-all shrink-0" />
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
                    disabled={generatingQuestions}
                    className="rounded-full border-slate-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 font-bold text-[10px] px-3 h-8"
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
          </div>
        </div>
        <Badge className="bg-violet-50 text-violet-600 border-violet-100 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[9px] md:text-[10px] whitespace-normal h-auto max-w-[150px] md:max-w-none text-center">
          Topic: {topic.toUpperCase()}
        </Badge>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        <Card className="border-slate-200 shadow-2xl shadow-slate-200/50 rounded-[32px] md:rounded-[40px] overflow-hidden bg-white p-6 md:p-12 text-center space-y-6 md:space-y-8">
          <div className="mx-auto w-20 h-20 md:w-24 md:h-24 bg-violet-100 rounded-[28px] md:rounded-[32px] flex items-center justify-center text-violet-600 relative">
            <Bot className="w-10 h-10 md:w-12 md:h-12" />
            <div className={`absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 ${isRecording ? 'bg-red-500' : 'bg-emerald-500'} border-4 border-white rounded-full flex items-center justify-center transition-colors shadow-lg`}>
              {isRecording ? <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse"></div> : <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"></div>}
            </div>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400">AI Examiner asks:</p>
            <p className="text-xl md:text-3xl font-black text-slate-900 leading-tight max-w-2xl mx-auto tracking-tight break-words">
              "{questions[currentPart]?.text}"
            </p>
          </div>

          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <Button size="lg" onClick={startStreaming} className="h-14 md:h-16 px-8 md:px-10 rounded-[24px] md:rounded-[28px] bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-2xl shadow-violet-200 flex gap-3 md:gap-4 text-sm md:text-base transition-all active:scale-95">
                <Mic className="w-4 h-4 md:w-5 md:h-5" /> Start Speaking
              </Button>
            ) : (
              <Button size="lg" onClick={stopStreaming} className="h-14 md:h-16 px-8 md:px-10 rounded-[24px] md:rounded-[28px] bg-red-600 hover:bg-red-700 text-white font-bold shadow-2xl shadow-red-200 flex gap-3 md:gap-4 text-sm md:text-base animate-pulse">
                <StopCircle className="w-4 h-4 md:w-5 md:h-5" /> Finish Answer
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

                    {feedback.errors && feedback.errors.length > 0 && (
                      <div className="space-y-4 border-t border-slate-100 pt-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Grammar & Accuracy</p>
                        <div className="space-y-2">
                          {feedback.errors.map((err: string, i: number) => (
                            <div key={i} className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs font-medium text-red-800 leading-relaxed">
                              {err}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {feedback.vocabularyUpgrades && feedback.vocabularyUpgrades.length > 0 && (
                      <div className="space-y-4 border-t border-slate-100 pt-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vocabulary Upgrades</p>
                        <div className="space-y-2">
                          {feedback.vocabularyUpgrades.map((vocab: string, i: number) => (
                            <div key={i} className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-800 leading-relaxed">
                              {vocab}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {questions[currentPart]?.sampleAnswer && (
                        <div className="pt-4 border-t border-slate-100">
                             <Button 
                                variant="ghost" 
                                onClick={() => setShowSample(!showSample)}
                                className="w-full rounded-xl py-4 border-violet-200 text-violet-600 font-black uppercase tracking-widest text-[10px] bg-violet-50/50 flex items-center justify-center gap-2"
                            >
                                <Info className="w-4 h-4" /> {showSample ? "Hide Sample Answer" : "View Band 9 Sample"}
                            </Button>
                            
                            {showSample && (
                                <div className="mt-4 p-6 rounded-2xl bg-slate-900 text-slate-300 text-sm italic leading-relaxed border-l-4 border-l-violet-500 animate-in slide-in-from-top-2 duration-300">
                                    <p className="text-violet-400 font-black uppercase text-[10px] tracking-widest not-italic mb-2">Model Answer (Band 9.0)</p>
                                    "{questions[currentPart].sampleAnswer}"
                                </div>
                            )}
                        </div>
                    )}
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
