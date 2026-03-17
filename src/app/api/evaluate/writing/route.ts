import { NextResponse } from 'next/server';
import client, { deploymentName } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';

export async function POST(request: Request) {
  try {
    const { essay, taskType, prompt, userName } = await request.json();

    if (!essay) {
      return NextResponse.json({ message: 'Essay content is required' }, { status: 400 });
    }

    const systemPrompt = `You are a professional IELTS examiner...`;
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
