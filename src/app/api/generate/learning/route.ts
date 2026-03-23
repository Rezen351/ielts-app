import { NextResponse } from 'next/server';
import { generateWithRetry } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import { LearningMaterial } from '@/models/Learning';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json({ message: 'Topic ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    // Check if material already exists in DB
    let material = await LearningMaterial.findOne({ topicId });
    
    if (!material) {
      // Generate using AI if not exists
      const systemPrompt = `You are an expert IELTS Tutor. Generate a comprehensive, high-engagement learning material in a "Blog Article" style.
      
      CRITICAL FORMATTING RULES:
      1. Use Markdown for content: **bold** for key terms, *italics* for emphasis.
      2. Use Markdown Tables for any comparisons, word lists, or synonyms (e.g., | Word | Synonym |).
      3. Use Bullet points and Numbered lists for strategies or steps.
      4. Ensure sections are substantial and educational.

      Return ONLY a JSON object with this structure:
      {
        "title": "Topic Title",
        "category": "Writing/Speaking/Reading/Listening/Grammar/Vocabulary",
        "difficultyLevel": "Beginner/Intermediate/Advanced",
        "content": {
          "sections": [
            { 
              "heading": "Section Heading", 
              "body": "Detailed content using markdown (tables, lists, bold, etc.).",
              "miniExplainer": "Short, punchy explanation or 'Did you know?' tip."
            }
          ]
        },
        "quickCheck": [
          {
            "question": "...",
            "options": ["...", "...", "...", "..."],
            "correctAnswer": "...",
            "explanation": "..."
          }
        ],
        "flashcards": [
          { "front": "Term/Concept", "back": "Definition/Example", "tag": "Grammar/Vocab" }
        ]
      }`;

      const userPrompt = `Generate a detailed learning module for the topic: "${topicId}". Ensure it is educational, encouraging, and follows official IELTS standards.`;
      
      const aiResponse = await generateWithRetry(systemPrompt, userPrompt);
      
      material = await LearningMaterial.create({
        topicId,
        ...aiResponse
      });
    }

    return NextResponse.json({ success: true, material });
  } catch (error: any) {
    console.error('Content generation error:', error);
    return NextResponse.json({ message: 'Failed to generate learning material' }, { status: 500 });
  }
}
