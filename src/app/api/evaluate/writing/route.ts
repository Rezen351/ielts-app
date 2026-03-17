import { NextResponse } from 'next/server';
import client from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';

export async function POST(request: Request) {
  try {
    const { essay, taskType, prompt, userName } = await request.json();

    if (!essay) {
      return NextResponse.json({ message: 'Essay content is required' }, { status: 400 });
    }

    const systemPrompt = `You are a professional IELTS examiner. Evaluate the following IELTS ${taskType} essay. 
    Provide a detailed band score (0-9) based on four criteria: 
    1. Task Response/Achievement
    2. Coherence and Cohesion
    3. Lexical Resource
    4. Grammatical Range and Accuracy.
    
    Format the response as a JSON object with: 
    - overallScore (number)
    - criteriaScores (object with 4 criteria)
    - feedback (string)
    - suggestions (array of strings)`;

    const userPrompt = `Task Type: ${taskType}\nPrompt: ${prompt}\n\nEssay:\n${essay}`;

    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Optional: Save to DB if user is provided
    if (userName) {
      await dbConnect();
      await TestResult.create({
        candidateName: userName,
        testType: 'Writing',
        score: result.overallScore,
        date: new Date()
      });
    }

    return NextResponse.json({ success: true, analysis: result });

  } catch (error: any) {
    console.error('AI Evaluation error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Evaluation failed. Make sure your Azure AI keys are configured correctly.',
      error: error.message 
    }, { status: 500 });
  }
}
