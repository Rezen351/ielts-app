import { NextResponse } from 'next/server';
import client, { deploymentName } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import IELTSContent from '@/models/IELTSContent';

export async function POST(request: Request) {
  try {
    const { module, topic, difficulty } = await request.json();

    await dbConnect();

    // 1. Check if content exists in DB
    const existingContent = await IELTSContent.findOne({ module, topic, difficulty });
    if (existingContent) {
      return NextResponse.json({ success: true, data: existingContent.content, fromCache: true });
    }

    // 2. Generate new content if not exists
    let systemPrompt = "";
    if (module === 'Reading') {
      systemPrompt = `Generate an IELTS Reading passage and 3 multiple choice questions. 
      Topic: ${topic}. Difficulty: ${difficulty}. 
      Format as JSON: { title: string, passage: string, questions: [{ id: number, text: string, options: [string], correct: string }] }`;
    } else if (module === 'Writing') {
      systemPrompt = `Generate an IELTS Writing Task 2 prompt. 
      Topic: ${topic}. Difficulty: ${difficulty}. 
      Format as JSON: { taskType: string, prompt: string, instructions: string }`;
    } else if (module === 'Listening') {
      systemPrompt = `Generate a script for an IELTS Listening Section 1 (Conversation) and 3 questions. 
      Topic: ${topic}. Difficulty: ${difficulty}. 
      Format as JSON: { script: string, questions: [{ id: number, text: string, options: [string], correct: string }] }`;
    }

    const response = await client.chat.completions.create({
      model: deploymentName,
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" }
    });

    const generatedContent = JSON.parse(response.choices[0].message.content || "{}");

    // 3. Save to DB for future use
    await IELTSContent.create({
      module,
      topic,
      difficulty,
      content: generatedContent
    });

    return NextResponse.json({ success: true, data: generatedContent, fromCache: false });

  } catch (error: any) {
    console.error('Content Generation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
