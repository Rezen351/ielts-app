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
      return NextResponse.json({ message: 'Essay content is required' }, { status: 400 });
    }

    await dbConnect();
    const user = userId ? await User.findById(userId) : null;
    const targetLang = user?.nativeLanguage || 'en';

    const systemPrompt = `You are a professional IELTS examiner. Evaluate the following IELTS essay. 
    Provide a detailed band score (0-9) based on four criteria.
    Format the response as a JSON object with: overallScore, criteriaScores, feedback, and suggestions.`;

    const userPrompt = `Task Type: ${taskType}\nPrompt: ${prompt}\n\nEssay:\n${essay}`;

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

    if (user) {
      await TestResult.create({
        candidateName: user.name,
        testType: 'Writing',
        score: result.overallScore,
        date: new Date()
      });
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
