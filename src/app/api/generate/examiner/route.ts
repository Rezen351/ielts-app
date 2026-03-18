import { NextResponse } from 'next/server';
import client, { DEPLOYMENT_MINI, DEPLOYMENT_HIGH } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import IELTSContent from '@/models/IELTSContent';

export async function GET() {
  try {
    await dbConnect();
    // Return all fields including content, but without sorting to avoid indexing issues in Cosmos DB
    const packages = await IELTSContent.find({ module: 'Examiner' });
    return NextResponse.json({ success: true, packages });
  } catch (error: any) {
    console.error('GET Examiner packages error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Renamed and modified to generate only the structure
const getModuleStructurePrompt = (moduleName: string, testType: string, difficulty: string) => {
  switch (moduleName.toLowerCase()) {
    case 'listening':
      return `You are a professional IELTS Listening content creator. Generate the STRUCTURE for an IELTS Listening test.
      Describe 4 sections, their types, and the number of questions per section. Do NOT generate actual questions or scripts.
      Example for Section 1: { "title": "Conversation about booking a trip", "type": "Form Completion", "questionCount": 10 }
      OUTPUT JSON: { "sections": [{ "title": "...", "type": "...", "questionCount": ... }] }`;
    case 'reading':
      return `You are a professional IELTS Reading content creator. Generate the STRUCTURE for an IELTS ${testType} Reading test.
      Describe 3 passages, their titles, main topics, and the number of questions per passage. Do NOT generate actual passages or questions.
      Example for Passage 1: { "title": "The History of Tea", "topic": "History", "questionCount": 13 }
      OUTPUT JSON: { "passages": [{ "title": "...", "topic": "...", "questionCount": ... }] }`;
    case 'writing':
      return `You are a professional IELTS Writing content creator. Generate the STRUCTURE for an IELTS ${testType} Writing test.
      Describe Task 1 and Task 2. Do NOT generate actual prompts or sample answers.
      Example for Task 1: { "type": "Graph Description", "wordCount": 150 }
      OUTPUT JSON: { "task1": { "type": "...", "wordCount": ... }, "task2": { "type": "...", "wordCount": ... } }`;
    case 'speaking':
      return `You are a professional IELTS Speaking content creator. Generate the STRUCTURE for an IELTS Speaking test.
      Describe 3 parts and their general focus. Do NOT generate actual questions.
      Example for Part 1: { "title": "Introduction & Interview", "focus": "Personal questions" }
      OUTPUT JSON: { "part1": { "title": "...", "focus": "..." }, "part2": { "title": "...", "focus": "..." }, "part3": { "title": "...", "focus": "..." } }`;
    default:
      return '';
  }
};

const getQuestionPrompt = (moduleName: string, testType: string, difficulty: string, currentContent: any, questionDetails: any) => {
  const { sectionIndex, questionIndex, passageTitle, taskType, partNumber } = questionDetails;

  switch (moduleName.toLowerCase()) {
    case 'listening':
        const section = currentContent.listening.structure.sections[sectionIndex];
        return `Generate ONE IELTS Listening question for Section ${sectionIndex + 1} ("${section.title}", type: "${section.type}").
        The question should be numbered ${questionIndex} (overall within the test).
        Difficulty: ${difficulty}.
        OUTPUT JSON: { "question": { "id": ${questionIndex}, "text": "...", "options": ["...", "..."], "correct": "..." }, "answerKey": { "${questionIndex}": "..." } }`;
    case 'reading':
        const passage = currentContent.reading.structure.passages[sectionIndex]; // sectionIndex here is passage index
        return `Generate ONE IELTS Reading question for Passage ${sectionIndex + 1} ("${passage.title}").
        The question should be numbered ${questionIndex} (overall within the test).
        Difficulty: ${difficulty}.
        Passage Text: "${passageTitle}" // Use the passed passageTitle for context
        OUTPUT JSON: { "question": { "id": ${questionIndex}, "text": "...", "options": ["...", "..."], "correct": "..." }, "answerKey": { "${questionIndex}": "..." } }`;
    case 'writing':
        if (taskType === 'task1') {
            return `Generate an IELTS ${testType} Writing Task 1 prompt based on the following structure: ${JSON.stringify(currentContent.writing.structure.task1)}.
            OUTPUT JSON: { "prompt": "...", "sampleAnswer": "..." }`;
        } else if (taskType === 'task2') {
            return `Generate an IELTS Writing Task 2 essay prompt based on the following structure: ${JSON.stringify(currentContent.writing.structure.task2)}.
            OUTPUT JSON: { "prompt": "...", "sampleAnswer": "..." }`;
        }
        return '';
    case 'speaking':
        if (partNumber === 1) {
            return `Generate ONE IELTS Speaking question for Part 1: "Introduction & Interview". Focus on personal questions as per the structure: ${JSON.stringify(currentContent.speaking.structure.part1)}.
            OUTPUT JSON: { "question": { "id": ${questionIndex}, "text": "..." }, "sampleAnswer": "..." }`;
        } else if (partNumber === 2) {
            return `Generate an IELTS Speaking Part 2 Cue Card. Include a topic and 3-4 bullet points. Structure: ${JSON.stringify(currentContent.speaking.structure.part2)}.
            OUTPUT JSON: { "topic": "...", "bullets": ["...", "...", "..."], "sampleAnswer": "..." }`;
        } else if (partNumber === 3) {
            return `Generate ONE IELTS Speaking question for Part 3: "Discussion". Based on the context of Part 2 and structure: ${JSON.stringify(currentContent.speaking.structure.part3)}.
            OUTPUT JSON: { "question": { "id": ${questionIndex}, "text": "..." }, "sampleAnswer": "..." }`;
        }
        return '';
    default:
        return '';
  }
}

export async function POST(request: Request) {
  try {
    const { 
      action,
      packageId,
      moduleName,
      questionDetails, // New field for per-question generation
      testType = 'Academic', 
      difficulty = 'Medium'
    } = await request.json();

    await dbConnect();

    if (action === 'initPackage') {
      const packageCount = await IELTSContent.countDocuments({ module: 'Examiner' });
      const title = `Practice Test #${packageCount + 1} (${testType})`;
      const topic = `examiner_${Date.now()}`;

      const newPackage = await IELTSContent.create({
        module: 'Examiner',
        title,
        topic,
        difficulty,
        content: { 
          testType, 
          difficulty, 
          status: 'incomplete',
          answerKey: {}
        }
      });

      return NextResponse.json({ success: true, packageId: newPackage._id, title });
    }

    if (action === 'generateModuleStructure') {
      if (!packageId || !moduleName) {
        return NextResponse.json({ message: 'Package ID and Module Name required' }, { status: 400 });
      }

      const systemPrompt = getModuleStructurePrompt(moduleName, testType, difficulty);
      const response = await client.chat.completions.create({
        model: DEPLOYMENT_HIGH,
        messages: [{ role: "system", content: systemPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000 // Structure should be small
      });

      const moduleStructure = JSON.parse(response.choices[0].message.content || '{}');
      const pkg = await IELTSContent.findById(packageId);

      if (!pkg) {
        return NextResponse.json({ message: 'Package not found' }, { status: 404 });
      }

      // Merge structure and save
      const updatedContent = { ...pkg.content };
      updatedContent[moduleName.toLowerCase()] = { structure: moduleStructure }; // Store structure separately
      
      pkg.content = updatedContent;
      pkg.markModified('content');
      await pkg.save();

      return NextResponse.json({ success: true, data: moduleStructure });
    }

    if (action === 'generateQuestion') {
      if (!packageId || !moduleName || !questionDetails) {
        return NextResponse.json({ message: 'Package ID, Module Name, and Question Details required' }, { status: 400 });
      }

      const pkg = await IELTSContent.findById(packageId);
      if (!pkg) {
        return NextResponse.json({ message: 'Package not found' }, { status: 404 });
      }

      const systemPrompt = getQuestionPrompt(moduleName, testType, difficulty, pkg.content, questionDetails);
      
      // Select model based on complexity of task
      let targetModel = DEPLOYMENT_MINI;
      const moduleKey = moduleName.toLowerCase();

      if (moduleKey === 'writing' || (moduleKey === 'speaking' && questionDetails.partNumber === 2)) {
        // Prompts and Cue Cards need high quality
        targetModel = DEPLOYMENT_HIGH;
      }

      const response = await client.chat.completions.create({
        model: targetModel,
        messages: [{ role: "system", content: systemPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: targetModel === DEPLOYMENT_HIGH ? 1500 : 1000
      });

      const questionDataRaw = JSON.parse(response.choices[0].message.content || '{}');
      
      const updatedContent = { ...pkg.content };
      // moduleKey is already defined above

      // Logic to merge questionDataRaw into the correct place in updatedContent[moduleKey]
      // This will be highly specific to each module's structure
      // For now, a placeholder, needs to be refined based on actual module structures

      if (moduleKey === 'listening' || moduleKey === 'reading') {
        const { sectionIndex } = questionDetails;
        
        // Ensure the module key exists and has an array for sections/passages
        if (!updatedContent[moduleKey]) {
          updatedContent[moduleKey] = { sections: [] }; // or passages: []
        }
        if (!updatedContent[moduleKey].sections && moduleKey === 'listening') {
          updatedContent[moduleKey].sections = [];
        }
        if (!updatedContent[moduleKey].passages && moduleKey === 'reading') {
          updatedContent[moduleKey].passages = [];
        }

        const targetArray = moduleKey === 'listening' ? updatedContent[moduleKey].sections : updatedContent[moduleKey].passages;

        // Ensure the specific section/passage object exists and has a questions array
        if (!targetArray[sectionIndex]) {
            // This case should ideally not happen if generateModuleStructure correctly built the structure
            // But as a fallback, initialize it with a questions array
            targetArray[sectionIndex] = { questions: [] };
        }
        if (!targetArray[sectionIndex].questions) {
            targetArray[sectionIndex].questions = [];
        }
        targetArray[sectionIndex].questions.push(questionDataRaw.question);
      } else if (moduleKey === 'writing' && questionDetails.taskType) {
        if (!updatedContent[moduleKey]) {
          updatedContent[moduleKey] = {};
        }
        if (!updatedContent[moduleKey][questionDetails.taskType]) {
          updatedContent[moduleKey][questionDetails.taskType] = {};
        }
        updatedContent[moduleKey][questionDetails.taskType].prompt = questionDataRaw.prompt;
        updatedContent[moduleKey][questionDetails.taskType].sampleAnswer = questionDataRaw.sampleAnswer;
      } else if (moduleKey === 'speaking' && questionDetails.partNumber) {
        const partKey = `part${questionDetails.partNumber}`;
        if (!updatedContent[moduleKey]) {
          updatedContent[moduleKey] = {};
        }
        if (!updatedContent[moduleKey][partKey]) {
          updatedContent[moduleKey][partKey] = (questionDetails.partNumber === 2) ? {} : { questions: [] };
        }

        if (questionDetails.partNumber === 2) {
          updatedContent[moduleKey][partKey] = {
            topic: questionDataRaw.topic,
            bullets: questionDataRaw.bullets,
            sampleAnswer: questionDataRaw.sampleAnswer
          };
        } else {
          if (!updatedContent[moduleKey][partKey].questions) {
            updatedContent[moduleKey][partKey].questions = [];
          }
          updatedContent[moduleKey][partKey].questions.push({
            ...questionDataRaw.question,
            sampleAnswer: questionDataRaw.sampleAnswer
          });
        }
      }

      // Merge answer keys
      if (questionDataRaw.answerKey) {
        if (!updatedContent.answerKey) {
            updatedContent.answerKey = {};
        }
        if (!updatedContent.answerKey[moduleKey]) {
            updatedContent.answerKey[moduleKey] = {};
        }
        updatedContent.answerKey = {
          ...updatedContent.answerKey,
          [moduleKey]: {
            ...updatedContent.answerKey[moduleKey],
            ...questionDataRaw.answerKey
          }
        };
      }
      
      pkg.content = updatedContent;
      pkg.markModified('content');
      await pkg.save();

      return NextResponse.json({ success: true, data: questionDataRaw });
    }

    if (action === 'finalizePackage') {
       const pkg = await IELTSContent.findById(packageId);
       if (!pkg) return NextResponse.json({ message: 'Not found' }, { status: 404 });
       pkg.content.status = 'complete';
       pkg.markModified('content');
       await pkg.save();
       return NextResponse.json({ success: true });
    }

    if (action === 'deletePackage') {
        if (!packageId) {
            return NextResponse.json({ message: 'Package ID required for deletion' }, { status: 400 });
        }
        await IELTSContent.findByIdAndDelete(packageId);
        return NextResponse.json({ success: true, message: 'Package deleted successfully' });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Examiner generation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
