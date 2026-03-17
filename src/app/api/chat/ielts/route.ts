import { NextResponse } from 'next/server';
import client, { deploymentName } from '@/lib/azure-openai';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const systemMessage = {
      role: "system" as const,
      content: "You are a professional IELTS Tutor..."
    };

    const response = await client.chat.completions.create({
      model: deploymentName,
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
