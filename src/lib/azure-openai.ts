import { AzureOpenAI } from "openai";

// Mencoba mengambil dari env, jika tidak ada gunakan default untuk deteksi
const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "") || "https://ielts-app.openai.azure.com";
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini";

export const deploymentName = deployment;

console.log(`[Azure OpenAI] Using Endpoint: ${endpoint}`);
console.log(`[Azure OpenAI] Using Deployment: ${deployment}`);

const client = new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion: "2024-02-01",
  deployment,
});

export default client;
