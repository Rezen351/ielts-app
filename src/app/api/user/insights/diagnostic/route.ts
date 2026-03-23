import { NextResponse } from 'next/server';
import { generateWithRetry } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import { UserRoadmap } from '@/models/Learning';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const systemPrompt = `You are a Senior IELTS Examiner. Create a 5-question English Diagnostic Test to assess a user's proficiency level.
    The questions should cover:
    1. Grammar (Sentence Structure)
    2. Vocabulary (Academic/Lexical Range)
    3. Reading Logic (Main idea identification)
    4. Cohesion (Linking ideas)
    5. Writing Logic (Task Response/Structure)

    Return the result in JSON format:
    {
      "questions": [
        {
          "id": 1,
          "category": "Grammar",
          "question": "...",
          "options": ["...", "...", "...", "..."],
          "correctAnswer": "...",
          "difficulty": "Intermediate"
        }
      ]
    }`;

    const userPrompt = "Generate a diagnostic test for a student to determine their IELTS baseline.";
    
    const diagnosticTest = await generateWithRetry(systemPrompt, userPrompt);

    return NextResponse.json(diagnosticTest);
  } catch (error: any) {
    console.error('Diagnostic generation error:', error);
    return NextResponse.json({ message: 'Failed to generate diagnostic test' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, answers, goalBand } = await request.json();

    if (!userId || !answers) {
      return NextResponse.json({ message: 'User ID and answers are required' }, { status: 400 });
    }

    const systemPrompt = `Analyze the diagnostic test results for a student aiming for Band ${goalBand}.
    Based on their answers, estimate their current "Baseline Band" (1.0 - 9.0) and identify their strengths and weaknesses.
    Then, generate a personalized skill-based roadmap with 5 learning topics they should focus on.

    Return the result in JSON format:
    {
      "baselineBand": 6.0,
      "analysis": "...",
      "roadmap": [
        { "topicId": "vocab-env", "title": "Environment Vocabulary", "category": "Vocabulary", "order": 1 },
        { "topicId": "writing-cohesion", "title": "Cohesion & Coherence", "category": "Writing", "order": 2 },
        ...
      ]
    }`;

    const userPrompt = `Diagnostic Answers: ${JSON.stringify(answers)}. Target Band: ${goalBand}`;
    
    const analysis = await generateWithRetry(systemPrompt, userPrompt);

    await dbConnect();
    
    // Save to UserRoadmap
    const roadmap = await UserRoadmap.findOneAndUpdate(
      { userId },
      {
        baselineBand: analysis.baselineBand,
        status: 'Active',
        topics: analysis.roadmap.map((topic: any) => ({
          ...topic,
          status: topic.order === 1 ? 'Available' : 'Locked'
        })),
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, analysis, roadmap });
  } catch (error: any) {
    console.error('Diagnostic evaluation error:', error);
    return NextResponse.json({ message: 'Failed to evaluate diagnostic test' }, { status: 500 });
  }
}
