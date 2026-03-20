import { NextResponse } from 'next/server';
import getClient, { DEPLOYMENT_MINI, DEPLOYMENT_HIGH, DEPLOYMENT_MISTRAL, DEPLOYMENT_PHI } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import IELTSContent from '@/models/IELTSContent';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const { module, topic, difficulty, userId } = await request.json();

    if (!module || !topic) {
      return NextResponse.json({ message: 'Module and Topic are required' }, { status: 400 });
    }

    await dbConnect();

    // 1. Check if content exists in DB (to save costs)
    const existingContent = await IELTSContent.findOne({ 
      module, 
      topic: { $regex: new RegExp(`^${topic}$`, 'i') }, 
      difficulty 
    });
    if (existingContent) {
      return NextResponse.json({ success: true, data: existingContent.content, fromCache: true });
    }

    const client = getClient();


    // Fetch user for persona context if userId is provided
    let personaContext = "";
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        personaContext = `The user is a ${user.occupation || 'Student'} with interests in: ${user.hobbies?.join(', ') || 'General topics'}. Target Band: ${user.goalBand || 7.0}.`;
      }
    }

    // 2. Helper function for OpenAI call with self-correction loop
    const generateWithRetry = async (
      model: string,
      messages: any[], 
      temperature = 0.7, 
      maxTokens = 4000, 
      maxRetries = 5,
      validator?: (data: any) => { valid: boolean; reason?: string }
    ) => {
      let lastError: any;
      let currentMessages = [...messages];
      let currentTemperature = temperature;

      for (let i = 0; i < maxRetries; i++) {
        try {
          console.log(`[API:Content] Attempt ${i + 1}/${maxRetries} using ${model} (Temp: ${currentTemperature.toFixed(2)})`);
          const response = await client.chat.completions.create({
            model,
            messages: currentMessages,
            response_format: { type: "json_object" },
            temperature: currentTemperature,
            max_tokens: maxTokens
          });

          const content = response.choices[0].message.content || '{}';
          let data;
          try {
            data = JSON.parse(content);
          } catch (parseError: any) {
            console.warn(`[API:Content] JSON Parse failed on attempt ${i + 1}:`, parseError.message);
            throw new Error(`Invalid JSON format: ${parseError.message}`);
          }

          // Run validation if provided
          if (validator) {
            const validation = validator(data);
            if (!validation.valid) {
              console.warn(`[API:Content] Validation failed on attempt ${i + 1}: ${validation.reason}`);
              
              // FEEDBACK LOOP
              currentMessages.push({ role: "assistant", content: content });
              currentMessages.push({ 
                role: "user", 
                content: `Your previous JSON was invalid: "${validation.reason}". Please fix this and provide the complete corrected JSON.` 
              });
              
              currentTemperature = Math.max(0.2, currentTemperature - 0.1);
              throw new Error(validation.reason);
            }
          }

          return data;
        } catch (error: any) {
          lastError = error;
          if (i < maxRetries - 1) {
            await new Promise(res => setTimeout(res, 1000 * (i + 1))); 
          }
        }
      }
      throw new Error(`Content generation failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
    };

    // Module-specific validator
    const validateContent = (data: any) => {
      if (module === 'Reading') {
        if (!data.passage || !data.questions || !Array.isArray(data.questions)) return { valid: false, reason: "Missing passage or questions array" };
        const hasTextAndCorrect = data.questions.every((q: any) => q.text && q.correct);
        if (!hasTextAndCorrect) return { valid: false, reason: "Some reading questions are missing 'text' or 'correct' answer" };
      } else if (module === 'Writing') {
        if (!data.prompt || !data.sampleAnswer) return { valid: false, reason: "Missing prompt or sample answer" };
      } else if (module === 'Listening') {
        if (!data.script || !data.questions || !Array.isArray(data.questions)) return { valid: false, reason: "Missing script or questions array" };
        const hasTextAndCorrect = data.questions.every((q: any) => q.text && q.correct);
        if (!hasTextAndCorrect) return { valid: false, reason: "Some listening questions are missing 'text' or 'correct' answer" };
      } else if (module === 'Speaking') {
        if (!data.questions || !Array.isArray(data.questions)) return { valid: false, reason: "Missing questions array" };
        const hasText = data.questions.every((q: any) => q.text);
        if (!hasText) return { valid: false, reason: "Some speaking questions are missing 'text'" };
      }
      return { valid: true };
    };

    // 3. Define prompts and select model
    let systemPrompt = "";
    let selectedModel = DEPLOYMENT_MINI;

    const difficultyContext = 
      difficulty === 'Easy' ? 'Target Band 5.0-6.0: Simpler vocabulary, clear articulation.' :
      difficulty === 'Hard' ? 'Target Band 8.0-9.0: Complex academic vocabulary, fast pace.' :
      'Target Band 6.5-7.5: Standard IELTS difficulty.';

    if (module === 'Reading') {
      selectedModel = DEPLOYMENT_MINI; 
      systemPrompt = `You are an IELTS Reading content creator. Topic: "${topic}". Difficulty: ${difficulty}.
      Format as JSON: { title: string, passage: string (700-900 words), questions: [{ id: number, type: string, text: string, options: [string], correct: string }], discussion: [{ questionId: number, explanation: string }] }`;
    } else if (module === 'Writing') {
      selectedModel = DEPLOYMENT_MINI;
      systemPrompt = `You are an IELTS Writing examiner. Topic: "${topic}". Difficulty: ${difficulty}.
      Format as JSON: { taskType: "Writing Task 2", prompt: string, instructions: string, sampleAnswer: string (250+ words) }`;
    } else if (module === 'Listening') {
      selectedModel = DEPLOYMENT_MINI;
      systemPrompt = `You are an IELTS Listening creator. Topic: "${topic}". Difficulty: ${difficulty}.
      Format as JSON: { script: string (800-1000 words), questions: [{ id: number, type: string, text: string, options: [string], correct: string }], discussion: [{ questionId: number, explanation: string }] }
      IMPORTANT: Each question in the "questions" array MUST include both the "text" of the question and the "correct" answer string. They must be generated as a single package for each question.`;
    } else if (module === 'Speaking') {
      selectedModel = DEPLOYMENT_MINI;
      systemPrompt = `You are an IELTS Speaking examiner. Topic: "${topic}". Difficulty: ${difficulty}.
      Format as JSON: { topic: string, questions: [{ id: number, text: string, sampleAnswer: string }] }`;
    }

    // 4. Generate with self-correction
    const generatedContent = await generateWithRetry(
      selectedModel,
      [{ role: "system", content: systemPrompt }],
      0.7,
      4000,
      5,
      validateContent
    );

    // 5. Save to DB for future use
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
