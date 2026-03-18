import { NextResponse } from 'next/server';
import getClient, { DEPLOYMENT_MINI, DEPLOYMENT_HIGH, DEPLOYMENT_MISTRAL, DEPLOYMENT_PHI } from '@/lib/azure-openai';
import dbConnect from '@/lib/mongodb';
import IELTSContent from '@/models/IELTSContent';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();
    const client = getClient();
    // Return all fields including content, but without sorting to avoid indexing issues in Cosmos DB
    const packages = await IELTSContent.find({ module: 'Examiner' });
    return NextResponse.json({ success: true, packages });
  } catch (error: any) {
    console.error('GET Examiner packages error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Renamed and modified to generate only the structure
const getModuleStructurePrompt = (moduleName: string, testType: string, difficulty: string, personaContext?: string) => {
  const difficultyContext = 
    difficulty === 'Easy' ? 'Target Band 5.0-6.0: Simpler vocabulary, clear articulation, slower pace, and more direct answers.' :
    difficulty === 'Hard' ? 'Target Band 8.0-9.0: Complex academic vocabulary, idiomatic expressions, faster pace with more distractors, and nuanced arguments.' :
    'Target Band 6.5-7.5: Standard IELTS difficulty with a mix of direct and indirect information, and some complex sentence structures.';

  const personaInstruction = personaContext ? `PERSONA CONTEXT: ${personaContext} (Incorporate user interests into the topics and themes of the test sections where appropriate).` : '';

  switch (moduleName.toLowerCase()) {
    case 'listening':
      return `You are a professional IELTS Listening content creator. Generate the STRUCTURE for a complete IELTS Listening test.
      Difficulty Context: ${difficultyContext}
      ${personaInstruction}
      
      Describe 4 sections that strictly follow the official IELTS format:
      - Section 1: A conversation between two people set in an everyday social context (e.g., booking a hotel, inquiring about a course).
      - Section 2: A monologue set in an everyday social context (e.g., a speech about local facilities, a radio talk about a museum).
      - Section 3: A conversation between up to four people set in an educational or training context (e.g., a university tutor and a student discussing an assignment).
      - Section 4: A monologue on an academic subject (e.g., a university lecture on a specific scientific or historical topic).
      
      Each section MUST have 10 questions.
      Types should vary among: Form completion, Note completion, Table completion, Flow-chart completion, Summary completion, Plan/map/diagram labelling, Matching, Multiple choice, Sentence completion, Short-answer questions.
      
      OUTPUT JSON: { "sections": [{ "title": "...", "type": "...", "questionCount": 10, "contextDescription": "..." }] }`;

    case 'reading':
      if (testType === 'Academic') {
        return `You are a professional IELTS Reading content creator for the ACADEMIC module. Generate the STRUCTURE for an IELTS Reading test.
        Difficulty Context: ${difficultyContext}
        ${personaInstruction}
        
        Describe 3 passages:
        - Passage 1: Descriptive and factual topic.
        - Passage 2: Discursive and analytical topic.
        - Passage 3: Complex argument or academic discussion.
        
        Question count should be: Passage 1 (13), Passage 2 (13), Passage 3 (14) for a total of 40.
        Question types include: Multiple choice, Identifying information (True/False/Not Given), Identifying writer's views (Yes/No/Not Given), Matching information, Matching headings, Matching features, Matching sentence endings, Sentence completion, Summary completion, Note/table/flow-chart completion, Diagram label completion, Short-answer questions.
        
        OUTPUT JSON: { "passages": [{ "title": "...", "topic": "...", "questionCount": ..., "type": "Academic" }] }`;
      } else {
        return `You are a professional IELTS Reading content creator for the GENERAL TRAINING module. Generate the STRUCTURE for an IELTS Reading test.
        Difficulty Context: ${difficultyContext}
        ${personaInstruction}
        
        Describe 3 sections:
        - Section 1: Two or three short factual texts (everyday life topics).
        - Section 2: Two short factual texts focusing on work-related issues.
        - Section 3: One longer, more complex text on a topic of general interest.
        
        Question count: Section 1 (14), Section 2 (13), Section 3 (13) for a total of 40.
        
        OUTPUT JSON: { "passages": [{ "title": "...", "topic": "...", "questionCount": ..., "type": "General Training" }] }`;
      }

    case 'writing':
      const task1Desc = testType === 'Academic' 
        ? 'Task 1: Describe visual information (graph, chart, table, or diagram) in at least 150 words.' 
        : 'Task 1: Write a letter (formal, semi-formal, or informal) in response to a given situation in at least 150 words.';
      
      return `You are a professional IELTS Writing content creator. Generate the STRUCTURE for an IELTS ${testType} Writing test.
      Difficulty Context: ${difficultyContext}
      ${personaInstruction}
      
      Include Task 1 and Task 2:
      - ${task1Desc}
      - Task 2: Write an essay in response to a point of view, argument, or problem in at least 250 words.
      
      Describe the type of Task 1 (e.g., Line Graph, Formal Letter) and Task 2 (e.g., Opinion Essay, Discussion Essay).
      
      OUTPUT JSON: { "task1": { "type": "...", "wordCount": 150 }, "task2": { "type": "...", "wordCount": 250 } }`;

    case 'speaking':
      return `You are a professional IELTS Speaking content creator. Generate the STRUCTURE for an IELTS Speaking test.
      Difficulty Context: ${difficultyContext}
      ${personaInstruction}
      
      Describe 3 parts:
      - Part 1: Introduction and interview (4-5 minutes) on familiar topics like home, family, work, studies, and interests.
      - Part 2: Individual long turn (3-4 minutes). Use a cue card to talk about a particular topic.
      - Part 3: Two-way discussion (4-5 minutes) linked to the topic in Part 2, but more abstract and in-depth.
      
      OUTPUT JSON: { "part1": { "title": "Introduction & Interview", "focus": "..." }, "part2": { "title": "Long Turn (Cue Card)", "focus": "..." }, "part3": { "title": "Discussion", "focus": "..." } }`;
    default:
      return '';
  }
};

const getQuestionPrompt = (moduleName: string, testType: string, difficulty: string, currentContent: any, questionDetails: any, personaContext?: string) => {
  const { sectionIndex, questionIndex, passageTitle, taskType, partNumber } = questionDetails;
  
  const difficultyContext = 
    difficulty === 'Easy' ? 'Target Band 5.0-6.0: Simpler vocabulary, clear articulation, slower pace, and more direct answers.' :
    difficulty === 'Hard' ? 'Target Band 8.0-9.0: Complex academic vocabulary, idiomatic expressions, faster pace with more distractors, and nuanced arguments.' :
    'Target Band 6.5-7.5: Standard IELTS difficulty with a mix of direct and indirect information, and some complex sentence structures.';

  const personaInstruction = personaContext ? `PERSONA CONTEXT: ${personaContext} (Try to make the content feel relevant to the user's background).` : '';

  switch (moduleName.toLowerCase()) {
    case 'listening':
        const section = currentContent.listening.structure.sections[sectionIndex];
        return `You are an IELTS Listening examiner. Generate ONE high-quality IELTS question for Section ${sectionIndex + 1}.
        Context: ${section.contextDescription}
        Section Title: "${section.title}"
        Question Type: "${section.type}"
        Question Number: ${questionIndex}
        Difficulty: ${difficulty} (${difficultyContext})
        
        Requirements:
        1. The question must be authentic to the IELTS format.
        2. If it's Multiple Choice, provide 3 plausible options.
        3. If it's Completion (Form/Sentence/Note), ensure the answer is concise (usually 1-3 words).
        
        OUTPUT JSON: { "question": { "id": ${questionIndex}, "text": "...", "options": ["...", "..."], "correct": "..." }, "answerKey": { "${questionIndex}": "..." } }`;

    case 'reading':
        const passage = currentContent.reading.structure.passages[sectionIndex];
        return `You are an IELTS Reading examiner. Generate ONE high-quality IELTS question for Passage ${sectionIndex + 1}.
        Passage Title: "${passage.title}"
        Passage Topic: "${passage.topic}"
        Question Number: ${questionIndex}
        Difficulty: ${difficulty} (${difficultyContext})
        
        Requirements:
        1. The question must be based on the provided Passage Text (if available) or be a generic high-quality placeholder if the full passage isn't yet generated.
        2. Strictly follow IELTS question types (e.g., True/False/Not Given, Matching Headings).
        
        Passage Text context: "${passageTitle}"
        
        OUTPUT JSON: { "question": { "id": ${questionIndex}, "text": "...", "options": ["...", "..."], "correct": "..." }, "answerKey": { "${questionIndex}": "..." } }`;

    case 'writing':
        if (taskType === 'task1') {
            const task1Type = currentContent.writing.structure.task1.type;
            return `You are an IELTS Writing examiner. Generate a professional IELTS ${testType} Writing Task 1 prompt.
            Type: ${task1Type}
            Difficulty: ${difficulty} (${difficultyContext})
            
            Requirements:
            1. For Academic: Describe a specific graph/chart/table/diagram with data points.
            2. For General Training: Write a letter with a specific situation and 3 bullet points to address.
            3. Provide a high-scoring sample answer (Band 8.0-9.0).
            
            OUTPUT JSON: { "prompt": "...", "sampleAnswer": "..." }`;
        } else if (taskType === 'task2') {
            const task2Type = currentContent.writing.structure.task2.type;
            return `You are an IELTS Writing examiner. Generate a professional IELTS Writing Task 2 essay prompt.
            Type: ${task2Type}
            Difficulty: ${difficulty} (${difficultyContext})
            
            Requirements:
            1. The prompt must be a typical IELTS Task 2 question (e.g., "To what extent do you agree or disagree?", "Discuss both views and give your opinion").
            2. It should cover a common IELTS topic (Education, Environment, Technology, etc.).
            3. Provide a high-scoring sample answer (Band 8.0-9.0).
            
            OUTPUT JSON: { "prompt": "...", "sampleAnswer": "..." }`;
        }
        return '';

    case 'speaking':
        if (partNumber === 1) {
            return `You are an IELTS Speaking examiner. Generate ONE professional IELTS Speaking Part 1 question.
            Focus: ${currentContent.speaking.structure.part1.focus}
            Difficulty: ${difficulty} (${difficultyContext})
            
            Requirements:
            1. Question should be direct and about personal interests or everyday life.
            2. Provide a natural, Band 8.0-9.0 sample answer.
            
            OUTPUT JSON: { "question": { "id": ${questionIndex}, "text": "..." }, "sampleAnswer": "..." }`;
        } else if (partNumber === 2) {
            return `You are an IELTS Speaking examiner. Generate a professional IELTS Speaking Part 2 Cue Card.
            Focus: ${currentContent.speaking.structure.part2.focus}
            Difficulty: ${difficulty} (${difficultyContext})
            
            Requirements:
            1. Include "Describe...", "You should say:", and 3-4 bullet points.
            2. Provide a high-quality sample monologue (Band 8.0-9.0).
            
            OUTPUT JSON: { "topic": "...", "bullets": ["...", "...", "..."], "sampleAnswer": "..." }`;
        } else if (partNumber === 3) {
            return `You are an IELTS Speaking examiner. Generate ONE professional IELTS Speaking Part 3 question.
            Focus: ${currentContent.speaking.structure.part3.focus}
            Difficulty: ${difficulty} (${difficultyContext})
            
            Requirements:
            1. The question should be abstract and related to the Part 2 topic.
            2. It should require an analytical or discursive answer.
            3. Provide a Band 8.0-9.0 sample answer.
            
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
    const client = getClient();

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
        model: DEPLOYMENT_PHI, // Phi-4 is hyper-efficient for JSON structure generation
        messages: [{ role: "system", content: systemPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.1, // Lower temperature for structure consistency
        max_tokens: 1000
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
      
      // OPTIMAL MULTI-MODEL ORCHESTRATION STRATEGY
      let targetModel = DEPLOYMENT_MINI;
      const moduleKey = moduleName.toLowerCase();

      if (moduleKey === 'writing' || (moduleKey === 'speaking' && questionDetails.partNumber === 2)) {
        // Complex academic writing and cue card storytelling require GPT-4o (High)
        targetModel = DEPLOYMENT_HIGH;
      } else if (moduleKey === 'reading' || moduleKey === 'listening') {
        // Mistral Large is world-class at long-form coherence and academic passages
        targetModel = DEPLOYMENT_MISTRAL;
      } else if (moduleKey === 'speaking' && (questionDetails.partNumber === 1 || questionDetails.partNumber === 3)) {
        // Phi-4 is excellent for short, direct conversational prompts
        targetModel = DEPLOYMENT_PHI;
      }

      const response = await client.chat.completions.create({
        model: targetModel,
        messages: [{ role: "system", content: systemPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: targetModel === DEPLOYMENT_PHI ? 1000 : 2500
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
