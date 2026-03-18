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
export const DEPLOYMENT_MISTRAL = process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MISTRAL || "mistral-large-latest";
export const DEPLOYMENT_PHI = process.env.AZURE_OPENAI_DEPLOYMENT_NAME_PHI || "phi-4-mini-instruct";

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
    apiVersion: "2024-02-01",
    deployment: DEPLOYMENT_MINI,
  });

  return global.azureClient;
};

export default getClient;
