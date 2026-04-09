import { NextResponse } from 'next/server';
import { generateWithRetry, DEPLOYMENT_MINI } from '@/lib/azure-openai';

export async function POST(request: Request) {
  try {
    const { essay, prompt, lastSentence } = await request.json();

    if (!essay || !prompt) {
      return NextResponse.json({ message: 'Essay and prompt are required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert IELTS Writing Assistant. Your goal is to help students improve their essay in real-time.
    
    Given the current essay content and the prompt, provide:
    1. A "Sentence Improvement": Analyze the last sentence written and suggest a more academic or precise version of it.
    2. A "Next Step": Suggest a logical next sentence or a transition to help the user continue their thought.
    
    CRITICAL: Keep suggestions concise (max 20 words each). Focus on IELTS Band 7-9 standards (Lexical Resource and Grammatical Range).
    
    Return ONLY a JSON object:
    {
      "improvement": "The improved version of the last sentence.",
      "nextStep": "A suggestion for what to write next.",
      "explanation": "Briefly why this change helps (e.g., 'uses a more formal transition')."
    }`;

    const userPrompt = `Prompt: ${prompt}\n\nCurrent Essay: ${essay}\n\nLast sentence provided for context: ${lastSentence}`;

    const aiResponse = await generateWithRetry(systemPrompt, userPrompt, { deployment: DEPLOYMENT_MINI });

    return NextResponse.json({ success: true, assistant: aiResponse });
  } catch (error: any) {
    console.error('Writing assistant error:', error);
    return NextResponse.json({ message: 'Failed to generate assistance' }, { status: 500 });
  }
}
