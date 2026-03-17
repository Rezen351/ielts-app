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
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini";

export const deploymentName = deployment;

console.log(`[Azure OpenAI] Base Endpoint: ${endpoint}`);
console.log(`[Azure OpenAI] Deployment: ${deployment}`);

const client = new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion: "2024-02-01",
  deployment,
});

export default client;
