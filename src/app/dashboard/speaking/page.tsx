'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Mic, 
  ArrowLeft, 
  Bot, 
  Sparkles, 
  Volume2,
  StopCircle,
  PlayCircle,
  MessageSquare
} from 'lucide-react';

export default function SpeakingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentPart, setCurrentPart] = useState(1);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  const questions = [
    "Could you tell me your full name, please?",
    "Do you work or are you a student?",
    "What do you like most about your hometown?",
    "Do you think it's important to protect the environment?"
  ];

  const handleStartRecording = () => {
    setIsRecording(true);
    toast.info("Recording started", { description: "Speak clearly into your microphone." });
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    setLoading(true);
    
    // Simulate speech-to-text and AI analysis
    setTimeout(() => {
      setTranscript("I live in Jakarta, which is a very crowded city but full of opportunities. I like the food diversity there most.");
      setFeedback({
        score: 7.5,
        fluency: "Good pace, but some hesitation when describing hometown.",
        vocabulary: "Used 'diversity' and 'opportunities' well.",
        suggestions: ["Try to use more connecting words like 'Moreover' or 'On the other hand'.", "Practice pronouncing 'opportunities' more clearly."]
      });
      setLoading(false);
      toast.success("Analysis complete");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:px-8 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-violet-600" />
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Speaking Module</h1>
          </div>
        </div>
        <Badge className="bg-violet-50 text-violet-600 border-violet-100 px-4 py-1.5 rounded-full font-bold">Part {currentPart}: Introduction</Badge>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Examiner Area */}
        <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-[40px] overflow-hidden bg-white p-12 text-center space-y-8">
          <div className="mx-auto w-24 h-24 bg-violet-100 rounded-[32px] flex items-center justify-center text-violet-600 relative">
            <Bot className="w-12 h-12" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">AI Examiner asks:</h2>
            <p className="text-3xl font-black text-slate-900 leading-tight max-w-2xl mx-auto">
              "{questions[currentPart]}"
            </p>
          </div>

          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <Button 
                size="lg" 
                onClick={handleStartRecording}
                className="h-20 px-10 rounded-[28px] bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-2xl shadow-violet-200 flex gap-4 text-lg"
              >
                <Mic className="w-6 h-6" /> Start Speaking
              </Button>
            ) : (
              <Button 
                size="lg" 
                onClick={handleStopRecording}
                className="h-20 px-10 rounded-[28px] bg-red-600 hover:bg-red-700 text-white font-bold shadow-2xl shadow-red-200 flex gap-4 text-lg animate-pulse"
              >
                <StopCircle className="w-6 h-6" /> Stop Recording
              </Button>
            )}
          </div>
        </Card>

        {/* Results / Feedback Area */}
        {(loading || feedback) && (
          <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 px-2">Analysis Results</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 border-slate-200 shadow-none rounded-[32px] p-8 space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Transcription</p>
                  <p className="text-lg font-medium text-slate-700 italic leading-relaxed">
                    {loading ? "Transcribing your voice..." : `"${transcript}"`}
                  </p>
                </div>
                {feedback && (
                  <>
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fluency & Vocabulary</p>
                      <p className="text-sm font-medium text-slate-600">{feedback.fluency}</p>
                      <p className="text-sm font-medium text-slate-600">{feedback.vocabulary}</p>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Suggestions</p>
                      <div className="space-y-2">
                        {feedback.suggestions.map((s: string, i: number) => (
                          <div key={i} className="flex gap-3 text-sm font-medium text-slate-500">
                            <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </Card>

              <Card className="border-0 bg-slate-900 text-white rounded-[32px] p-8 flex flex-col items-center justify-center text-center shadow-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Estimated Band</p>
                {loading ? (
                  <div className="h-20 w-20 border-4 border-slate-800 border-t-violet-600 rounded-full animate-spin"></div>
                ) : (
                  <div className="text-7xl font-black text-violet-500 tracking-tighter mb-4">{feedback?.score}</div>
                )}
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Part 1 Performance</p>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
