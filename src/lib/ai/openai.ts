import "server-only";
import OpenAI from "openai";

let openAIClient: OpenAI | null = null;

export function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  return apiKey && apiKey.length > 0 ? apiKey : null;
}

export function hasOpenAIConfiguration() {
  return Boolean(getOpenAIApiKey());
}

export function getOpenAIClient() {
  const apiKey = getOpenAIApiKey();

  if (!apiKey) {
    throw new Error("[openai] Missing server-only OPENAI_API_KEY.");
  }

  openAIClient ??= new OpenAI({ apiKey });

  return openAIClient;
}
