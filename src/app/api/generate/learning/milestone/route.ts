import { NextResponse } from 'next/server';
import { generateWithRetry, DEPLOYMENT_MINI } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import { UserRoadmap, LearningMaterial } from '@/models/Learning';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();

    const roadmap = await UserRoadmap.findOne({ userId });
    if (!roadmap) {
      return NextResponse.json({ message: 'Roadmap not found' }, { status: 404 });
    }

    // Get all completed topics
    const completedTopics = roadmap.topics
      .filter((t: any) => t.status === 'Completed')
      .map((t: any) => t.topicId);

    if (completedTopics.length === 0) {
       return NextResponse.json({ message: 'No completed topics to assess' }, { status: 400 });
    }

    // Fetch existing materials to give the AI context
    const materials = await LearningMaterial.find({ topicId: { $in: completedTopics } });
    
    const systemPrompt = `You are an expert IELTS Examiner. Create a "Milestone Assessment" quiz based on the following topics that the student has just finished.
    
    The goal is to verify if they have truly mastered the concepts before they move to the next level.
    
    Return ONLY a JSON object with this structure:
    {
      "questions": [
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "The exact string from options that is correct",
          "explanation": "Brief explanation of why this is correct and what concept it tests.",
          "topicId": "the-relevant-topic-id-from-the-list"
        }
      ]
    }
    
    Rules:
    1. Generate exactly 2 questions for each topic provided.
    2. Questions should be challenging but fair.
    3. Ensure options are distinct.
    4. Provide clear explanations.`;

    const userPrompt = `Generate a milestone quiz for these topics: ${completedTopics.join(', ')}. 
    Reference materials: ${JSON.stringify(materials.map(m => ({ topicId: m.topicId, title: m.title })))}`;

    const aiResponse = await generateWithRetry(systemPrompt, userPrompt, { deployment: DEPLOYMENT_MINI });
    
    // Update roadmap with the quiz and change status to Milestone_Pending
    roadmap.milestoneQuiz = {
      questions: aiResponse.questions,
      userAnswers: []
    };
    roadmap.status = 'Milestone_Pending';
    roadmap.lastUpdated = new Date();
    await roadmap.save();

    return NextResponse.json({ success: true, quiz: aiResponse.questions });
  } catch (error: any) {
    console.error('Milestone generation error:', error);
    return NextResponse.json({ message: 'Failed to generate milestone quiz' }, { status: 500 });
  }
}
