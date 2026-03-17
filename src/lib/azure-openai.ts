import { AzureOpenAI } from "openai";

// Pastikan variabel ini diatur di Azure Portal -> Static Web App -> Configuration
const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "https://ielts-app.openai.azure.com/";
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini";

export const deploymentName = deployment;

const client = new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion: "2024-05-01-preview",
  deployment, // Ini akan digunakan sebagai default
});

export default client;
