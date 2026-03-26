# About IELTS Master ⚡

**IELTS Master** is a high-performance, AI-driven preparation ecosystem designed to help students achieve Band 8.5+ through personalized, adaptive, and technically rigorous training.

---

## 🚀 Core Pillars & Features

### 1. Adaptive Learning Roadmap
- **Diagnostic-First Approach:** New users start with a 5-minute AI-driven diagnostic assessment to identify baseline strengths and weaknesses.
- **Dynamic Pathing:** Based on the diagnostic result and the user's Goal Band, the system generates a custom sequence of topics (Grammar, Vocabulary, Writing, etc.).
- **Milestone Gatekeeper:** Before advancing to higher levels, users must pass a Mastery Quiz (80% threshold).
- **Remedial Deep Dives:** If a milestone is failed, the AI analyzes specific gaps and generates a "Remedial Module" to fix those weaknesses before allowing a retake.

### 2. AI-Curated Study Materials
- **Blog-Style Lessons:** Lessons are generated in a highly engaging, readable format with Markdown support (tables, lists, bold key terms).
- **Interactive Flashcards:** Digital flip-cards for terminology and idiomatic expressions.
- **Quick Checks:** Instant quizzes at the end of each lesson to verify immediate understanding.
- **Context-Aware AI Tutor:** A persistent chat widget that knows exactly which lesson or question you are currently looking at, providing instant, relevant assistance.

### 3. Professional Practice Hub
- **All-Module Coverage:** Dedicated interfaces for Listening, Reading, Writing, and Speaking.
- **Dynamic Content Generation:** AI generates fresh practice tests on-demand, ensuring users never run out of study material.
- **Intelligent Input Detection:** Support for complex question types like multiple-blank gap fills and Part 2 "Cue Cards" in Speaking.
- **History & Persistence:** All practice sessions are saved to Azure Cosmos DB, allowing users to revisit their performance and track progress over time.

### 4. Professional AI Examiner
- **Full-Length Simulations:** Mimics the official computer-delivered IELTS exam experience.
- **Band Scoring (1.0 - 9.0):** Powered by GPT-4o, providing accurate scoring based on official IELTS Band Descriptors.
- **Deep Linguistic Feedback:** Granular analysis of Lexical Resource (LR), Grammatical Range and Accuracy (GRA), Cohesion, and Pronunciation.
- **Standardized Corrections:** Feedback follows a `Current -> Better (Rule/Reason)` format for immediate learning.

### 5. Daily Engagement & Insights
- **English Vibe Check ⚡:** Daily AI-generated vocabulary and grammar tips.
- **Native Mode:** Provides idiomatic translations (e.g., natural Indonesian slang) instead of literal translations to make learning relatable.
- **Level-Up Logic:** Users can "refresh" their roadmap once a sequence is completed to tackle more advanced topics.

---

## 🛠 Technical Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, Sonner (Toasts).
- **Backend/Hosting:** Azure Static Web Apps (Hybrid Mode), Node.js.
- **Database:** Azure Cosmos DB (MongoDB API) with Mongoose.
- **AI Core:** 
  - **Azure OpenAI (GPT-4o / GPT-4o-mini):** For evaluation, generation, and tutoring.
  - **Azure AI Speech:** For high-fidelity TTS (Text-to-Speech) and STT (Speech-to-Text).
  - **Azure AI Translator:** For multilingual support and "Native Mode" insights.

---

## 🎓 IELTS Accuracy Standards
The application's evaluation logic is strictly calibrated against:
- Lexical Resource (LR)
- Grammatical Range and Accuracy (GRA)
- Coherence and Cohesion (CC)
- Task Response/Achievement (TR)
- Pronunciation and Fluency (for Speaking)

---

**IELTS Master** - *Shatter your limits. Achieve mastery.*
