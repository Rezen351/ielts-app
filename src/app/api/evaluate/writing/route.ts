import { NextResponse } from 'next/server';
import getClient, { DEPLOYMENT_MINI } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import User from '@/models/User';
import { translateText } from '@/lib/azure-translator';

export async function POST(request: Request) {
  try {
    const { essay, taskType, prompt, userId } = await request.json();

    if (!essay) {
      return NextResponse.json({ message: 'Essay/Transcript content is required' }, { status: 400 });
    }

    await dbConnect();
    const client = getClient();
    const user = userId ? await User.findById(userId) : null;
    const targetLang = user?.nativeLanguage || 'en';

    // Determine module type based on taskType
    const moduleType = taskType.toLowerCase().includes('speaking') ? 'Speaking' : 'Writing';

    const isWritingTask1 = taskType.toLowerCase().includes('task 1');
    const isWritingTask2 = taskType.toLowerCase().includes('task 2');
    const isSpeaking = moduleType === 'Speaking';

    let criteriaDescription = '';
    if (isWritingTask1) {
      criteriaDescription = `
      - Task Achievement (TA): How well the response addresses the task and provides a clear overview of main trends or differences.
      - Coherence and Cohesion (CC): The logical organization of information and the use of cohesive devices.
      - Lexical Resource (LR): The range and precision of vocabulary used.
      - Grammatical Range and Accuracy (GRA): The range and correctness of sentence structures.`;
    } else if (isWritingTask2) {
      criteriaDescription = `
      - Task Response (TR): How well the response addresses all parts of the prompt and develops a clear position.
      - Coherence and Cohesion (CC): The logical organization of information and the use of cohesive devices.
      - Lexical Resource (LR): The range and precision of vocabulary used.
      - Grammatical Range and Accuracy (GRA): The range and correctness of sentence structures.`;
    } else if (isSpeaking) {
      criteriaDescription = `
      - Fluency and Coherence (FC): The ability to speak at length without undue effort and the logical flow of ideas.
      - Lexical Resource (LR): The range and precision of vocabulary used.
      - Grammatical Range and Accuracy (GRA): The range and correctness of sentence structures.
      - Pronunciation (P): The clarity of speech and use of features like stress and intonation.`;
    }

    const systemPrompt = `You are a certified IELTS Senior Examiner. Evaluate the following IELTS ${moduleType} response (${taskType}).
    Strictly follow the official IELTS Band Descriptors (Band 0-9).
    
    CRITERIA TO EVALUATE:
    ${criteriaDescription}
    
    REQUIRED OUTPUT JSON FORMAT:
    {
      "overallScore": number, (Calculated as the average of the 4 criteria, rounded to the nearest half-band)
      "criteriaScores": {
        "TA_or_TR_or_FC": { "score": number, "justification": "..." },
        "CC": { "score": number, "justification": "..." },
        "LR": { "score": number, "justification": "..." },
        "GRA": { "score": number, "justification": "..." },
        "P": { "score": number, "justification": "..." } (Only for Speaking)
      },
      "feedback": "A detailed overall assessment of the response.",
      "suggestions": ["Specific, actionable advice for improvement 1", "Advice 2", "..."],
      "errors": ["Specific grammatical or lexical errors found", "..."]
    }`;

    const userPrompt = `Task Type: ${taskType}\nPrompt: ${prompt}\n\nResponse:\n${essay}`;

    const response = await client.chat.completions.create({
      model: DEPLOYMENT_MINI,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Translate feedback if not English
    let translatedFeedback = result.feedback;
    let translatedSuggestions = result.suggestions;

    if (targetLang !== 'en') {
      translatedFeedback = await translateText(result.feedback, targetLang);
      translatedSuggestions = await Promise.all(
        result.suggestions.map((s: string) => translateText(s, targetLang))
      );
    }

    // SAVE TO DATABASE
    if (user) {
      await TestResult.create({
        userId: user._id,
        module: moduleType,
        topic: prompt.substring(0, 50) + "...", // Use snippet of prompt as topic
        score: result.overallScore,
        maxScore: 9,
        data: { 
          criteriaScores: result.criteriaScores,
          originalResponse: essay
        },
        date: new Date()
      });

      // Update user progress
      const moduleResults = await TestResult.find({ userId: user._id, module: moduleType });
      const numTests = moduleResults.length;
      const avgScore = moduleResults.reduce((acc: any, r: any) => acc + r.score, 0) / numTests;

      let currentProgress = (user.progress as any).get(moduleType) || { difficulty: 'Easy', level: 1 };

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
        (user.progress as any).set(moduleType, currentProgress);
        await user.save();
      }
    }

    return NextResponse.json({ 
      success: true, 
      analysis: {
        ...result,
        translatedFeedback,
        translatedSuggestions
      } 
    });

  } catch (error: any) {
    console.error('AI Evaluation error:', error);
    return NextResponse.json({ success: false, message: 'Evaluation failed', error: error.message }, { status: 500 });
  }
}
