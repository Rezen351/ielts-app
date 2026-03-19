import { NextResponse } from 'next/server';
import getClient, { DEPLOYMENT_HIGH } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import User from '@/models/User';
import { translateText } from '@/lib/azure-translator';

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
      
      let score = 0;
      let total = 0;
      
      if (moduleKey === 'listening') {
        moduleData.sections?.forEach((sec: any) => {
          sec.questions?.forEach((q: any) => {
            total++;
            const userAns = (answers[q.id] || '').trim().toLowerCase();
            const correctAns = (generatedTest.answerKey?.listening?.[q.id] || '').trim().toLowerCase();
            if (userAns === correctAns && correctAns !== '') score++;
          });
        });
      } else if (moduleKey === 'reading') {
        moduleData.passages?.forEach((pas: any) => {
          pas.questions?.forEach((q: any) => {
            total++;
            const userAns = (answers[q.id] || '').trim().toLowerCase();
            const correctAns = (generatedTest.answerKey?.reading?.[q.id] || '').trim().toLowerCase();
            if (userAns === correctAns && correctAns !== '') score++;
          });
        });
      }
      return { score, total };
    };

    const listeningRaw = calculateRawScore('Listening');
    const readingRaw = calculateRawScore('Reading');

    const client = getClient();
    const user = userId ? await User.findById(userId) : null;
    const targetLang = user?.nativeLanguage || 'en';

    // AI Evaluation Prompt with PRE-CALCULATED RAW SCORES
    const systemPrompt = `You are a certified IELTS Chief Examiner. Evaluate student answers against OFFICIAL IELTS BAND DESCRIPTORS.

**STRICT DATA PROVIDED:**
- Listening Raw Score: ${listeningRaw.score}/${listeningRaw.total}
- Reading Raw Score: ${readingRaw.score}/${readingRaw.total}

**SCORING RULES:**
1. For Listening/Reading: Use ONLY the provided raw scores and convert to band using official tables (e.g., 30/40 = 7.0 for Academic).
2. For Writing/Speaking: Analyze provided text/transcripts against band descriptors.
3. If total questions are few (e.g., only 1 answered), the band MUST reflect that accurately (e.g., Band 1.0 or 2.0). DO NOT hallucinate a high score.

**JSON OUTPUT (strict):**
{
  "overallBand": 0.0,
  "moduleBands": { "listening": 0.0, "reading": 0.0, "writing": 0.0, "speaking": 0.0 },
  "criteriaBreakdown": {
    "listening": {"rawScore": "${listeningRaw.score}/${listeningRaw.total}", "band": 0.0},
    "reading": {"rawScore": "${readingRaw.score}/${readingRaw.total}", "band": 0.0},
    "writing": {"band": 0.0, "task1": "...", "task2": "..."},
    "speaking": {"band": 0.0, "fluency": "...", "pronunciation": "..."}
  },
  "discussion": {
    "listening": [
      {"questionId": "1", "isCorrect": true, "userAnswer": "...", "correctAnswer": "...", "explanation": "..."}
    ],
    "reading": [
      {"questionId": "1", "isCorrect": false, "userAnswer": "...", "correctAnswer": "...", "explanation": "..."}
    ],
    "writing": {
      "task1": {"strengths": "...", "weaknesses": "...", "suggestedImprovement": "..."},
      "task2": {"strengths": "...", "weaknesses": "...", "suggestedImprovement": "..."}
    },
    "speaking": {
      "part1": "...",
      "part2": "...",
      "part3": "..."
    }
  },
  "detailedFeedback": "...",
  "suggestions": ["...", "..."]
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

