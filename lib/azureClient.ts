// lib/azureClient.ts
import { AzureOpenAI } from "openai";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const apiVersion = process.env.OPENAI_API_VERSION;

if (!endpoint || !apiKey || !deployment) {
  console.error("❌ Missing Azure OpenAI Environment Variables");
  throw new Error(
    "Azure OpenAI environment variables are configured incorrectly."
  );
}

export const azureClient = new AzureOpenAI({
  endpoint,
  apiKey,
  deployment,
  apiVersion,
});

export function getModelName(): string {
  return deployment as string;
}
