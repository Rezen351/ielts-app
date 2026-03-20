import { NextResponse } from 'next/server';
import getClient, { DEPLOYMENT_MINI } from '@/lib/azure-openai';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const client = getClient();

    // Pastikan pesan diformat dengan benar (hanya role dan content)
    const formattedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    // Use mini for efficiency
    let selectedModel = DEPLOYMENT_MINI;

    const systemMessage = {
      role: "system",
      content: `You are a professional IELTS Tutor. 
      Use standard Markdown for formatting:
      - Use **bold** for emphasis or section titles.
      - Use *italics* for highlighting specific terms.
      - Use bullet points for lists of questions or tips.
      
      If the user wants to practice a "Speaking Test", act as an official examiner. 
      If they ask about grammar/vocab, give concise academic explanations. 
      Otherwise, help with IELTS strategies. Be encouraging and concise.`
    };

    const response = await client.chat.completions.create({
      model: selectedModel,
      messages: [systemMessage, ...formattedMessages],
    });

    const reply = response.choices[0].message.content;

    return NextResponse.json({ 
      success: true, 
      reply,
      modelUsed: selectedModel 
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'AI Request Error',
      debug: {
        errorType: error.code || error.name
      },
      error: error.message 
    }, { status: 500 });
  }
}
