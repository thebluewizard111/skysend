import "server-only";
import { parcelPackagingLabels } from "@/constants/parcel-assistant";
import { getParcelAssistantMockResult } from "@/lib/parcel-assistant";
import { getOpenAIClient, hasOpenAIConfiguration } from "@/lib/ai/openai";
import type { DroneClass } from "@/types/domain";
import type {
  ParcelAssistantInput,
  ParcelFragileLevel,
  ParcelPackagingType,
  ParcelSizeOption,
} from "@/types/parcel-assistant";
import type {
  ParcelEstimatorRequest,
  ParcelEstimatorResponse,
} from "@/types/parcel-estimator";

export type AIParcelEstimatorInput = {
  contentDescription: string;
  packaging: ParcelPackagingType;
  approximateSize: ParcelSizeOption;
};

export type AIParcelEstimatorOutput = {
  detectedItems: string[];
  packaging: {
    type: ParcelPackagingType;
    label: string;
    notes: string;
  };
  materials: string[];
  fragileLevel: ParcelFragileLevel;
  confidence: number;
  notes: string[];
};

export type AIParcelEstimatorResult =
  | {
      status: "ok";
      source: "openai";
      estimate: AIParcelEstimatorOutput;
    }
  | {
      status: "fallback";
      source: "local";
      estimate: AIParcelEstimatorOutput;
      error: {
        code: "missing_api_key" | "openai_error" | "invalid_response";
        message: string;
      };
    };

type AIParcelEstimatorFallbackCode =
  Extract<AIParcelEstimatorResult, { status: "fallback" }>["error"]["code"];

const parcelEstimatorModel = "gpt-5-mini";

const parcelEstimatorSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    detectedItems: {
      type: "array",
      items: { type: "string" },
      description: "Short item names inferred from the parcel description.",
    },
    packaging: {
      type: "object",
      additionalProperties: false,
      properties: {
        type: {
          type: "string",
          enum: [
            "soft_pouch",
            "boxed",
            "insulated",
            "fragile_protective",
            "heavy_duty",
          ],
        },
        label: { type: "string" },
        notes: { type: "string" },
      },
      required: ["type", "label", "notes"],
    },
    materials: {
      type: "array",
      items: { type: "string" },
      description: "Likely material categories such as glass, paper, plastic, textile, metal, electronics or food-safe packaging.",
    },
    fragileLevel: {
      type: "string",
      enum: ["low", "moderate", "high"],
    },
    confidence: {
      type: "number",
      description: "Confidence score from 0 to 1.",
    },
    notes: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "detectedItems",
    "packaging",
    "materials",
    "fragileLevel",
    "confidence",
    "notes",
  ],
} as const;

function toParcelAssistantInput(input: AIParcelEstimatorInput): ParcelAssistantInput {
  return {
    contents: input.contentDescription,
    packaging: input.packaging,
    approximateSize: input.approximateSize,
  };
}

