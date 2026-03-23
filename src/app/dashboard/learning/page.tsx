'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  BookOpen, 
  Target, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Lock,
  BrainCircuit,
  GraduationCap,
  ArrowLeft
} from 'lucide-react';
import ChatWidget from '@/components/chat/ChatWidget';

export default function LearningDashboard() {
  const [user, setUser] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosticTest, setDiagnosticTest] = useState<any>(null);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<any>({});
  const [submittingDiagnostic, setSubmittingDiagnostic] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchRoadmap();
    }
  }, [user]);

  const fetchRoadmap = async () => {
    try {
      const roadmapRes = await fetch(`/api/user/insights/roadmap?userId=${user.id}`);
      if (roadmapRes.ok) {
        const roadmapData = await roadmapRes.json();
        setRoadmap(roadmapData.roadmap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startDiagnostic = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/insights/diagnostic?userId=${user.id}`);
      const data = await res.json();
      setDiagnosticTest(data.questions);
    } catch (err) {
      toast.error("Failed to load assessment questions");
    } finally {
      setLoading(false);
    }
  };

  const submitDiagnostic = async () => {
    setSubmittingDiagnostic(true);
    try {
      const res = await fetch('/api/user/insights/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          answers: diagnosticAnswers,
          goalBand: user.goalBand || 7.0
        })
      });
      const data = await res.json();
      if (data.success) {
        setRoadmap(data.roadmap);
        setDiagnosticTest(null);
        toast.success("Roadmap generated!", { description: `Baseline: Band ${data.analysis.baselineBand}` });
      }
    } catch (err) {
      toast.error("Evaluation failed");
    } finally {
      setSubmittingDiagnostic(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading your learning path...</div>;

  // 1. Diagnostic View
  if (diagnosticTest) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <BrainCircuit className="w-12 h-12 text-blue-600 mx-auto" />
            <h1 className="text-3xl font-bold text-slate-900">Skill Assessment</h1>
            <p className="text-slate-500">Answer these 5 questions to find your starting point.</p>
          </div>

          <div className="space-y-6">
            {diagnosticTest.map((q: any, idx: number) => (
              <Card key={q.id} className="border-slate-200 shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                      {q.category}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Question {idx + 1}/5
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-800 leading-relaxed">
                    {q.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => setDiagnosticAnswers({ ...diagnosticAnswers, [q.id]: opt })}
                      className={`p-4 text-left rounded-xl border-2 transition-all font-medium text-sm ${
                        diagnosticAnswers[q.id] === opt 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-slate-100 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center pt-8">
            <Button 
              onClick={submitDiagnostic} 
              disabled={submittingDiagnostic || Object.keys(diagnosticAnswers).length < 5}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 px-12 font-bold text-lg shadow-xl shadow-slate-200"
            >
              {submittingDiagnostic ? "Analyzing..." : "Generate My Roadmap"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Roadmap View
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:px-8 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-slate-600" />
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">AI Learning</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-12">
        {roadmap ? (
          <>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest text-xs uppercase">
                  <Target className="w-4 h-4" /> Personalized Roadmap
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  Your Journey to Band {user?.goalBand || '7.5'}
                </h1>
                <p className="text-slate-500 font-medium">
                  We've analyzed your level (Band {roadmap.baselineBand}) and curated these skill-based topics.
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Baseline</div>
                  <div className="text-xl font-bold text-slate-900">Band {roadmap.baselineBand}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" /> Learning Sequence
                </h2>
                <div className="space-y-4">
                  {roadmap.topics.map((topic: any, idx: number) => (
                    <Link 
                      key={topic.topicId} 
                      href={topic.status === 'Locked' ? '#' : `/dashboard/learning/${topic.topicId}`}
                      className={`block border-slate-200 shadow-none rounded-[24px] transition-all overflow-hidden bg-white border ${
                        topic.status === 'Locked' ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50 cursor-pointer'
                      }`}
                    >
                      <div className="p-6 flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          topic.status === 'Completed' ? 'bg-green-100 text-green-600' :
                          topic.status === 'Available' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {topic.status === 'Completed' ? <CheckCircle2 className="w-6 h-6" /> : idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">{topic.category}</div>
                          <h3 className="font-bold text-slate-900 text-lg">{topic.title}</h3>
                        </div>
                        {topic.status === 'Locked' ? (
                          <Lock className="w-5 h-5 text-slate-300" />
                        ) : (
                          <ArrowRight className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <Card className="border-slate-200 shadow-none rounded-[32px] bg-slate-900 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles className="w-32 h-32" />
                  </div>
                  <CardHeader className="p-8">
                    <CardTitle className="text-2xl font-bold">Smart Tutor Tip</CardTitle>
                    <CardDescription className="text-slate-400">Personalized insight for your level.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <p className="text-lg leading-relaxed text-slate-200 italic">
                      "Since you're aiming for Band {user?.goalBand}, focusing on complex sentence synthesis will be your fastest route to a higher score. Your baseline shows great vocabulary, but let's connect those ideas better!"
                    </p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4">
                  <h2 className="text-xl font-bold text-slate-800">Quick Stats</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center">
                      <div className="text-3xl font-bold text-blue-600">0%</div>
                      <div className="text-xs font-bold text-slate-400 uppercase mt-2">Completion</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center">
                      <div className="text-3xl font-bold text-green-600">0</div>
                      <div className="text-xs font-bold text-slate-400 uppercase mt-2">Notes Saved</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto text-center space-y-8 py-20">
            <div className="w-24 h-24 bg-blue-100 rounded-[40px] flex items-center justify-center mx-auto">
              <Sparkles className="w-12 h-12 text-blue-600" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold text-slate-900">Let's build your path.</h1>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                Before we start, we need to understand your current English level to provide the most relevant materials for your Goal Band.
              </p>
            </div>
            <Button 
              onClick={startDiagnostic}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-16 px-12 font-bold text-xl shadow-2xl shadow-slate-200 group"
            >
              Start Skill Assessment <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        )}
      </main>

      {/* Context-Aware Chat Tutor */}
      <ChatWidget 
        context={roadmap ? `User is in their Learning Dashboard. Their baseline is Band ${roadmap.baselineBand} and they are working through a personalized roadmap towards Band ${user?.goalBand}.` : "User is about to take their English Diagnostic Assessment."} 
      />
    </div>
  );
}
