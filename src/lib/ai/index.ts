import "server-only";

export {
  getOpenAIApiKey,
  getOpenAIClient,
  hasOpenAIConfiguration,
} from "@/lib/ai/openai";
export {
  estimateParcelForDispatch,
  estimateParcelWithAI,
  type AIParcelEstimatorInput,
  type AIParcelEstimatorOutput,
  type AIParcelEstimatorResult,
} from "@/lib/ai/parcel-estimator";
