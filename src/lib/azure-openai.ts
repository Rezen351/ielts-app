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

// Backward compatibility
export const deploymentName = DEPLOYMENT_MINI;

console.log(`[Azure OpenAI] Base Endpoint: ${endpoint}`);
console.log(`[Azure OpenAI] Mini Deployment: ${DEPLOYMENT_MINI}`);
console.log(`[Azure OpenAI] High Deployment: ${DEPLOYMENT_HIGH}`);

const client = new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion: "2024-02-01",
  deployment: DEPLOYMENT_MINI, // Default deployment
});

export default client;
