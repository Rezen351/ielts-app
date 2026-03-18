import { NextResponse } from 'next/server';
import getClient, { deploymentName } from '@/lib/azure-openai';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const client = getClient();

    // Pastikan pesan diformat dengan benar (hanya role dan content)
    const formattedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    const systemMessage = {
      role: "system",
      content: "You are a professional IELTS Tutor. Help students with grammar, vocabulary, and IELTS strategies. Be encouraging and concise."
    };

    const response = await client.chat.completions.create({
      model: deploymentName,
      messages: [systemMessage, ...formattedMessages],
    });

    const reply = response.choices[0].message.content;

    return NextResponse.json({ success: true, reply });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'AI Request Error',
      debug: {
        deploymentUsed: deploymentName,
        errorType: error.code || error.name
      },
      error: error.message 
    }, { status: 500 });
  }
}
