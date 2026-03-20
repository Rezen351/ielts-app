import { NextResponse } from 'next/server';
import getClient, { DEPLOYMENT_HIGH } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import IELTSContent from '@/models/IELTSContent';
import { getSectionPrompt, getModuleStructurePrompt } from './section-prompts';

export async function GET() {
  try {
    await dbConnect();
    const packages = await IELTSContent.find({ module: 'Examiner' });
    return NextResponse.json({ success: true, packages });
  } catch (error: any) {
    console.error('GET Examiner packages error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      action,
      packageId,
      moduleName,
      questionDetails,
      testType = 'Academic', 
      difficulty = 'Medium'
    } = body;

    console.log(`[API] Examiner POST Action: ${action}`, { packageId, moduleName });
    await dbConnect();

    // 1. Inisialisasi Paket (Action yang tidak butuh packageId existing)
    if (action === 'initPackage') {
      const packageCount = await IELTSContent.countDocuments({ module: 'Examiner' });
      const newPackage = await IELTSContent.create({
        module: 'Examiner',
        title: `Practice Test #${packageCount + 1} (${testType})`,
        topic: `examiner_${Date.now()}`,
        difficulty,
        content: { testType, difficulty, status: 'incomplete', answerKey: {} }
      });
      return NextResponse.json({ success: true, packageId: newPackage._id });
    }

    // 2. Validasi Keberadaan Paket untuk action lainnya
    if (!packageId) return NextResponse.json({ message: 'Package ID required' }, { status: 400 });
    const pkg = await IELTSContent.findById(packageId);
    if (!pkg) return NextResponse.json({ message: 'Package not found' }, { status: 404 });

    const client = getClient();
    const moduleKey = moduleName?.toLowerCase();

    // Helper function for OpenAI call with self-correction loop
    const generateWithRetry = async (
      initialMessages: any[], 
      temperature = 0.7, 
      maxTokens = 4000, 
      maxRetries = 10,
      validator?: (data: any) => { valid: boolean; reason?: string }
    ) => {
      let lastError: any;
      let currentMessages = [...initialMessages];
      let currentTemperature = temperature;

      for (let i = 0; i < maxRetries; i++) {
        try {
          console.log(`[API] OpenAI attempt ${i + 1}/${maxRetries} (Temp: ${currentTemperature.toFixed(2)})`);
          const response = await client.chat.completions.create({
            model: DEPLOYMENT_HIGH,
            messages: currentMessages,
            response_format: { type: "json_object" },
            temperature: currentTemperature,
            max_tokens: maxTokens
          });

          const content = response.choices[0].message.content || '{}';
          const data = JSON.parse(content);

          // Run validation if provided
          if (validator) {
            const validation = validator(data);
            if (!validation.valid) {
              console.warn(`[API] Validation failed on attempt ${i + 1}: ${validation.reason}`);
              
              // FEEDBACK LOOP: Tell the AI what it did wrong
              currentMessages.push({ role: "assistant", content: content });
              currentMessages.push({ 
                role: "user", 
                content: `Your previous response was invalid for the following reason: "${validation.reason}". Please fix this error and provide the complete, corrected JSON for the entire section.` 
              });
              
              // ADAPTIVE BEHAVIOR: Lower temperature to make it more deterministic/strict
              currentTemperature = Math.max(0.2, currentTemperature - 0.1);
              
              throw new Error(validation.reason);
            }
          }

          return data;
        } catch (error: any) {
          lastError = error;
          if (i < maxRetries - 1) {
            const delay = 1000 * (i + 1);
            console.log(`[API] Waiting ${delay}ms before next attempt...`);
            await new Promise(res => setTimeout(res, delay)); 
          }
        }
      }
      throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
    };

    // Validator for IELTS Sections
    const validateIELTSSection = (data: any) => {
      const currentModule = moduleKey || moduleName?.toLowerCase();
      
      if (action === 'generateModuleStructure') return { valid: true };

      // 1. Validation for Writing
      if (currentModule === 'writing') {
        if (!data.prompt || !data.sampleAnswer) {
          return { valid: false, reason: "Writing task is missing 'prompt' or 'sampleAnswer'" };
        }
        return { valid: true };
      }

      // 2. Validation for Speaking
      if (currentModule === 'speaking') {
        const isPart2 = questionDetails?.sectionIndex === 1;
        if (!data.topic) return { valid: false, reason: "Speaking part is missing 'topic'" };
        
        if (isPart2) {
          if (!data.bullets && !data.questions) return { valid: false, reason: "Speaking Part 2 missing 'bullets' or 'questions'" };
        } else {
          if (!data.questions || !Array.isArray(data.questions)) return { valid: false, reason: "Speaking Part 1/3 missing 'questions' array" };
        }
        return { valid: true };
      }

      // 3. Validation for Listening & Reading
      if (!data.questions || !Array.isArray(data.questions)) {
        return { valid: false, reason: "Missing 'questions' array" };
      }

      const expectedCount = currentModule === 'listening' ? 10 : (questionDetails?.sectionIndex === 2 ? 14 : 13);
      if (data.questions.length < expectedCount) {
        return { valid: false, reason: `Incomplete questions: expected ${expectedCount}, got ${data.questions.length}` };
      }

      if (!data.answerKey || typeof data.answerKey !== 'object') {
        return { valid: false, reason: "Missing or invalid 'answerKey' object" };
      }

      for (const q of data.questions) {
        const qId = q.id?.toString() || 'unknown';
        if (!q.type || !q.question) return { valid: false, reason: `Question ${qId} missing type/text` };
        // 2. Type-Specific Validation
        const needsOptions = ['multiple_choice', 'matching', 'true_false_not_given'].includes(q.type);
        if (needsOptions) {
          if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
            return { valid: false, reason: `Question ${qId} (${q.type}) missing options` };
          }
          for (const opt of q.options) {
            if (typeof opt !== 'string') return { valid: false, reason: `Question ${qId} option must be string` };
          }
        }

        // 3. Strict Placeholder Check for Text-Input Types
        if (q.type === 'gap_fill' || q.type === 'short_answer') {
          if (!q.question.includes('___')) {
            return { valid: false, reason: `Question ${qId} (${q.type}) is missing the input placeholder '__________'. Current text: "${q.question}"` };
          }
        }


        if (!data.answerKey[qId]) return { valid: false, reason: `Question ${qId} missing in answerKey` };
      }

      return { valid: true };
    };

    // 3. Penanganan Action Generatif
    if (action === 'generateModuleStructure') {
      const data = await generateWithRetry(
        [{ role: "system", content: getModuleStructurePrompt(moduleName) }],
        0.1,
        2000,
        3
      );

      pkg.content[moduleKey] = { structure: data };
      pkg.markModified('content');
      await pkg.save();
      return NextResponse.json({ success: true, data });
    }

    if (action === 'generateSection' || action === 'generateQuestion') {
      const data = await generateWithRetry(
        [{ role: "system", content: getSectionPrompt(moduleName, testType, difficulty, pkg.content, questionDetails || {}) }],
        0.7,
        4000,
        10,
        validateIELTSSection
      );

      const updatedContent = { ...pkg.content };
      
      if (!updatedContent.answerKey) updatedContent.answerKey = {};

      if (action === 'generateSection') {
        const { sectionIndex: sIdx } = questionDetails;
        if (!updatedContent[moduleKey]) updatedContent[moduleKey] = {};

        if (moduleKey === 'listening') {
          if (!updatedContent.listening.sections) updatedContent.listening.sections = [];
          updatedContent.listening.sections[sIdx] = { 
            ...updatedContent.listening.structure?.sections?.[sIdx], 
            script: data.script, 
            questions: data.questions 
          };
        } else if (moduleKey === 'reading') {
          if (!updatedContent.reading.passages) updatedContent.reading.passages = [];
          updatedContent.reading.passages[sIdx] = { 
            ...updatedContent.reading.structure?.passages?.[sIdx], 
            text: data.text, 
            questions: data.questions 
          };
        } else if (moduleKey === 'speaking') {
           if (!updatedContent.speaking) updatedContent.speaking = {};
           if (sIdx === 1) { // Part 2
              updatedContent.speaking.part2 = {
                topic: data.topic,
                bullets: data.bullets || data.questions || [],
                sampleAnswer: data.sampleAnswer
              };
           } else {
              updatedContent.speaking[`part${sIdx + 1}`] = data.questions || [];
           }
        }

        if (data.answerKey) {
          if (!updatedContent.answerKey[moduleKey]) updatedContent.answerKey[moduleKey] = {};
          Object.entries(data.answerKey).forEach(([qId, val]) => {
            updatedContent.answerKey[moduleKey][`s${sIdx}q${qId}`] = val;
          });
        }
      } else if (moduleKey === 'writing') {
        if (!updatedContent.writing) updatedContent.writing = {};
        updatedContent.writing[questionDetails?.taskType || 'task1'] = { 
          prompt: data.prompt, 
          sampleAnswer: data.sampleAnswer 
        };
      }

      pkg.content = updatedContent;
      pkg.markModified('content');
      await pkg.save(); // INCREMENTAL SAVE: Save immediately after success
      return NextResponse.json({ success: true, data });
    }

    // 4. Action Utilitas
    switch (action) {
      case 'finalizePackage':
        pkg.content.status = 'complete';
        break;
      case 'deletePackage':
        await IELTSContent.findByIdAndDelete(packageId);
        return NextResponse.json({ success: true });
      case 'getPackage':
        return NextResponse.json({ success: true, package: pkg });
      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    pkg.markModified('content');
    await pkg.save();
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Examiner generation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
