import OpenAI from "openai";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini";

// Create the Azure OpenAI client
const client = new OpenAI({
  apiKey: apiKey,
  baseURL: `${endpoint}/openai/deployments/${deploymentName}`,
  defaultQuery: { "api-version": "2024-02-01" },
  defaultHeaders: { "api-key": apiKey },
});

export default client;