function splitDetectedItems(contentDescription: string) {
  return contentDescription
    .split(/,| and | with | plus |\/|&/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
    .slice(0, 6);
}

function inferMaterials(contentDescription: string, packaging: ParcelPackagingType) {
  const normalized = contentDescription.toLowerCase();
  const materials = new Set<string>();

  if (/glass|vial|bottle|ceramic/.test(normalized)) {
    materials.add("glass or ceramic");
  }

  if (/document|paper|book|letter|file/.test(normalized)) {
    materials.add("paper");
  }

  if (/electronic|device|phone|tablet|camera|screen|battery/.test(normalized)) {
    materials.add("electronics");
  }

  if (/food|meal|pastry|cake|pharmacy|medicine|sample/.test(normalized)) {
    materials.add("temperature-sensitive goods");
  }

  if (/metal|tool|hardware|parts/.test(normalized)) {
    materials.add("metal");
  }

  if (packaging === "soft_pouch") {
    materials.add("flexible packaging");
  } else if (packaging === "insulated") {
    materials.add("insulated packaging");
  } else if (packaging === "fragile_protective") {
    materials.add("protective cushioning");
  } else if (packaging === "heavy_duty") {
    materials.add("reinforced packaging");
  } else {
    materials.add("cardboard or standard box");
  }

  return [...materials].slice(0, 6);
}

function createLocalFallbackEstimate(input: AIParcelEstimatorInput): AIParcelEstimatorOutput {
  const localEstimate = getParcelAssistantMockResult(toParcelAssistantInput(input));
  const detectedItems = splitDetectedItems(input.contentDescription);

  return {
    detectedItems:
      detectedItems.length > 0 ? detectedItems : ["General parcel contents"],
    packaging: {
      type: input.packaging,
      label: parcelPackagingLabels[input.packaging],
      notes: "Packaging comes from the selected parcel intake field.",
    },
    materials: inferMaterials(input.contentDescription, input.packaging),
    fragileLevel: localEstimate.fragileLevel,
    confidence: input.contentDescription.trim().length >= 12 ? 0.62 : 0.38,
    notes: [
      localEstimate.confidenceNote,
      "Generated by the local deterministic estimator because OpenAI was unavailable.",
    ],
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidFragileLevel(value: unknown): value is ParcelFragileLevel {
  return value === "low" || value === "moderate" || value === "high";
}

function isValidPackagingType(value: unknown): value is ParcelPackagingType {
  return (
    value === "soft_pouch" ||
    value === "boxed" ||
    value === "insulated" ||
    value === "fragile_protective" ||
    value === "heavy_duty"
  );
}

function normalizeConfidence(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.min(Math.max(value, 0), 1);
}

function parseOpenAIParcelEstimate(
  value: unknown,
  fallbackPackaging: ParcelPackagingType,
): AIParcelEstimatorOutput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const packaging = record.packaging as Record<string, unknown> | undefined;
  const confidence = normalizeConfidence(record.confidence);

  if (
    !isStringArray(record.detectedItems) ||
    !packaging ||
    typeof packaging !== "object" ||
    !isValidPackagingType(packaging.type) ||
    !isStringArray(record.materials) ||
    !isValidFragileLevel(record.fragileLevel) ||
    confidence === null ||
    !isStringArray(record.notes)
  ) {
    return null;
  }

  return {
    detectedItems: record.detectedItems.slice(0, 8),
    packaging: {
      type: packaging.type,
      label:
        typeof packaging.label === "string"
          ? packaging.label
          : parcelPackagingLabels[packaging.type ?? fallbackPackaging],
      notes:
        typeof packaging.notes === "string"
          ? packaging.notes
          : "Packaging inferred from the parcel intake field.",
    },
    materials: record.materials.slice(0, 8),
    fragileLevel: record.fragileLevel,
    confidence,
    notes: record.notes.slice(0, 6),
  };
}

function createFallbackResult(
  input: AIParcelEstimatorInput,
  code: AIParcelEstimatorFallbackCode,
  message: string,
): AIParcelEstimatorResult {
  return {
    status: "fallback",
    source: "local",
    estimate: createLocalFallbackEstimate(input),
    error: {
      code,
      message,
    },
  };
}

const fragileLevelRank: Record<ParcelFragileLevel, number> = {
  low: 0,
  moderate: 1,
  high: 2,
};

function getHigherFragileLevel(
  left: ParcelFragileLevel,
  right: ParcelFragileLevel,
) {
  return fragileLevelRank[left] >= fragileLevelRank[right] ? left : right;
}

function parseWeightRange(range: string) {
  const matches = range.match(/\d+(?:\.\d+)?/g);

  if (!matches || matches.length < 2) {
    return {
      min: 0.2,
      max: 8,
    };
  }

  return {
    min: Number(matches[0]),
    max: Number(matches[1]),
  };
}

function buildFinalParcelEstimate(
  input: ParcelEstimatorRequest,
  aiResult: AIParcelEstimatorResult,
): ParcelEstimatorResponse {
  const localEstimate = getParcelAssistantMockResult(toParcelAssistantInput(input));
  const localWeight = parseWeightRange(localEstimate.estimatedWeightRange);
  const aiEstimate = aiResult.estimate;
  const fragileLevel =
    aiResult.status === "ok"
      ? getHigherFragileLevel(aiEstimate.fragileLevel, localEstimate.fragileLevel)
      : localEstimate.fragileLevel;
  const detectedItems =
    aiEstimate.detectedItems.length > 0
      ? aiEstimate.detectedItems
      : splitDetectedItems(input.contentDescription);
  const explanationParts = [
    aiResult.status === "ok"
      ? "AI reviewed the content description and packaging signals."
      : "Local estimator used packaging, size and keyword rules because AI was unavailable.",
    `Local weight baseline for ${input.approximateSize.replace("_", " ")} parcels is ${localEstimate.estimatedWeightRange}.`,
    `Recommended drone class remains ${localEstimate.suggestedDroneClass.replace("_", " ")} until pickup verification.`,
  ];

  if (aiEstimate.materials.length > 0) {
    explanationParts.splice(
      1,
      0,
      `Likely material signals: ${aiEstimate.materials.slice(0, 3).join(", ")}.`,
    );
  }

  return {
    source: aiResult.status === "ok" ? "ai_assisted" : "local_fallback",
    detectedItems:
      detectedItems.length > 0 ? detectedItems : ["General parcel contents"],
    estimatedWeightMin: localWeight.min,
    estimatedWeightMax: localWeight.max,
    confidence:
      aiResult.status === "ok"
        ? Number(Math.min(Math.max(aiEstimate.confidence, 0.35), 0.92).toFixed(2))
        : aiEstimate.confidence,
    fragileLevel,
    recommendedDroneClass: localEstimate.suggestedDroneClass as DroneClass,
    explanation: explanationParts.join(" "),
    safetyNote: "Final weight will be confirmed at pickup",
  };
}

export async function estimateParcelWithAI(
  input: AIParcelEstimatorInput,
): Promise<AIParcelEstimatorResult> {
  if (!hasOpenAIConfiguration()) {
    return createFallbackResult(
      input,
      "missing_api_key",
      "OPENAI_API_KEY is not configured on the server.",
    );
  }

  try {
    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: parcelEstimatorModel,
      input: [
        {
          role: "system",
          content:
            "You are SkySend's server-side parcel estimator. Return concise operational estimates for drone delivery intake. Do not ask follow-up questions.",
        },
        {
          role: "user",
          content: JSON.stringify({
            contentDescription: input.contentDescription,
            packaging: input.packaging,
            packagingLabel: parcelPackagingLabels[input.packaging],
            approximateSize: input.approximateSize,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "skysend_parcel_estimate",
          strict: true,
          schema: parcelEstimatorSchema,
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as unknown;
    const estimate = parseOpenAIParcelEstimate(parsed, input.packaging);

    if (!estimate) {
      return createFallbackResult(
        input,
        "invalid_response",
        "OpenAI returned a response that did not match the parcel estimate shape.",
      );
    }

    return {
      status: "ok",
      source: "openai",
      estimate,
    };
  } catch {
    return createFallbackResult(
      input,
      "openai_error",
      "OpenAI parcel estimation failed, so SkySend used the local estimator.",
    );
  }
}

export async function estimateParcelForDispatch(
  input: ParcelEstimatorRequest,
): Promise<ParcelEstimatorResponse> {
  const aiResult = await estimateParcelWithAI(input);

  return buildFinalParcelEstimate(input, aiResult);
}
