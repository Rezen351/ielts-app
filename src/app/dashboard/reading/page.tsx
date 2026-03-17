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
  BookOpen, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function ReadingPage() {
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const passage = {
    title: "The Impact of Digital Technology on Education",
    content: `The rapid advancement of digital technology over the past few decades has fundamentally transformed the landscape of modern education. Traditional classrooms, once characterized by physical textbooks and chalkboards, are increasingly giving way to virtual learning environments and interactive digital platforms. One of the most significant advantages of this shift is the democratization of knowledge. Students from remote or underprivileged backgrounds now have access to high-quality educational resources that were previously out of reach.

    However, the integration of technology in schools is not without its challenges. Critics argue that excessive screen time can lead to a decrease in attention spans and a lack of critical thinking skills. Furthermore, the "digital divide" remains a persistent issue, as students without reliable internet access or modern devices may find themselves at a disadvantage compared to their peers. 

    Educational experts suggest that the key to successful technology integration lies in a balanced approach. Technology should be viewed as a tool to enhance, rather than replace, traditional teaching methods. By combining the best aspects of both digital and physical learning, educators can create a more inclusive and effective educational experience for all students.`
  };

  const questions = [
    { id: 1, text: "What is one major advantage of digital technology in education according to the text?", options: ["A) More physical textbooks", "B) Democratization of knowledge", "C) Increased screen time", "D) Higher costs"], correct: "B) Democratization of knowledge" },
    { id: 2, text: "What do critics worry about regarding excessive screen time?", options: ["A) Better internet access", "B) Improved critical thinking", "C) Decrease in attention spans", "D) More inclusive classrooms"], correct: "C) Decrease in attention spans" },
    { id: 3, text: "What is the 'digital divide' according to the passage?", options: ["A) A new type of software", "B) Disadvantage for students without technology", "C) A method of teaching math", "D) The difference between books and tablets"], correct: "B) Disadvantage for students without technology" }
  ];

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, submitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct) correctCount++;
    });
    setScore(correctCount);
    toast.success("Test Submitted", { description: `You got ${correctCount} out of ${questions.length} correct.` });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:px-8 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Reading Module</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-sm ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
          <Button onClick={handleSubmit} disabled={submitted} className="bg-indigo-600 hover:bg-indigo-700 rounded-full font-bold px-6">
            Submit Test
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
        {/* Left: Passage */}
        <div className="lg:w-1/2 space-y-6">
          <Card className="border-slate-200 shadow-none rounded-[32px] overflow-hidden h-fit sticky top-24">
            <CardHeader className="p-10 pb-4">
              <Badge variant="outline" className="mb-4 border-slate-200 text-slate-400 font-bold tracking-widest text-[10px]">PASSAGE 1</Badge>
              <CardTitle className="text-3xl font-black text-slate-900 leading-tight">
                {passage.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 pt-4 text-slate-600 leading-relaxed text-lg font-medium space-y-6">
              {passage.content.split('\n\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Questions */}
        <div className="lg:w-1/2 space-y-6 pb-20">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 px-2">Questions 1 - {questions.length}</h2>
          
          {questions.map((q, i) => (
            <Card key={q.id} className={`border-slate-200 shadow-none rounded-3xl overflow-hidden transition-all ${submitted && (answers[q.id] === q.correct ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30')}`}>
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
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
                  {q.options.map((opt) => (
                    <div key={opt} className="flex items-center space-x-3 space-y-2">
                      <RadioGroupItem value={opt} id={`q${q.id}-${opt}`} className="text-indigo-600 border-slate-300" />
                      <Label htmlFor={`q${q.id}-${opt}`} className={`text-sm font-medium ${submitted && opt === q.correct ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                
                {submitted && answers[q.id] !== q.correct && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    Correct Answer: {q.correct}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {submitted && (
            <Card className="border-indigo-200 bg-indigo-600 text-white rounded-[32px] p-10 text-center shadow-xl shadow-indigo-200">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">Test Completed!</h3>
              <p className="text-indigo-100 mb-6">Your score: <span className="text-3xl font-black">{score} / {questions.length}</span></p>
              <Button variant="secondary" className="rounded-full font-bold px-8" asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function Trophy(props: any) {
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
  )
}
