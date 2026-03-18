import { NextResponse } from 'next/server';
import client, { deploymentName } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import IELTSContent from '@/models/IELTSContent';

export async function POST(request: Request) {
  try {
    const { module, topic, difficulty } = await request.json();

    if (!module || !topic) {
      return NextResponse.json({ message: 'Module and Topic are required' }, { status: 400 });
    }

    await dbConnect();

    // 1. Check if content exists in DB (to save costs)
    const existingContent = await IELTSContent.findOne({ module, topic, difficulty });
    if (existingContent) {
      return NextResponse.json({ success: true, data: existingContent.content, fromCache: true });
    }

    // 2. Generate new content if not exists
    let systemPrompt = "";
    if (module === 'Reading') {
      systemPrompt = `You are a professional IELTS content creator. Generate a unique IELTS Reading passage and 3 multiple choice questions based on the topic "${topic}".
      Difficulty: ${difficulty}. 
      The passage should be approximately 300-400 words.
      Format as JSON: { 
        title: string, 
        passage: string, 
        questions: [{ id: number, text: string, options: [string], correct: string }] 
      }`;
    } else if (module === 'Writing') {
      systemPrompt = `You are a professional IELTS content creator. Generate a unique IELTS Writing Task 2 prompt based on the topic "${topic}".
      Difficulty: ${difficulty}. 
      Format as JSON: { 
        taskType: "Writing Task 2", 
        prompt: string, 
        instructions: string 
      }`;
    } else if (module === 'Listening') {
      systemPrompt = `You are a professional IELTS content creator. Generate a unique IELTS Listening Section 1 script (a conversation between two people) and 3 multiple choice questions based on the topic "${topic}".
      Difficulty: ${difficulty}. 
      Format as JSON: { 
        script: string, 
        questions: [{ id: number, text: string, options: [string], correct: string }] 
      }`;
    } else if (module === 'Speaking') {
      systemPrompt = `You are a professional IELTS content creator. Generate 4 unique IELTS Speaking Part 1 questions based on the topic "${topic}".
      Difficulty: ${difficulty}. 
      Format as JSON: { 
        topic: string, 
        questions: [string] 
      }`;
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
