import { NextResponse } from 'next/server';
import { generateWithRetry } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import { UserRoadmap } from '@/models/Learning';

export async function POST(request: Request) {
  try {
    const { userId, goalBand, baselineBand } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Fetch existing roadmap to see what was already covered
    const existingRoadmap = await UserRoadmap.findOne({ userId });
    const coveredTopics = existingRoadmap?.topics?.map((t: any) => t.title) || [];

    const systemPrompt = `You are a Senior IELTS Examiner. The student has completed their initial learning roadmap.
    They are currently at Band ${baselineBand} and aiming for Band ${goalBand}.
    
    Generate a NEW set of 5 advanced learning topics to help them reach their goal.
    DO NOT repeat these previously covered topics: ${coveredTopics.join(', ')}.
    Focus on more complex areas like "Advanced Synthesis", "Lexical Precision", "Critical Argumentation", etc.

    Return the result in JSON format:
    {
      "roadmap": [
        { "topicId": "topic-id-slug", "title": "Topic Title", "category": "Writing/Speaking/Reading/Listening/Grammar/Vocabulary", "order": 1 },
        ...
      ]
    }`;

    const userPrompt = "Generate a level-up roadmap for a student who finished their first sequence.";
    
    const analysis = await generateWithRetry(systemPrompt, userPrompt);

    // Update the roadmap with new topics and reset status to 'Active'
    const roadmap = await UserRoadmap.findOneAndUpdate(
      { userId },
      {
        status: 'Active',
        topics: analysis.roadmap.map((topic: any) => ({
          ...topic,
          status: topic.order === 1 ? 'Available' : 'Locked'
        })),
        milestonePassed: false,
        masteryScore: undefined,
        masteryAnalysis: undefined,
        milestoneQuiz: undefined,
        lastUpdated: new Date()
      },
      { new: true }
    );

    return NextResponse.json({ success: true, roadmap });
  } catch (error: any) {
    console.error('Roadmap refresh error:', error);
    return NextResponse.json({ message: 'Failed to refresh roadmap' }, { status: 500 });
  }
}
