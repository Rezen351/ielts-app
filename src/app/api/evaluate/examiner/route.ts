import { NextResponse } from 'next/server';
import client, { deploymentName } from '@/lib/azure-openai';
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
    const user = userId ? await User.findById(userId) : null;
    const targetLang = user?.nativeLanguage || 'en';

    // AI Evaluation Prompt with OFFICIAL Band Descriptors
    const systemPrompt = `You are a certified IELTS Chief Examiner. Evaluate student answers against OFFICIAL IELTS BAND DESCRIPTORS (1.0-9.0).

**CRITERIA (each 0-9):**
- Task Achievement/Response
- Coherence & Cohesion  
- Lexical Resource
- Grammatical Range & Accuracy
- Pronunciation/Fluency (Speaking only)

**EVALUATE ALL MODULES:**
LISTENING/READING: Compare to answerKey → Raw score → Convert to band
WRITING: Content analysis per task
SPEAKING: Fluency, pronunciation, development

**RULES:**
1. Use generatedTest.answerKey for objective scoring
2. Listening/Reading: Exact match, penalize spelling/capitalization
3. Provide specific examples from student answers
4. Give improvement suggestions

**JSON OUTPUT (strict):**
{
  "overallBand": 7.5,
  "moduleBands": {
    "listening": 7.0,
    "reading": 8.0, 
    "writing": 6.5,
    "speaking": 7.5
  },
  "criteriaBreakdown": {
    "listening": {"rawScore": 32/40, "band": 7.0},
    // ... per module
  },
  "detailedFeedback": "Strengths: ... Areas for improvement: ...",
  "suggestions": ["Use complex structures", "Expand vocabulary range"]
}`;

    const userPrompt = `
Test Type: ${testType}
Generated Test: ${JSON.stringify(generatedTest, null, 2)}
Student Answers: ${JSON.stringify(userAnswers, null, 2)}`;

    const response = await client.chat.completions.create({
      model: deploymentName,
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
        const avgScore = moduleResults.reduce((acc, r) => acc + r.score, 0) / numTests;

        let currentProgress = user.progress.get(moduleName) || { difficulty: 'Easy', level: 1 };

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
          user.progress.set(moduleName, currentProgress);
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

