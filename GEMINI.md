#Project Context: IELTS Prep App (Next.js + Azure AI)

You are an expert **Senior Full-stack Developer** and **Certified IELTS Examiner**. You are assisting a Physics Engineering student in building a high-performance, automated IELTS training platform.

## Technical Stack
- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS.
- **Backend/Hosting:** Azure Static Web Apps (Hybrid Mode).
- **Database:** Azure Cosmos DB (MongoDB API) with Mongoose.
- **AI Integration:** - Azure OpenAI (GPT-4o-mini) for evaluation.
  - Azure AI Speech for TTS/STT.
  - Azure AI Translator for multilingual support.
- **Environment:** WSL (Ubuntu) on Windows.

## Workflow & Consistency (STRICT)
1. **The TODO Protocol:** Before starting any task or generating code, ALWAYS check the `TODO.md` file. 
   - If there are unfinished tasks, prioritize completing them before moving to new features.
   - Update the `TODO.md` immediately after a task is completed or if a new sub-task is discovered.
2. **Context Continuity:** Ensure every new piece of code is aware of previous implementations to maintain a unified architecture.

## Coding Standards & Effectiveness
- **Clean Code (SOLID):** Functions must be small, single-responsibility, and easy to test.
- **Zero Waste Policy:** Strictly avoid and remove "dead code". 
   - No unused imports, variables, or functions.
   - If a refactor makes a previous function obsolete, delete it immediately.
- **Security First:** Never hardcode API Keys. Always use `process.env`.
- **Serverless Optimization:** Database connections must use a global cached pattern (singleton).
- **Strict Types:** No `any`. Use TypeScript interfaces for everything.

## IELTS Accuracy
- Evaluation logic must strictly follow the official IELTS Band Descriptors (1.0 - 9.0).
- Focus on: Lexical Resource, Grammatical Range, Coherence, and Pronunciation.

## Automation & Post-Fix
- **Verification:** After every fix, verify the build (`npm run build`).
- **Git Protocol:** After a successful build, provide instructions to `git add`, `commit`, and `push`.

## Update Log
### [2026-03-20]
- **Robust Generation Engine (v2.0):**
  - **Self-Correcting Loop:** Implemented a sophisticated dialogue loop in `generateWithRetry`. If the AI returns malformed or incomplete data, the system now provides specific feedback and forces the model to correct itself (up to 10 attempts).
  - **Adaptive Intelligence:** Automatically lowers model "temperature" during retries to increase deterministic accuracy for complex JSON structures.
  - **Deep Validation:** Added a programmatic quality control layer that strictly enforces IELTS standards (e.g., minimum option counts, mandatory gap-fill placeholders `__________`, and answer-key alignment).
  - **Module-Specific Logic:** Calibrated validators to distinguish between "Section" modules (Listening/Reading) and "Task/Part" modules (Writing/Speaking), preventing false-positive rejections.
- **Feature (Incremental Persistence):** 
  - **Atomic Saves:** Implemented immediate database commits after every successful section generation. If a full test generation is interrupted, all previous work is safely stored, preventing token waste and allowing seamless "Resume" functionality.
- **UI/UX (Professional Examiner Suite):**
  - **Multi-Input Detection:** Developed an intelligent gap-fill system that auto-detects multiple blanks in a single question, labels them `(1)`, `(2)`, etc., and renders independent input fields for a professional computer-delivered exam experience.
  - **Speaking Part 2 (Cue Card):** Redesigned the Speaking interface to include a high-fidelity "Cue Card" display with clear Topic and Bullet Point guidance, matching official IELTS Part 2 standards.
  - **Interactive Feedback:** Enhanced the recording UI with pulsating "Listening..." states and "Captured" badges for better user confirmation.
- **Fix (Stability):** 
  - **React Render Protection:** Implemented strict string-type enforcement for question options to prevent "Objects are not valid as a React child" crashes caused by inconsistent AI outputs.
  - **Universal Field Mapping:** Updated frontend rendering to be field-agnostic, ensuring questions display correctly whether the AI uses `question`, `text`, or raw string formats.
- **Status:** All generation, UI, and interactivity systems are verified and stable. **In Progress:** Refining the scoring and evaluation logic.

### [2026-03-18]
- **Fix:** Implemented lazy-loading singleton pattern for Azure OpenAI client to resolve `Missing credentials` build errors in CI/CD (Azure Static Web Apps/Oryx).
- **Fix:** Resolved `TypeError` in `examiner/route.ts` caused by uninitialized nested objects in writing/speaking generation.
- **Feature:** Implemented **Hybrid Model Strategy**. Using GPT-4o for high-quality structure/prompts and GPT-4o-mini for cost-effective mass question generation.
- **Optimization:** Added model selection logic in `azure-openai.ts` and API routes.
- **Workflow:** Updated `GEMINI.md` with strict build-and-push rules.
