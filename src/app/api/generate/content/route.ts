import { NextResponse } from 'next/server';
import getClient, { DEPLOYMENT_MINI, DEPLOYMENT_HIGH, DEPLOYMENT_MISTRAL, DEPLOYMENT_PHI } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import IELTSContent from '@/models/IELTSContent';

export async function POST(request: Request) {
  try {
    const { module, topic, difficulty } = await request.json();

    if (!module || !topic) {
      return NextResponse.json({ message: 'Module and Topic are required' }, { status: 400 });
    }

    await dbConnect();
    const client = getClient();

    // 1. Check if content exists in DB (to save costs)
    const existingContent = await IELTSContent.findOne({ module, topic, difficulty });
    if (existingContent) {
      return NextResponse.json({ success: true, data: existingContent.content, fromCache: true });
    }

    // 2. Generate new content if not exists
    let systemPrompt = "";
    let selectedModel = DEPLOYMENT_MINI; // Default to mini

    const difficultyContext = 
      difficulty === 'Easy' ? 'Target Band 5.0-6.0: Simpler vocabulary, clear articulation, slower pace, and more direct answers.' :
      difficulty === 'Hard' ? 'Target Band 8.0-9.0: Complex academic vocabulary, idiomatic expressions, faster pace with more distractors, and nuanced arguments.' :
      'Target Band 6.5-7.5: Standard IELTS difficulty with a mix of direct and indirect information, and some complex sentence structures.';

    if (module === 'Reading') {
      // Mistral is excellent for long, coherent academic passages
      selectedModel = DEPLOYMENT_MISTRAL; 
      systemPrompt = `You are a professional IELTS Reading content creator. Generate a unique IELTS Reading passage and 10 questions based on the topic "${topic}".
      Difficulty: ${difficulty} (${difficultyContext}).
      
      CRITICAL INSTRUCTIONS:
      1. PASSAGE: The passage should be approximately 700-900 words for Academic level.
      2. QUESTIONS: Generate 10 questions of varying types (e.g., 4 Multiple Choice, 3 True/False/Not Given, 3 Sentence Completion).
      3. AUTHENTICITY: Ensure the text sounds like it came from an academic journal or high-quality news source.
      
      Format as JSON: { 
        title: string, 
        passage: string, 
        questions: [{ id: number, text: string, options: [string], correct: string }] 
      }`;
    } else if (module === 'Writing') {
      // GPT-4o is better for generating high-quality sample answers that follow Band 9 descriptors
      selectedModel = DEPLOYMENT_HIGH;
      systemPrompt = `You are a professional IELTS Writing content creator. Generate a unique IELTS Writing Task 2 prompt based on the topic "${topic}".
      Difficulty: ${difficulty} (${difficultyContext}). 
      
      CRITICAL INSTRUCTIONS:
      1. PROMPT: Use standard IELTS phrasing like "To what extent do you agree or disagree?" or "Discuss both views and give your opinion."
      2. SAMPLE ANSWER: Provide a high-scoring sample answer (Band 8.0-9.0) of at least 250 words.
      
      Format as JSON: { 
        taskType: "Writing Task 2", 
        prompt: string, 
        instructions: string,
        sampleAnswer: string
      }`;
    } else if (module === 'Listening') {
      // Mistral handles long dialogues and monologue scripts with high naturalness
      selectedModel = DEPLOYMENT_MISTRAL;
      systemPrompt = `You are a professional IELTS Listening content creator. Generate a unique IELTS Listening Section 3 or 4 script and 10 questions based on the topic "${topic}".
      Difficulty: ${difficulty} (${difficultyContext}). 
      
      CRITICAL INSTRUCTIONS:
      1. SCRIPT: If Section 3, it should be a discussion between 2-3 people in an academic context. If Section 4, it should be an academic monologue (lecture). 
      2. LENGTH: The script should be around 800-1000 words.
      3. QUESTIONS: Generate 10 questions. Use a mix of Multiple Choice and Summary/Note Completion.
      4. DISTRACTORS: Include information that speakers correct or clarify later to test active listening.
      
      Format as JSON: { 
        script: string, 
        questions: [{ id: number, text: string, options: [string], correct: string }] 
      }`;
    } else if (module === 'Speaking') {
      // Phi-4 is excellent for generating high-quality interview questions
      selectedModel = DEPLOYMENT_PHI;
      systemPrompt = `You are a professional IELTS Speaking examiner. Generate 5 unique IELTS Speaking Part 1 questions based on the topic "${topic}".
      Difficulty: ${difficulty} (${difficultyContext}). 
      
      CRITICAL INSTRUCTIONS:
      1. AUTHENTICITY: Questions must be typical of IELTS Part 1 (e.g., about personal experiences, preferences, or habits related to the topic).
      2. VARIETY: Ensure a mix of direct and slightly more descriptive questions.
      3. OUTPUT FORMAT: Return strictly as JSON with a "questions" array of strings.
      
      Format as JSON: { 
        topic: string, 
        questions: [string]
      }`;
    }

    const response = await client.chat.completions.create({
      model: selectedModel,
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
