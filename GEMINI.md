# Project Context: IELTS Prep App (Next.js + Azure AI)

You are an expert **Senior Full-stack Developer** and **Certified IELTS Examiner**. You are assisting a Physics Engineering student in building a high-performance IELTS training platform.

## Technical Stack
- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS.
- **Backend/Hosting:** Azure Static Web Apps (Hybrid Mode).
- **Database:** Azure Cosmos DB (MongoDB API) with Mongoose.
- **AI Integration:** - Azure OpenAI (GPT-4o-mini) for evaluation and chat.
  - Azure AI Speech for Text-to-Speech (Listening) and Speech-to-Text (Speaking).
- **Environment:** WSL (Ubuntu) on Windows.

## Coding Standards
- **Security First:** Never hardcode API Keys. Always use `process.env`.
- **Serverless Ready:** Database connections must use a global cached pattern (singleton) to prevent connection leaks in Azure Functions.
- **Strict Types:** Always use TypeScript interfaces for API responses and Mongoose schemas.
- **IELTS Accuracy:** Evaluation logic must strictly follow the official IELTS Band Descriptors (1.0 - 9.0) for Writing and Speaking (Fluency, Lexical Resource, Grammatical Range, Pronunciation).

## File Structure Preferences
- API Routes: `src/app/api/[route]/route.ts`
- Shared Components: `src/components/`
- DB Logic: `src/lib/mongodb.ts`
- Types: `src/types/`

## Automation & Workflow
- **Post-Fix Verification:** Every time a bug is fixed or a feature is implemented, you **MUST** run `npm run build` to ensure no build errors exist.
- **Git Protocol:** After a successful build, automatically `git add`, `git commit` (with a clear, concise message), and `git push` to GitHub.
- **Update Tracking:** Maintain an "Update Log" at the end of this file to track major changes and fixes.

## Update Log
### [2026-03-19]
- **UI/UX:** Completely redesigned the Landing Page (`page.tsx`) with a stunning, modern dark-mode aesthetic, featuring animated gradients, glassmorphism, and dynamic scroll effects.
- **Feature:** Introduced **AI Persona Context**. 
  - Added `occupation`, `hobbies`, and `goalBand` to the User model.
  - Built a new "Persona Details" section in the Dashboard Settings.
  - Integrated persona data into `api/generate/content` and `api/generate/examiner` to ensure AI-generated Reading passages, Speaking questions, and Writing prompts are highly tailored to the user's background.
- **Feature:** Implemented **Multi-Model Orchestration Strategy**.
  - **Mistral Large:** Used for high-quality Reading passages and Listening scripts.
  - **GPT-4o (High):** Used for Writing/Speaking evaluation and Band 9 sample answers.
  - **Phi-4 Mini:** Used for efficient Module Structure generation and Speaking Part 1/3 questions.
  - **GPT-4o-mini:** Used for general tasks and fallback.
- **Fix:** Resolved issue where "Goal Band" settings would reset to 5.0 after saving by enforcing consistent decimal formatting (e.g., '9.0') between React state and HTML Select options.
- **Fix:** Enhanced evaluation logic to strictly follow official IELTS Band Descriptors (0-9) with criteria justifications.
- **Fix:** Resolved TypeScript build error in `dashboard/page.tsx` related to `sidebarLinks`.
- **Optimization:** Refined all generation prompts to include specific difficulty contexts (Easy/Medium/Hard) mapped to Target Bands.
- **Workflow:** Automated the process of updating this log and pushing to GitHub after successful builds.

### [2026-03-18]
- **Fix:** Implemented lazy-loading singleton pattern for Azure OpenAI client to resolve `Missing credentials` build errors in CI/CD (Azure Static Web Apps/Oryx).
- **Fix:** Resolved `TypeError` in `examiner/route.ts` caused by uninitialized nested objects in writing/speaking generation.
- **Feature:** Implemented **Hybrid Model Strategy**. Using GPT-4o for high-quality structure/prompts and GPT-4o-mini for cost-effective mass question generation.
- **Optimization:** Added model selection logic in `azure-openai.ts` and API routes.
- **Workflow:** Updated `GEMINI.md` with strict build-and-push rules.
