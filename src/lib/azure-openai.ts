import { AzureOpenAI } from "openai";

/**
 * Membersihkan endpoint agar hanya berupa base URL (misal: https://name.openai.azure.com)
 * Jika user memasukkan URL lengkap dari Azure Portal, kita ambil bagian depannya saja.
 */
function cleanEndpoint(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url.replace(/\/$/, "");
  }
}

const rawEndpoint = process.env.AZURE_OPENAI_ENDPOINT || "https://ielts-app.openai.azure.com/";
const endpoint = cleanEndpoint(rawEndpoint);
const apiKey = process.env.AZURE_OPENAI_API_KEY;

// Deployment names from environment variables
export const DEPLOYMENT_MINI = process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MINI || "gpt-4o-mini";
export const DEPLOYMENT_HIGH = process.env.AZURE_OPENAI_DEPLOYMENT_NAME_HIGH || "gpt-4o";
export const DEPLOYMENT_MISTRAL = process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MISTRAL || "Mistral-Large-3";
export const DEPLOYMENT_PHI = process.env.AZURE_OPENAI_DEPLOYMENT_NAME_PHI || "Phi-4-mini-instruct";

// Backward compatibility
export const deploymentName = DEPLOYMENT_MINI;

declare global {
  // eslint-disable-next-line no-var
  var azureClient: AzureOpenAI | undefined;
}

/**
 * Lazy singleton client for Azure OpenAI
 */
const getClient = () => {
  if (global.azureClient) return global.azureClient;

  const rawEndpoint = process.env.AZURE_OPENAI_ENDPOINT || "https://ielts-app.openai.azure.com/";
  const endpoint = cleanEndpoint(rawEndpoint);
  const apiKey = process.env.AZURE_OPENAI_API_KEY;

  if (!apiKey && process.env.NODE_ENV === "production" && !process.env.BUILD_PHASE) {
    console.warn("[Azure OpenAI] WARNING: AZURE_OPENAI_API_KEY is missing at runtime.");
  }

  console.log(`[Azure OpenAI] Initializing client for ${endpoint}`);

  global.azureClient = new AzureOpenAI({
    endpoint,
    apiKey: apiKey || "BUILD_PLACEHOLDER", // Avoid constructor crash during build
    apiVersion: "2025-01-01-preview",
    timeout: 60000, // 60 detik timeout
    maxRetries: 2,  // Mencoba ulang 2 kali jika gagal
    // Remove the 'deployment' option from constructor to allow multi-model calls
  });

  return global.azureClient;
};

/**
 * Shared helper function for OpenAI call with self-correction loop
 */
export async function generateWithRetry(
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    maxRetries?: number;
    deployment?: string;
    validator?: (data: any) => { valid: boolean; reason?: string };
  } = {}
) {
  const {
    temperature = 0.7,
    maxTokens = 4000,
    maxRetries = 10,
    deployment = DEPLOYMENT_HIGH,
    validator
  } = options;

  const client = getClient();
  let lastError: any;
  let currentMessages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];
  let currentTemperature = temperature;

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[Azure OpenAI] Attempt ${i + 1}/${maxRetries} (Model: ${deployment}, Temp: ${currentTemperature.toFixed(2)})`);
      const response = await client.chat.completions.create({
        model: deployment,
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
          console.warn(`[Azure OpenAI] Validation failed on attempt ${i + 1}: ${validation.reason}`);
          
          currentMessages.push({ role: "assistant", content: content });
          currentMessages.push({ 
            role: "user", 
            content: `Your previous response was invalid: "${validation.reason}". Please fix and provide corrected JSON.` 
          });
          
          currentTemperature = Math.max(0.2, currentTemperature - 0.1);
          throw new Error(validation.reason);
        }
      }

      return data;
    } catch (error: any) {
      lastError = error;
      console.error(`[Azure OpenAI] Error on attempt ${i + 1}:`, error.message);
      if (i < maxRetries - 1) {
        const delay = 1000 * (i + 1);
        await new Promise(res => setTimeout(res, delay)); 
      }
    }
  }
  throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
}

export default getClient;
