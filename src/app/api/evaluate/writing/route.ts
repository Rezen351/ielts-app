import { NextResponse } from 'next/server';
import client, { deploymentName } from '@/lib/azure-openai';
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
    const user = userId ? await User.findById(userId) : null;
    const targetLang = user?.nativeLanguage || 'en';

    // Determine module type based on taskType
    const moduleType = taskType.toLowerCase().includes('speaking') ? 'Speaking' : 'Writing';

    const systemPrompt = `You are a professional IELTS examiner. Evaluate the following IELTS ${moduleType} response. 
    Provide a detailed band score (0-9) based on IELTS criteria.
    Format the response as a JSON object with: overallScore, criteriaScores, feedback, and suggestions.`;

    const userPrompt = `Task Type: ${taskType}\nPrompt: ${prompt}\n\nResponse:\n${essay}`;

    const response = await client.chat.completions.create({
      model: deploymentName,
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
