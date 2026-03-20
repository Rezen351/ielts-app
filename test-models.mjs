
import { AzureOpenAI } from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env.local from current directory
dotenv.config({ path: ".env.local" });

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = "2025-01-01-preview";

const deployments = [
  { name: "MINI", id: process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MINI || "gpt-4o-mini" },
  { name: "HIGH", id: process.env.AZURE_OPENAI_DEPLOYMENT_NAME_HIGH || "gpt-4o" },
  { name: "MISTRAL", id: process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MISTRAL || "Mistral-Large-3" },
  { name: "PHI", id: process.env.AZURE_OPENAI_DEPLOYMENT_NAME_PHI || "Phi-4-mini-instruct" }
];

if (!endpoint || !apiKey) {
  console.error("Error: AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY is missing.");
  process.exit(1);
}

const client = new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion,
  timeout: 30000, // 30 detik per tes
  maxRetries: 0
});

async function testModel(label, deploymentName) {
  console.log(`\n[Testing ${label}] Deployment: ${deploymentName}...`);
  try {
    const start = Date.now();
    const response = await client.chat.completions.create({
      model: deploymentName,
      messages: [{ role: "user", content: "Say 'Hello' in 1 word." }],
      max_tokens: 10
    });
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✅ Success! Response: "${response.choices[0].message.content.trim()}" (${duration}s)`);
  } catch (error) {
    console.error(`❌ Failed! Error: ${error.message}`);
    if (error.status) console.error(`   Status: ${error.status}`);
  }
}

async function runAllTests() {
  console.log(`Testing Azure OpenAI at: ${endpoint}`);
  console.log(`Using API Version: ${apiVersion}`);
  
  for (const dep of deployments) {
    await testModel(dep.name, dep.id);
  }
}

runAllTests();
