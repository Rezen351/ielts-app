import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface QuestionCardProps {
  module: string;
  question: any;
  qId: string;
  isReviewMode: boolean;
  userAnswer: string;
  discussion?: any;
  onUpdateAnswer: (module: string, qId: string, answer: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  module, 
  question, 
  qId, 
  isReviewMode, 
  userAnswer, 
  discussion, 
  onUpdateAnswer 
}) => {
  const moduleKey = module.toLowerCase();
  const rawQuestionText = question.question || question.text || "Question";
  
  // Detect how many gap-fill placeholders are in the text
  const placeholder = "__________";
  const gapCount = (rawQuestionText.match(new RegExp(placeholder, 'g')) || []).length;
  
  // If multiple gaps, label them (1), (2), etc. in the text
  let displayQuestion = rawQuestionText;
  if (gapCount > 1) {
    let count = 1;
    displayQuestion = rawQuestionText.replace(new RegExp(placeholder, 'g'), () => `(${count++})`);
  }

  // Split multi-answers stored as "ans1|ans2"
  const answers = userAnswer ? userAnswer.split('|') : [];

  const handleMultiAnswerUpdate = (index: number, value: string) => {
    const newAnswers = [...answers];
    // Ensure array is padded up to the current index
    for (let i = 0; i <= index; i++) {
        if (newAnswers[i] === undefined) newAnswers[i] = '';
    }
    newAnswers[index] = value;
    onUpdateAnswer(module, qId, newAnswers.join('|'));
  };

  return (
    <div className={`space-y-4 p-4 sm:p-6 border rounded-xl transition-all ${
      isReviewMode 
        ? (discussion?.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200') 
        : 'bg-slate-50 shadow-sm border-slate-200'
    }`}>
      <div className="flex justify-between items-start gap-4">
          <p className="font-bold text-slate-900 leading-relaxed text-base md:text-lg">
            {displayQuestion}
          </p>
          {isReviewMode && discussion && (
              <Badge className={discussion.isCorrect ? "bg-emerald-600 shrink-0" : "bg-red-600 shrink-0"}>
                  {discussion.isCorrect ? "Correct" : "Incorrect"}
              </Badge>
          )}
      </div>

      {question.options && question.options.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 mt-3">
          {question.options.map((opt: string, i: number) => (
            <label
              key={i}
              className={`flex items-center gap-3 p-3 md:p-4 border rounded-xl text-xs md:text-sm transition-all cursor-pointer ${
                isReviewMode && (discussion?.correctAnswer === opt || discussion?.correctAnswer?.includes(opt))
                    ? 'bg-emerald-100 border-emerald-500 font-bold' 
                    : (isReviewMode && userAnswer === opt && !discussion?.isCorrect ? 'bg-red-100 border-red-500' : 'bg-white hover:border-blue-300 shadow-sm')
              }`}
            >
              <input 
                type="radio" 
                disabled={isReviewMode}
                name={`${module}-${qId}`} 
                value={opt}
                checked={userAnswer === opt}
                onChange={(e) => onUpdateAnswer(module, qId, e.target.value)}
                className="w-4 h-4 md:w-5 md:h-5 text-blue-600 cursor-pointer"
              />
              <span className="flex-1 text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="space-y-4 mt-2">
          {/* Render N inputs based on gap count (at least 1) */}
          {Array.from({ length: Math.max(1, gapCount) }).map((_, idx) => (
            <div key={idx} className="space-y-1">
              {gapCount > 1 && (
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  Answer for Blank ({idx + 1})
                </label>
              )}
              <Input 
                  disabled={isReviewMode}
                  placeholder={gapCount > 1 ? `Type answer for (${idx + 1})...` : "Type your answer here..."}
                  value={answers[idx] || ''}
                  onChange={(e) => handleMultiAnswerUpdate(idx, e.target.value)}
                  className={`bg-white h-10 md:h-12 text-sm md:text-lg border-2 focus:ring-2 transition-all shadow-sm ${
                    isReviewMode 
                      ? (discussion?.isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-500 bg-red-50 text-red-700') 
                      : 'border-slate-200 focus:border-blue-500 text-slate-900'
                  }`}
              />
            </div>
          ))}

          {isReviewMode && !discussion?.isCorrect && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">Correct Answer</p>
                <p className="text-sm font-bold text-emerald-700">{discussion?.correctAnswer}</p>
              </div>
          )}
        </div>
      )}

      {isReviewMode && discussion?.explanation && (
          <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-dashed border-blue-200 text-sm italic text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-900 not-italic mr-1 underline decoration-blue-200 decoration-2">Examiner Notes:</span>
              {discussion.explanation}
          </div>
      )}
    </div>
  );
};

export default React.memo(QuestionCard);
