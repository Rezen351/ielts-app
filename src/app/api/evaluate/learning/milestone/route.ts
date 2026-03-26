import { NextResponse } from 'next/server';
import { generateWithRetry, DEPLOYMENT_MINI } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import { UserRoadmap } from '@/models/Learning';

export async function POST(request: Request) {
  try {
    const { userId, answers } = await request.json();
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();

    const roadmap = await UserRoadmap.findOne({ userId });
    if (!roadmap || !roadmap.milestoneQuiz) {
      return NextResponse.json({ message: 'Milestone quiz not found' }, { status: 404 });
    }

    const questions = roadmap.milestoneQuiz.questions;
    let correctCount = 0;
    const results = questions.map((q: any, idx: number) => {
      const isCorrect = q.correctAnswer === answers[idx];
      if (isCorrect) correctCount++;
      return {
        topicId: q.topicId,
        isCorrect
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);
    roadmap.masteryScore = score;
    roadmap.milestoneQuiz.userAnswers = answers;

    if (score >= 80) {
      // Pass!
      roadmap.status = 'Completed'; 
      roadmap.milestonePassed = true;
      roadmap.masteryAnalysis = "Excellent work! You have demonstrated strong mastery of the current topics. You are ready for the next level.";
    } else {
      // Fail. Remedial path.
      roadmap.status = 'Remedial';
      roadmap.milestonePassed = false;
      
      // Analyze weaknesses based on results
      const weaknesses = results.filter((r: any) => !r.isCorrect).map((r: any) => r.topicId);
      const uniqueWeaknesses = [...new Set(weaknesses)];
      
      const systemPrompt = `You are an expert IELTS Tutor. A student failed their milestone assessment with a score of ${score}%.
      They struggled with the following topics: ${uniqueWeaknesses.join(', ')}.
      
      Provide a "Remedial Feedback" message that is encouraging but identifies exactly what they need to review. 
      Suggest specific areas of improvement for each weak topic.
      
      Return ONLY a JSON object with this structure:
      {
        "feedback": "Encouraging overall feedback message.",
        "weakPoints": [
          { "topic": "Topic Title", "suggestion": "Specific improvement advice" }
        ]
      }`;
      
      const userPrompt = `Analyze failures for topics: ${uniqueWeaknesses.join(', ')}.`;
      const aiResponse = await generateWithRetry(systemPrompt, userPrompt, { deployment: DEPLOYMENT_MINI });
      
      // Convert AI response to a nice string for storage or just store JSON
      roadmap.masteryAnalysis = JSON.stringify(aiResponse);
    }

    roadmap.lastUpdated = new Date();
    await roadmap.save();

    return NextResponse.json({ 
      success: true, 
      score, 
      passed: score >= 80, 
      analysis: roadmap.masteryAnalysis 
    });

  } catch (error: any) {
    console.error('Milestone evaluation error:', error);
    return NextResponse.json({ message: 'Failed to evaluate milestone quiz' }, { status: 500 });
  }
}
