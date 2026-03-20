import { NextResponse } from 'next/server';
import getClient, { DEPLOYMENT_HIGH } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import User from '@/models/User';
import { translateText } from '@/lib/azure-translator';
import { convertRawToBand } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { userAnswers, generatedTest, testType, userId, packageId } = await request.json();

    if (!userAnswers || !generatedTest) {
      return NextResponse.json({ message: 'Answers and test data required' }, { status: 400 });
    }

    await dbConnect();

    // 1. Strict Raw Scoring (Deterministic)
    const calculateRawScore = (module: string) => {
      const moduleKey = module.toLowerCase();
      const moduleData = generatedTest[moduleKey];
      const answers = userAnswers[moduleKey] || {};
      const answerKey = generatedTest.answerKey?.[moduleKey] || {};
      
      let score = 0;
      let total = 0;
      
      if (moduleKey === 'listening' || moduleKey === 'reading') {
        const sections = moduleKey === 'listening' ? moduleData.sections : moduleData.passages;
        sections?.forEach((sec: any, sIdx: number) => {
          sec.questions?.forEach((q: any) => {
            total++;
            const qId = `s${sIdx}q${q.id}`;
            const userAnsRaw = String(answers[qId] || '').trim();
            const correctAnsRaw = String(answerKey[qId] || '').trim();
            
            if (!userAnsRaw) return;

            const normalize = (s: string) => s.toLowerCase().trim().replace(/^[a-d]\)\s*/, '');
            const getLetter = (s: string) => {
                const m = s.match(/^([a-d])(?:\)|\s|$)/i);
                return m ? m[1].toLowerCase() : null;
            };

            const userLetter = getLetter(userAnsRaw);
            const correctLetter = getLetter(correctAnsRaw);
            const userText = normalize(userAnsRaw);
            const correctText = normalize(correctAnsRaw);

            // STRICT MATCHING:
            // 1. Jika pilihan ganda (A, B, C, D), harus cocok hurufnya.
            // 2. Jika True/False/Not Given atau Isian, harus cocok persis teksnya.
            // 3. Tidak ada toleransi 'includes' untuk menghindari jawaban ambigu/curang.
            const isMatch = (userLetter && userLetter === correctLetter) ||
                            (userText !== '' && userText === correctText);

            if (isMatch) score++;
          });
        });
      }
      return { score, total };
    };

    const listeningRaw = calculateRawScore('Listening');
    const readingRaw = calculateRawScore('Reading');

    // 2. Official Band Conversion
    const listeningBand = convertRawToBand(listeningRaw.score, 'listening', testType);
    const readingBand = convertRawToBand(readingRaw.score, 'reading', testType);

    const client = getClient();
    const user = userId ? await User.findById(userId) : null;
    const targetLang = user?.nativeLanguage || 'en';

    // 3. AI for Qualitative Modules (Writing/Speaking)
    const systemPrompt = `You are a certified IELTS Chief Examiner.
Evaluate the student's performance based on the provided answers.

**QUANTITATIVE SCORES (MANDATORY):**
- Listening: Raw ${listeningRaw.score}/${listeningRaw.total} -> Band ${listeningBand}
- Reading: Raw ${readingRaw.score}/${readingRaw.total} -> Band ${readingBand}

**EVALUATION TASKS:**
1. Evaluate Writing Task 1 & 2 individually using Band Descriptors (Task Response, Coherence, Lexical, Grammar).
2. Evaluate Speaking Part 1, 2, & 3 using Band Descriptors (Fluency, Lexical, Grammar, Pronunciation).
3. Calculate the Overall Band by averaging all 4 modules (L, R, W, S) and rounding to the nearest 0.5.

**OUTPUT FORMAT:**
You must provide a VALID JSON object. 
IMPORTANT: 
1. The "discussion" object MUST include EVERY SINGLE questionId present in the test, even if the student left it blank.
2. For unanswered questions, set "isCorrect": false and "userAnswer": "(No Answer)", but provide the full "correctAnswer" and "explanation".
3. For Writing/Speaking with no content, provide a "Model Answer" or "Recommended Approach" in the discussion field.

{
  "overallBand": 0.0,
  "moduleBands": { "listening": ${listeningBand}, "reading": ${readingBand}, "writing": 0.0, "speaking": 0.0 },
  "criteriaBreakdown": {
    "listening": {"rawScore": "${listeningRaw.score}/${listeningRaw.total}", "band": ${listeningBand}},
    "reading": {"rawScore": "${readingRaw.score}/${readingRaw.total}", "band": ${readingBand}},
    "writing": {"band": 0.0, "task1_score": 0.0, "task2_score": 0.0, "feedback": "..."},
    "speaking": {"band": 0.0, "fluency": 0.0, "grammar": 0.0, "pronunciation": 0.0}
  },
  "discussion": {
    "listening": [{ "questionId": "s0q1", "isCorrect": true, "userAnswer": "...", "correctAnswer": "...", "explanation": "..." }], 
    "reading": [{ "questionId": "s0q1", "isCorrect": false, "userAnswer": "...", "correctAnswer": "...", "explanation": "..." }],
    "writing": { "task1": {"strengths": "...", "weaknesses": "...", "improvement": "...", "modelAnswer": "..."}, "task2": {"strengths": "...", "weaknesses": "...", "improvement": "...", "modelAnswer": "..."} },
    "speaking": { "part1": {"feedback": "...", "recommendedResponse": "..."}, "part2": {"feedback": "...", "recommendedResponse": "..."}, "part3": {"feedback": "...", "recommendedResponse": "..."} }
  },
  "detailedFeedback": "...",
  "suggestions": []
}`;

    const userPrompt = `
Test Type: ${testType}
Generated Test: ${JSON.stringify(generatedTest, null, 2)}
Student Answers: ${JSON.stringify(userAnswers, null, 2)}`;

    const response = await client.chat.completions.create({
      model: DEPLOYMENT_HIGH,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');

    // Translate if needed
    if (targetLang !== 'en') {
      evaluation.detailedFeedback = await translateText(evaluation.detailedFeedback, targetLang);
      evaluation.suggestions = await Promise.all(
        evaluation.suggestions.map((s: string) => translateText(s, targetLang))
      );
    }

    // Save full test result
    if (user) {
      await TestResult.create({
        userId: user._id,
        packageId: packageId,
        module: 'Examiner',
        topic: `${testType} Full Test`,
        score: evaluation.overallBand,
        maxScore: 9.0,
        data: { 
          testType,
          moduleBands: evaluation.moduleBands,
          criteriaBreakdown: evaluation.criteriaBreakdown,
          discussion: evaluation.discussion, // Added for history review
          detailedFeedback: evaluation.detailedFeedback,
          suggestions: evaluation.suggestions,
          userAnswers,
          generatedTestId: generatedTest._id || 'generated'
        },
        date: new Date()
      });

      // Update progress for each module
      for (const [module, band] of Object.entries(evaluation.moduleBands)) {
        const moduleName = module.charAt(0).toUpperCase() + module.slice(1);

        await TestResult.create({
          userId: user._id,
          module: moduleName as any,
          topic: `${testType} ${moduleName}`,
          score: band as number,
          maxScore: 9,
          data: {
            // any module specific data
          },
          date: new Date()
        });

        const moduleResults = await TestResult.find({ userId: user._id, module: moduleName });
        const numTests = moduleResults.length;
        const avgScore = moduleResults.reduce((acc: any, r: any) => acc + r.score, 0) / numTests;

        let currentProgress = (user.progress as any).get(moduleName) || { difficulty: 'Easy', level: 1 };

        if (avgScore >= 7.5 && numTests >= 3) {
          currentProgress.level += 1;
          if (currentProgress.level >= 5) {
            if (currentProgress.difficulty === 'Easy') {
              currentProgress.difficulty = 'Medium';
              currentProgress.level = 1;
            } else if (currentProgress.difficulty === 'Medium') {
              currentProgress.difficulty = 'Hard';
              currentProgress.level = 1;
            }
          }
          (user.progress as any).set(moduleName, currentProgress);
        }
      }
      await user.save();
    }

    return NextResponse.json({ 
      success: true, 
      evaluation,
      saved: !!user 
    });

  } catch (error: any) {
    console.error('Examiner evaluation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

