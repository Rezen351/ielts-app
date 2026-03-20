// Professional IELTS Examiner Prompt Library (v2.0)
// Optimized for GPT-4o with clear instructions to ensure content is generated.

export const getModuleStructurePrompt = (moduleName: string) => {
  const baseRules = "You are an expert IELTS Examiner. Generate a professional test structure. OUTPUT ONLY JSON: ";
  
  if (moduleName.toLowerCase() === 'listening') {
    return `${baseRules} { "sections": [
      { "title": "Social Context Conversation", "questionCount": 10, "contextDescription": "A conversation between two people set in an everyday social context." },
      { "title": "Social Context Monologue", "questionCount": 10, "contextDescription": "A monologue set in an everyday social context." },
      { "title": "Educational Context Conversation", "questionCount": 10, "contextDescription": "A conversation between up to four people set in an educational or training context." },
      { "title": "Academic Monologue", "questionCount": 10, "contextDescription": "A monologue on an academic subject." }
    ] }`;
  }
  if (moduleName.toLowerCase() === 'reading') {
    return `${baseRules} { "passages": [
      { "title": "Passage 1", "topic": "General Academic Topic", "questionCount": 13 },
      { "title": "Passage 2", "topic": "Scientific or Social Research", "questionCount": 13 },
      { "title": "Passage 3", "topic": "Complex Argumentative Topic", "questionCount": 14 }
    ] }`;
  }
  if (moduleName.toLowerCase() === 'writing') {
    return `${baseRules} { "task1": { "type": "Data Interpretation (Graph/Chart/Table)" }, "task2": { "type": "Argumentative Essay" } }`;
  }
  if (moduleName.toLowerCase() === 'speaking') {
    return `${baseRules} { "part1": { "focus": "Introduction & Interview" }, "part2": { "focus": "Individual Long Turn (Cue Card)" }, "part3": { "focus": "Two-Way Discussion" } }`;
  }
  return "";
};

export const getSectionPrompt = (module: string, type: string, diff: string, content: any, details: any) => {
  const { sectionIndex } = details;
  const target = diff === 'Hard' ? 'Band 8-9' : diff === 'Easy' ? 'Band 5-6' : 'Band 7';
  
  const commonInstructions = `
    - Difficulty Level: ${target}.
    - You MUST generate a FULL set of questions as per IELTS standards. 
    - Every question MUST have a "type" (multiple_choice, gap_fill, matching, true_false_not_given, short_answer).
    - If "type" is "multiple_choice" or "matching", the "options" array MUST NOT be empty.
    - If "type" is "gap_fill", you MUST include exactly "__________" (10 underscores) inside the "question" string where the answer should be placed. Failure to include "__________" will result in a validation error.
    - Example gap_fill: "The lecture will take place in the __________ hall."
    - The "answerKey" MUST map the question ID to the correct answer string exactly.
    - OUTPUT ONLY VALID JSON.
  `;

  if (module.toLowerCase() === 'listening') {
    return `Generate IELTS Listening Section ${sectionIndex + 1}. 
    ${commonInstructions} 
    Required JSON Structure:
    { 
      "script": "Full audio script with speakers names...", 
      "questions": [
        { 
          "id": 1, 
          "type": "multiple_choice", 
          "question": "The main reason for the meeting is...", 
          "options": ["A. To discuss sales", "B. To hire new staff", "C. To plan the party", "D. To review the budget"] 
        },
        { 
          "id": 2, 
          "type": "gap_fill", 
          "question": "Wave power is considered a __________ frontier in renewable energy.", 
          "options": [] 
        }
      ], 
      "answerKey": { "1": "B", "2": "new" } 
    }
    (Generate a total of 10 questions for this section).`;
  }
  if (module.toLowerCase() === 'reading') {
    const topic = content?.reading?.structure?.passages?.[sectionIndex]?.topic || "Academic";
    return `Generate IELTS Reading Passage ${sectionIndex + 1} about ${topic}. 
    ${commonInstructions} 
    Required JSON Structure:
    { 
      "text": "Full long-form academic article (800-1000 words)...", 
      "questions": [
        { 
          "id": 1, 
          "type": "true_false_not_given", 
          "question": "The study was conducted in 2020.", 
          "options": ["True", "False", "Not Given"] 
        },
        { 
          "id": 2, 
          "type": "short_answer", 
          "question": "What is the primary gas released?", 
          "options": [] 
        }
      ], 
      "answerKey": { "1": "True", "2": "Carbon Dioxide" } 
    }`;
  }
  if (module.toLowerCase() === 'writing') {
    return `Generate IELTS Writing ${details.taskType}. Module: ${type}. 
    ${commonInstructions} 
    Required JSON Structure:
    { 
      "prompt": "The question prompt and instructions...", 
      "sampleAnswer": "A high-quality Band 9 sample answer..." 
    }`;
  }
  if (module.toLowerCase() === 'speaking') {
    const sectionTitle = sectionIndex === 0 ? "Part 1: Introduction & Interview" : sectionIndex === 1 ? "Part 2: Individual Long Turn (Cue Card)" : "Part 3: Two-Way Discussion";
    
    let structure = sectionIndex === 1 
      ? `{ "topic": "Describe a place you visited...", "bullets": ["Where it is", "When you went there", "What you did there"], "sampleAnswer": "..." }`
      : `{ "topic": "General Topic", "questions": ["Question 1", "Question 2", "Question 3"], "sampleAnswer": "..." }`;

    return `Generate IELTS Speaking ${sectionTitle}. 
    ${commonInstructions} 
    Required JSON Structure:
    ${structure}`;
  }
  return "";
};

export const getQuestionPrompt = (mod: string, type: string, diff: string, content: any, details: any) => {
  return `Generate single professional IELTS question for ${mod} Section ${details.sectionIndex + 1}. Difficulty: ${diff}. 
  Ensure the question is complete with type, options (if multiple choice), and clear answer.
  OUTPUT ONLY JSON: { "id": 1, "type": "...", "question": "...", "options": [], "answer": "..." }`;
};

