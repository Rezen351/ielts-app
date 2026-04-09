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
  ArrowLeft,
  XCircle,
  RefreshCcw,
  BadgeAlert
} from 'lucide-react';
import ChatWidget from '@/components/chat/ChatWidget';

export default function LearningDashboard() {
  const [user, setUser] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosticTest, setDiagnosticTest] = useState<any>(null);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<any>({});
  const [submittingDiagnostic, setSubmittingDiagnostic] = useState(false);
  const [refreshingRoadmap, setRefreshingRoadmap] = useState(false);
  const [generatingMilestone, setGeneratingMilestone] = useState(false);
  const [milestoneAnswers, setMilestoneAnswers] = useState<any>({});
  const [submittingMilestone, setSubmittingMilestone] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      fetchUserProfile(parsed.id || parsed._id);
    }
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/settings?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to fetch fresh user profile");
    }
  };

  useEffect(() => {
    if (user?._id || user?.id) {
      fetchRoadmap();
    }
  }, [user]);

  const fetchRoadmap = async () => {
    const userId = user?._id || user?.id;
    try {
      const roadmapRes = await fetch(`/api/user/insights/roadmap?userId=${userId}`);
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

  const handleRefreshRoadmap = async () => {
    setRefreshingRoadmap(true);
    const userId = user?._id || user?.id;
    try {
      const res = await fetch('/api/user/insights/roadmap/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          goalBand: user.goalBand || 7.0,
          baselineBand: roadmap.baselineBand
        })
      });
      const data = await res.json();
      if (data.success) {
        setRoadmap(data.roadmap);
        toast.success("Level-up roadmap generated!", { description: "New advanced topics unlocked." });
      }
    } catch (err) {
      toast.error("Failed to refresh roadmap");
    } finally {
      setRefreshingRoadmap(false);
    }
  };

  const handleStartMilestone = async () => {
    setGeneratingMilestone(true);
    const userId = user?._id || user?.id;
    try {
      const res = await fetch('/api/generate/learning/milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        setRoadmap({ ...roadmap, status: 'Milestone_Pending', milestoneQuiz: { questions: data.quiz } });
        toast.success("Milestone Quiz generated!", { description: "Show us what you've learned." });
      }
    } catch (err) {
      toast.error("Failed to generate milestone");
    } finally {
      setGeneratingMilestone(false);
    }
  };

  const submitMilestone = async () => {
    setSubmittingMilestone(true);
    const userId = user?._id || user?.id;
    try {
      const res = await fetch('/api/evaluate/learning/milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          answers: Object.values(milestoneAnswers)
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchRoadmap(); // Refresh everything
        if (data.passed) {
          toast.success("Congratulations!", { description: "You passed the milestone!" });
        } else {
          toast.error("Not quite there yet.", { description: "Review the feedback and try again." });
        }
      }
    } catch (err) {
      toast.error("Failed to submit milestone");
    } finally {
      setSubmittingMilestone(false);
    }
  };

  const startDiagnostic = async () => {
    setLoading(true);
    const userId = user?._id || user?.id;
    try {
      const res = await fetch(`/api/user/insights/diagnostic?userId=${userId}`);
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
    const userId = user?._id || user?.id;
    try {
      const res = await fetch('/api/user/insights/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
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
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
          <div className="text-center space-y-2">
            <BrainCircuit className="w-10 h-10 md:w-12 md:h-12 text-blue-600 mx-auto" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Skill Assessment</h1>
            <p className="text-sm md:text-base text-slate-500">Answer these 5 questions to find your starting point.</p>
          </div>

          <div className="space-y-4 md:space-y-6">
            {diagnosticTest.map((q: any, idx: number) => (
              <Card key={q.id} className="border-slate-200 shadow-sm rounded-2xl">
                <CardHeader className="p-5 md:p-6 pb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                      {q.category}
                    </span>
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Question {idx + 1}/5
                    </span>
                  </div>
                  <CardTitle className="text-base md:text-lg font-bold text-slate-800 leading-relaxed">
                    {q.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 md:p-6 pt-0 grid grid-cols-1 gap-2 md:gap-3">
                  {q.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => setDiagnosticAnswers({ ...diagnosticAnswers, [q.id]: opt })}
                      className={`p-3 md:p-4 text-left rounded-xl border-2 transition-all font-medium text-xs md:text-sm ${
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

  // 1.1 Milestone Quiz View
  if (roadmap?.status === 'Milestone_Pending' && roadmap.milestoneQuiz) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 flex flex-col items-center">
        <div className="max-w-3xl w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="bg-blue-600 text-white w-fit px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mx-auto">
              Milestone Gatekeeper
            </div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">Mastery Check</h1>
            <p className="text-slate-500 font-medium max-w-md mx-auto">
              Answer these questions based on the topics you've just finished to unlock the next level.
            </p>
          </div>

          <div className="space-y-6">
            {roadmap.milestoneQuiz.questions.map((q: any, idx: number) => (
              <Card key={idx} className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden">
                <CardHeader className="p-8 md:p-10 pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                      {roadmap.topics.find((t: any) => t.topicId === q.topicId)?.title || "General"}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Question {idx + 1}/{roadmap.milestoneQuiz.questions.length}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800 leading-relaxed">
                    {q.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 md:p-10 pt-0 grid grid-cols-1 gap-3">
                  {q.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => setMilestoneAnswers({ ...milestoneAnswers, [idx]: opt })}
                      className={`p-5 text-left rounded-2xl border-2 transition-all font-bold text-sm ${
                        milestoneAnswers[idx] === opt 
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-50' 
                        : 'border-slate-50 hover:border-slate-200 text-slate-600 bg-slate-50/50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 pt-8 pb-20">
            <Button 
              onClick={submitMilestone} 
              disabled={submittingMilestone || Object.keys(milestoneAnswers).length < roadmap.milestoneQuiz.questions.length}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-[24px] h-16 px-16 font-black text-xl shadow-2xl shadow-slate-200"
            >
              {submittingMilestone ? "Evaluating..." : "Submit Assessment"}
            </Button>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              A minimum score of 80% is required to pass
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Roadmap View
  const completedTopics = roadmap?.topics?.filter((t: any) => t.status === 'Completed').length || 0;
  const totalTopics = roadmap?.topics?.length || 0;
  const completionRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

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
                <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Your Journey to Band {user?.goalBand || '7.5'}
                </h1>
                <p className="text-slate-500 font-medium">
                  {roadmap.status === 'Completed' && roadmap.milestonePassed
                    ? "Congratulations! You've mastered this level. Ready for more?"
                    : roadmap.status === 'Remedial'
                    ? "Don't worry! Let's focus on these specific areas to improve."
                    : `We've analyzed your level (Band ${roadmap.baselineBand}) and curated these skill-based topics.`}
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

            {roadmap.status === 'Remedial' && (
              <Card className="border-none bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-[32px] overflow-hidden relative shadow-2xl shadow-orange-100">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                  <BadgeAlert className="w-32 h-32" />
                </div>
                <CardHeader className="p-8 md:p-12 pb-4">
                  <div className="bg-white/20 backdrop-blur-md w-fit px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                    Remedial Focus
                  </div>
                  <CardTitle className="text-3xl md:text-4xl font-black leading-tight">
                    Almost there!
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 md:p-12 pt-0 space-y-8">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5" /> Tutor Feedback:
                    </h4>
                    {(() => {
                      try {
                        const analysis = typeof roadmap.masteryAnalysis === 'string' ? JSON.parse(roadmap.masteryAnalysis) : roadmap.masteryAnalysis;
                        return (
                          <div className="space-y-4">
                            <p className="text-orange-50 font-medium italic">"{analysis.feedback}"</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              {analysis.weakPoints?.map((wp: any, i: number) => (
                                <div key={i} className="bg-white/10 p-4 rounded-xl border border-white/10">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-200 mb-1">{wp.topic}</div>
                                  <p className="text-xs font-bold leading-relaxed">{wp.suggestion}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      } catch {
                        return <p className="text-orange-50 font-medium italic">"{roadmap.masteryAnalysis}"</p>;
                      }
                    })()}
                  </div>
                  <div className="flex flex-col md:flex-row gap-4">
                    {(() => {
                      const remedialTopic = [...roadmap.topics].reverse().find((t: any) => t.topicId.startsWith('remedial-'));
                      if (remedialTopic && remedialTopic.status !== 'Completed') {
                        return (
                          <Button 
                            asChild
                            className="bg-white text-orange-600 hover:bg-orange-50 rounded-2xl h-16 px-10 font-black text-xl shadow-xl shadow-orange-900/20"
                          >
                            <Link href={`/dashboard/learning/${remedialTopic.topicId}`}>
                              <BookOpen className="mr-2 w-6 h-6" />
                              Take Remedial Lesson
                            </Link>
                          </Button>
                        );
                      } else {
                        return (
                          <Button 
                            onClick={handleStartMilestone}
                            disabled={generatingMilestone}
                            className="bg-white text-orange-600 hover:bg-orange-50 rounded-2xl h-16 px-10 font-black text-xl shadow-xl shadow-orange-900/20 group"
                          >
                            <RefreshCcw className="mr-2 w-6 h-6 transition-transform group-hover:rotate-180 duration-500" />
                            {generatingMilestone ? "Preparing..." : "Try Milestone Again"}
                          </Button>
                        );
                      }
                    })()}
                    <Button 
                      variant="ghost"
                      onClick={() => {
                         const firstTopic = roadmap.topics.find((t: any) => t.status === 'Completed');
                         if (firstTopic) window.location.href = `/dashboard/learning/${firstTopic.topicId}`;
                      }}
                      className="text-white hover:bg-white/10 rounded-2xl h-16 px-8 font-bold border border-white/20"
                    >
                      Review Previous Topics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {roadmap.status === 'Completed' && (
              <Card className="border-none bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[32px] overflow-hidden relative shadow-2xl shadow-blue-200">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                  <Sparkles className="w-32 h-32" />
                </div>
                <CardHeader className="p-8 md:p-12 pb-4">
                  <div className="bg-white/20 backdrop-blur-md w-fit px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                    {roadmap.milestonePassed ? "Level Mastered" : "Final Step"}
                  </div>
                  <CardTitle className="text-3xl md:text-4xl font-black leading-tight">
                    {roadmap.milestonePassed ? "Level Up Your IELTS Skills!" : "Unlock the Next Level"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 md:p-12 pt-0 space-y-8">
                  <p className="text-blue-50 font-medium text-lg max-w-xl">
                    {roadmap.milestonePassed 
                      ? `You've mastered these topics with a score of ${roadmap.masteryScore}%. Ready for the next sequence of Band ${user?.goalBand} training?`
                      : "You've finished the lessons! Now, pass the Milestone Assessment to prove your mastery and unlock the next level."}
                  </p>
                  
                  {roadmap.milestonePassed ? (
                    <Button 
                      onClick={handleRefreshRoadmap}
                      disabled={refreshingRoadmap}
                      className="bg-white text-blue-700 hover:bg-blue-50 rounded-2xl h-16 px-10 font-black text-xl shadow-xl shadow-blue-900/20 group"
                    >
                      {refreshingRoadmap ? "Generating..." : "Generate Level-Up Roadmap"}
                      <ArrowRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-1" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleStartMilestone}
                      disabled={generatingMilestone}
                      className="bg-white text-blue-700 hover:bg-blue-50 rounded-2xl h-16 px-10 font-black text-xl shadow-xl shadow-blue-900/20 group"
                    >
                      <BrainCircuit className="mr-2 w-6 h-6" />
                      {generatingMilestone ? "Generating Quiz..." : "Start Milestone Assessment"}
                      <ArrowRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-1" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-4 md:space-y-6">
                <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" /> Learning Sequence
                </h2>
                <div className="space-y-3 md:space-y-4">
                  {roadmap.topics.map((topic: any, idx: number) => (
                    <Link 
                      key={topic.topicId} 
                      href={topic.status === 'Locked' ? '#' : `/dashboard/learning/${topic.topicId}`}
                      className={`block border-slate-200 shadow-none rounded-[20px] md:rounded-[24px] transition-all overflow-hidden bg-white border ${
                        topic.status === 'Locked' ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50 cursor-pointer'
                      }`}
                    >
                      <div className="p-4 md:p-6 flex items-center gap-4 md:gap-6">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-base md:text-lg shrink-0 ${
                          topic.status === 'Completed' ? 'bg-green-100 text-green-600' :
                          topic.status === 'Available' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {topic.status === 'Completed' ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5 md:mb-1">{topic.category}</div>
                          <h3 className="font-bold text-slate-900 text-base md:text-lg truncate">{topic.title}</h3>
                        </div>
                        {topic.status === 'Locked' ? (
                          <Lock className="w-4 h-4 md:w-5 md:h-5 text-slate-300 shrink-0" />
                        ) : (
                          <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-blue-600 shrink-0" />
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
                    <p className="text-base md:text-lg leading-relaxed text-slate-200 italic">
                      "Since you're aiming for Band {user?.goalBand}, focusing on complex sentence synthesis will be your fastest route to a higher score. Your baseline shows great vocabulary, but let's connect those ideas better!"
                    </p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4">
                  <h2 className="text-xl font-bold text-slate-800">Quick Stats</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center">
                      <div className="text-3xl font-bold text-blue-600">{completionRate}%</div>
                      <div className="text-xs font-bold text-slate-400 uppercase mt-2">Completion</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center">
                      <div className="text-3xl font-bold text-green-600">{completedTopics}</div>
                      <div className="text-xs font-bold text-slate-400 uppercase mt-2">Topics Done</div>
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
