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
### [2026-03-19]
- **Fix (Performance):** Resolved `Examiner` generation timeouts by migrating from per-question incremental generation to section-based bulk generation (10 questions at once for Listening/Reading). Drastically reduced Azure OpenAI API calls and Cosmos DB connection stress.
- **Optimization:** Adjusted `getSectionPrompt` in `api/generate/examiner/route.ts` and rendering logic in `dashboard/examiner/page.tsx` to fully support object-based section data formats.
- **Multi-Model Orchestration 2.0:** Implemented a high-efficiency model routing strategy for optimal cost/performance:
  - **Phi-4 (DEPLOYMENT_PHI):** Used for lightning-fast JSON structure generation and short Speaking Part 1/3 questions.
  - **Mistral Large (DEPLOYMENT_MISTRAL):** Leveraged for long-form academic coherence in Reading passages and Listening scripts.
  - **GPT-4o (DEPLOYMENT_HIGH):** Reserved for high-stakes evaluation, complex Writing tasks, and Band 9 sample answers.
  - **GPT-4o-mini (DEPLOYMENT_MINI):** Default general-purpose fallback.
- **Fix (Azure OpenAI):** Updated API version to `2024-12-01-preview` and decoupled the deployment from the client constructor to allow dynamic model switching (fixed "0 traffic" issue on GPT-4o).
- **Fix (Database):** Resolved `PoolClearedOnNetworkError` by increasing Cosmos DB connection timeouts (`socketTimeoutMS`: 120s, `serverSelectionTimeoutMS`: 20s) and adding `heartbeatFrequencyMS` for better stability during long LLM calls.
- **Fix (API):** Fixed a potential JSON parsing error in `api/evaluate/examiner` by ensuring `rawScore` is returned as a string (e.g., "32/40").
- **UI/UX:** Completely redesigned the Landing Page (`page.tsx`) with a stunning, modern dark-mode aesthetic.
- **Feature:** Introduced **AI Persona Context** for highly tailored test content.
- **Workflow:** Automated the process of updating this log and pushing to GitHub after successful builds.

### [2026-03-18]
- **Fix:** Implemented lazy-loading singleton pattern for Azure OpenAI client to resolve `Missing credentials` build errors in CI/CD (Azure Static Web Apps/Oryx).
- **Fix:** Resolved `TypeError` in `examiner/route.ts` caused by uninitialized nested objects in writing/speaking generation.
- **Feature:** Implemented **Hybrid Model Strategy**. Using GPT-4o for high-quality structure/prompts and GPT-4o-mini for cost-effective mass question generation.
- **Optimization:** Added model selection logic in `azure-openai.ts` and API routes.
- **Workflow:** Updated `GEMINI.md` with strict build-and-push rules.
