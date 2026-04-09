import { NextResponse } from 'next/server';
import { generateWithRetry } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import { LearningMaterial } from '@/models/Learning';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');
    const force = searchParams.get('force') === 'true';

    if (!topicId) {
      return NextResponse.json({ message: 'Topic ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    // Check if material already exists in DB
    let material = await LearningMaterial.findOne({ topicId });
    
    if (!material || force) {
      let systemPrompt = `You are an expert IELTS Tutor. Generate a comprehensive, high-engagement learning material in a "Blog Article" style.
      
      CRITICAL FORMATTING RULES:
      1. Use Markdown for content: **bold** for key terms, *italics* for emphasis.
      2. Use Markdown Tables for any comparisons, word lists, or synonyms (e.g., | Word | Synonym |).
      3. Use Bullet points and Numbered lists for strategies or steps.
      4. Ensure sections are substantial and educational.

      Return ONLY a JSON object with this structure:
      {
        "title": "Topic Title",
        "category": "Must be EXACTLY one of: Writing, Speaking, Reading, Listening, Grammar, Vocabulary",
        "difficultyLevel": "Must be EXACTLY one of: Beginner, Intermediate, Advanced",
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

      let userPrompt = `Generate a detailed learning module for the topic: "${topicId}". Ensure it is educational, encouraging, and follows official IELTS standards.`;

      // Special handling for remedial topics
      if (topicId.startsWith('remedial-')) {
        const { UserRoadmap } = await import('@/models/Learning');
        const roadmap = await UserRoadmap.findOne({ 'topics.topicId': topicId });
        
        if (roadmap && roadmap.masteryAnalysis) {
          const analysis = JSON.parse(roadmap.masteryAnalysis);
          systemPrompt = `You are an expert IELTS Tutor. Generate a "REMEDIAL DEEP DIVE" module for a student who failed their milestone assessment.
          
          THE FOCUS IS ON THESE WEAKNESSES:
          ${analysis.weakPoints.map((wp: any) => `- ${wp.topic}: ${wp.suggestion}`).join('\n')}

          Your goal is to provide a deep, intensive review of these specific areas. Combine them into a cohesive, high-impact lesson.
          
          CRITICAL FORMATTING RULES:
          1. Use Markdown for content: **bold** for key terms, *italics* for emphasis.
          2. Use Markdown Tables for comparisons, word lists, or synonyms.
          3. Use Bullet points and Numbered lists for strategies or steps.
          4. Ensure sections are substantial and educational.

          Return ONLY a JSON object with the same structure as before.`;
          
          userPrompt = `Generate a remedial deep dive for: ${analysis.remedialTitle || 'Specialized Review'}. 
          Reference the previous weaknesses and provide advanced strategies to overcome them.`;
        }
      }
      
      const validator = (data: any) => {
        const validCategories = ['Writing', 'Speaking', 'Reading', 'Listening', 'Grammar', 'Vocabulary'];
        const validLevels = ['Beginner', 'Intermediate', 'Advanced'];

        if (!validCategories.includes(data.category)) {
          return { valid: false, reason: `Invalid category: "${data.category}". Must be one of: ${validCategories.join(', ')}` };
        }
        if (!validLevels.includes(data.difficultyLevel)) {
          return { valid: false, reason: `Invalid difficultyLevel: "${data.difficultyLevel}". Must be one of: ${validLevels.join(', ')}` };
        }
        return { valid: true };
      };

      const aiResponse = await generateWithRetry(systemPrompt, userPrompt, { validator });
      
      if (material) {
        // Use findOneAndReplace or findOneAndUpdate to update existing material
        material = await LearningMaterial.findOneAndUpdate(
          { topicId },
          { ...aiResponse },
          { new: true, upsert: true }
        );
      } else {
        material = await LearningMaterial.create({
          topicId,
          ...aiResponse
        });
      }
    }

    return NextResponse.json({ success: true, material });
  } catch (error: any) {
    console.error('Content generation error:', error);
    return NextResponse.json({ message: 'Failed to generate learning material' }, { status: 500 });
  }
}
