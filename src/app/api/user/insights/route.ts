import { NextResponse } from 'next/server';
import getClient, { DEPLOYMENT_MINI } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const client = getClient();
    const nativeLang = user.nativeLanguage || 'id';
    
    // System prompt to generate a short, high-quality English insight with Gen Z vibes
    const systemPrompt = `You are a cool, trendy Gen Z English & IELTS tutor. 
    Generate a fresh, "high-vibe" English insight for a student. 
    Current timestamp: ${Date.now()}
    
    1. English Content: Use natural Gen Z slang (no cap, slay, for real, main character energy, vibe check, cooking, glow up, etc.). It should sound like a cool native speaker tutor, not a textbook.
    2. Native Translation (${nativeLang}): Do NOT just translate literally. Make it sound like a "Native" speaker from that country would actually say it to a friend. 
    3. If the language is Indonesian ('id'), use natural, idiomatic Indonesian that captures the "cool/slang" vibe of the original (e.g., use 'gokil', 'parah', 'asli', 'menyala', 'ga ada obat' if appropriate).
    4. Ensure the learning point (Grammar/Vocab/Strategy) is still clear and helpful for IELTS.
    
    Format your response as a JSON object:
    {
      "topic": "Vocabulary" | "Grammar" | "Idiom" | "Strategy",
      "content": "The English insight text with natural slang.",
      "contentTranslated": "The idiomatic, 'native-feeling' ${nativeLang} translation that adapts the vibe."
    }`;

    const response = await client.chat.completions.create({
      model: DEPLOYMENT_MINI,
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.9,
      max_tokens: 500
    });

    const content = response.choices[0].message.content || '{}';
    const data = JSON.parse(content);

    return NextResponse.json({ success: true, insight: data });

  } catch (error: any) {
    console.error('API Insight error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
