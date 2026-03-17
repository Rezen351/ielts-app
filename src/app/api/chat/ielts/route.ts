import { NextResponse } from 'next/server';
import client from '@/lib/azure-openai';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const systemMessage = {
      role: "system",
      content: "You are a professional IELTS Tutor. Your goal is to help students prepare for their IELTS exam. " +
               "You can explain complex grammar rules, provide vocabulary suggestions, give tips for all 4 modules (Listening, Reading, Writing, Speaking), " +
               "and evaluate short pieces of writing. Be encouraging, professional, and clear in your explanations."
    };

    const response = await client.chat.completions.create({
      model: "", // Handled by baseURL in client
      messages: [systemMessage, ...messages],
    });

    const reply = response.choices[0].message.content;

    return NextResponse.json({ success: true, reply });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to get a response from the tutor.',
      error: error.message 
    }, { status: 500 });
  }
}
