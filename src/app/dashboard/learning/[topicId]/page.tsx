'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  XCircle,
  Lightbulb,
  CreditCard,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import ChatWidget from '@/components/chat/ChatWidget';

export default function MaterialPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<any>({});
  const [showQuizFeedback, setShowQuizFeedback] = useState<any>({});
  const [flippedCards, setFlippedCards] = useState<any>({});

  useEffect(() => {
    fetchMaterial();
  }, [topicId]);

  const fetchMaterial = async () => {
    try {
      const res = await fetch(`/api/generate/learning?topicId=${topicId}`);
      const data = await res.json();
      if (data.success) {
        setMaterial(data.material);
      }
    } catch (err) {
      toast.error("Failed to load material");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = (qIdx: number, selected: string, correct: string) => {
    setQuizAnswers({ ...quizAnswers, [qIdx]: selected });
    setShowQuizFeedback({ ...showQuizFeedback, [qIdx]: true });
  };

  const toggleCard = (idx: number) => {
    setFlippedCards({ ...flippedCards, [idx]: !flippedCards[idx] });
  };

  const handleComplete = async () => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return;
    const user = JSON.parse(savedUser);

    setCompleting(true);
    try {
      const res = await fetch('/api/user/insights/roadmap/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          topicId: topicId
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Topic completed!", { description: "Next topic unlocked." });
        router.back();
      } else {
        toast.error("Failed to update progress");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">AI is curating your material...</div>;
  if (!material) return <div className="p-20 text-center text-red-500">Material not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50/30 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:px-8 flex items-center gap-6 sticky top-0 z-20">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col">
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{material.category} • {material.difficultyLevel}</div>
          <h1 className="text-lg font-bold text-slate-900">{material.title}</h1>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-12 max-w-4xl mx-auto w-full space-y-12 md:space-y-16 pb-32">
        {/* Article Body */}
        <div className="space-y-10 md:space-y-12">
          {material.content.sections.map((section: any, idx: number) => (
            <section key={idx} className="space-y-4 md:space-y-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{section.heading}</h2>
              <div className="prose prose-slate max-w-none text-slate-600 text-base md:text-lg leading-relaxed space-y-4 
                prose-headings:text-slate-900 prose-strong:text-slate-900 prose-strong:font-bold
                prose-table:border prose-table:rounded-xl prose-table:overflow-hidden prose-table:shadow-sm
                prose-th:bg-slate-50 prose-th:p-3 md:prose-th:p-4 prose-th:text-[10px] md:prose-th:text-xs prose-th:font-bold prose-th:uppercase prose-th:tracking-widest prose-th:text-slate-500
                prose-td:p-3 md:prose-td:p-4 prose-td:border-t prose-td:border-slate-100 prose-td:text-xs md:prose-td:text-sm
                overflow-x-auto block w-full scrollbar-thin">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  rehypePlugins={[rehypeRaw]}
                >
                  {section.body}
                </ReactMarkdown>
              </div>
              
              {section.miniExplainer && (
                <div className="bg-blue-50/50 border-l-4 border-blue-500 p-4 md:p-6 rounded-r-2xl flex gap-3 md:gap-4 items-start my-6 md:my-8">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">AI Mini-Explainer</div>
                    <div className="text-blue-900 font-medium italic leading-relaxed prose prose-sm prose-blue max-w-none text-xs md:text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {section.miniExplainer}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Quick Check Quiz */}
        <section className="space-y-8 pt-12 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-slate-900">Quick Check</h2>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {material.quickCheck.map((q: any, qIdx: number) => (
              <Card key={qIdx} className="border-slate-200 shadow-none rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="p-8">
                  <CardTitle className="text-lg font-bold text-slate-800 leading-relaxed">{q.question}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt: string) => (
                      <button
                        key={opt}
                        disabled={showQuizFeedback[qIdx]}
                        onClick={() => handleQuizSubmit(qIdx, opt, q.correctAnswer)}
                        className={`p-4 text-left rounded-xl border-2 transition-all font-medium text-sm ${
                          quizAnswers[qIdx] === opt 
                          ? (opt === q.correctAnswer ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700') 
                          : 'border-slate-100 hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {showQuizFeedback[qIdx] && (
                    <div className={`mt-4 p-4 rounded-xl flex gap-3 ${quizAnswers[qIdx] === q.correctAnswer ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      {quizAnswers[qIdx] === q.correctAnswer ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
                      <div>
                        <div className="font-bold text-sm mb-1">{quizAnswers[qIdx] === q.correctAnswer ? 'Correct!' : 'Incorrect'}</div>
                        <p className="text-xs opacity-90">{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Flashcards */}
        <section className="space-y-8 pt-12 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Smart Flashcards</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {material.flashcards.map((card: any, idx: number) => (
              <div 
                key={idx}
                onClick={() => toggleCard(idx)}
                className="group perspective-1000 h-64 cursor-pointer"
              >
                <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${flippedCards[idx] ? 'rotate-y-180' : ''}`}>
                  {/* Front */}
                  <div className="absolute inset-0 backface-hidden bg-white border-2 border-slate-100 rounded-[32px] p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-sm group-hover:border-blue-200 group-hover:shadow-lg transition-all">
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{card.tag}</div>
                    <div className="text-xl font-bold text-slate-900 prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {card.front}
                      </ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold mt-auto">
                      <RotateCcw className="w-3 h-3" /> CLICK TO FLIP
                    </div>
                  </div>
                  {/* Back */}
                  <div className="absolute inset-0 backface-hidden bg-slate-900 text-white rounded-[32px] p-8 flex flex-col items-center justify-center text-center space-y-4 rotate-y-180">
                    <div className="text-lg font-medium leading-relaxed prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {card.back}
                      </ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold mt-auto">
                      <RotateCcw className="w-3 h-3" /> CLICK TO FLIP
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-center pt-20">
          <Button 
            variant="outline"
            onClick={handleComplete}
            disabled={completing}
            className="border-slate-200 hover:bg-slate-100 rounded-2xl h-14 px-12 font-bold text-lg flex gap-2"
          >
            {completing ? "Updating..." : <><CheckCircle2 className="w-5 h-5 text-green-500" /> Mark as Completed</>}
          </Button>
        </div>
      </main>

      {/* Context-Aware Chat Tutor */}
      <ChatWidget 
        context={`User is studying the learning module: "${material.title}" (Topic ID: ${topicId}). 
        They have just read content about: ${material.content.sections[0].heading}.
        If they ask questions, provide detailed help related to this specific IELTS topic.`} 
      />
    </div>
  );
}
