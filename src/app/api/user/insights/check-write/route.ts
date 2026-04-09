import { NextResponse } from 'next/server';
import { generateWithRetry, DEPLOYMENT_MINI } from '@/lib/azure-openai';

export async function GET(request: Request) {
  try {
    const systemPrompt = `You are an expert IELTS Examiner. Provide a simple, 1-sentence writing prompt for a student to practice writing one or two sentences.
    The topic should be common (e.g., Environment, Technology, Education, Travel, Food).
    
    Return ONLY a JSON object:
    { "topic": "Short Topic Name", "prompt": "The prompt sentence (e.g., 'What are the benefits of using public transportation?')" }`;

    const userPrompt = "Generate a short writing prompt.";
    const aiResponse = await generateWithRetry(systemPrompt, userPrompt, { deployment: DEPLOYMENT_MINI });

    return NextResponse.json({ success: true, ...aiResponse });
  } catch (error: any) {
    console.error('Check write generation error:', error);
    return NextResponse.json({ message: 'Failed to generate prompt' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { sentence, prompt } = await request.json();

    if (!sentence || !prompt) {
      return NextResponse.json({ message: 'Sentence and prompt are required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert IELTS Examiner. Evaluate this 1-2 sentence response to a prompt.
    Check for: Grammatical accuracy, vocabulary usage, and relevance.
    
    Return ONLY a JSON object:
    {
      "isCorrect": true/false (true if no major grammar errors),
      "feedback": "Short encouraging feedback (max 15 words).",
      "improvement": "A better, more academic version of the sentence.",
      "score": 0.0 to 9.0 (predicted band)
    }`;

    const userPrompt = `Prompt: ${prompt}\nStudent Sentence: ${sentence}`;
    const aiResponse = await generateWithRetry(systemPrompt, userPrompt, { deployment: DEPLOYMENT_MINI });

    return NextResponse.json({ success: true, evaluation: aiResponse });
  } catch (error: any) {
    console.error('Check write evaluation error:', error);
    return NextResponse.json({ message: 'Failed to evaluate sentence' }, { status: 500 });
  }
}
