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
    Generate a high-impact technical English insight for a student. 
    Current timestamp: ${Date.now()}
    
    FOCUS AREAS:
    1. Grammar: Explain a specific complex structure (e.g., inversion, conditionals, perfect tenses).
    2. Vocabulary: High-level IELTS synonyms (Band 7.0+) for common words.
    3. Usage Examples: ALWAYS include a natural, 'cool' sentence using the point.
    
    STYLE GUIDELINES:
    1. English Content: Use a blend of technical accuracy and Gen Z energy (slay, cooked, aura, no cap, peak, etc.). 
    2. Native Translation (${nativeLang}): Use natural, idiomatic ${nativeLang} slang (e.g. for ID: 'gokil', 'asli', 'menyala', 'gacor', 'ga ada obat').
    3. Technicality: Explain *why* it's good for IELTS.
    
    Format your response as a JSON object:
    {
      "topic": "Grammar" | "Vocabulary" | "Usage",
      "content": "Explanation + Example sentence + Why it slays in IELTS.",
      "contentTranslated": "The idiomatic ${nativeLang} version with the same 'native vibe'."
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
