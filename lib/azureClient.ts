// lib/azureClient.ts
import { AzureOpenAI } from "openai";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const apiVersion = process.env.OPENAI_API_VERSION;



export const azureClient = new AzureOpenAI({
  endpoint,
  apiKey,
  deployment,
  apiVersion,
});

export function getModelName(): string {
  return deployment as string;
}
