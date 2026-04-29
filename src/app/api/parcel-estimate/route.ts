import { NextResponse } from "next/server";
import { getParcelAssistantMockResult } from "@/lib/parcel-assistant";
import { estimateParcelForDispatch } from "@/lib/ai";
import type {
  ParcelEstimatorErrorResponse,
  ParcelEstimatorRequest,
  ParcelEstimatorResponse,
} from "@/types/parcel-estimator";
import type {
  ParcelPackagingType,
  ParcelSizeOption,
} from "@/types/parcel-assistant";

const estimatorTimeoutMs = 6500;

const allowedPackagingTypes = new Set<ParcelPackagingType>([
  "soft_pouch",
  "boxed",
  "insulated",
  "fragile_protective",
  "heavy_duty",
]);

const allowedSizeOptions = new Set<ParcelSizeOption>([
  "extra_small",
  "small",
  "medium",
  "large",
]);

function parseParcelEstimateRequest(value: unknown): ParcelEstimatorRequest | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.contentDescription !== "string" ||
    !allowedPackagingTypes.has(record.packaging as ParcelPackagingType) ||
    !allowedSizeOptions.has(record.approximateSize as ParcelSizeOption)
  ) {
    return null;
  }

  return {
    contentDescription: record.contentDescription.trim(),
    packaging: record.packaging as ParcelPackagingType,
    approximateSize: record.approximateSize as ParcelSizeOption,
  };
}

function parseWeightRange(range: string) {
  const values = range.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];

  return {
    min: values[0] ?? 0.2,
    max: values[1] ?? values[0] ?? 3,
  };
}

function createLocalEstimatorResponse(
  input: ParcelEstimatorRequest,
): ParcelEstimatorResponse {
  const localResult = getParcelAssistantMockResult({
    contents: input.contentDescription,
    packaging: input.packaging,
    approximateSize: input.approximateSize,
  });
  const weight = parseWeightRange(localResult.estimatedWeightRange);

  return {
    source: "local_fallback",
    detectedItems: input.contentDescription
      .split(/,| and | with | plus |\/|&/i)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5),
    estimatedWeightMin: weight.min,
    estimatedWeightMax: weight.max,
    confidence: input.contentDescription.trim().length >= 12 ? 0.62 : 0.38,
    fragileLevel: localResult.fragileLevel,
    recommendedDroneClass: localResult.suggestedDroneClass,
    explanation: localResult.confidenceNote,
    safetyNote: "Final weight will be confirmed at pickup",
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Parcel estimator timed out."));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ParcelEstimatorErrorResponse>(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const input = parseParcelEstimateRequest(body);

  if (!input) {
    return NextResponse.json<ParcelEstimatorErrorResponse>(
      {
        error:
          "Parcel estimate requires contentDescription, packaging and approximateSize.",
      },
      { status: 400 },
    );
  }

  let estimate: ParcelEstimatorResponse;

  try {
    estimate = await withTimeout(
      estimateParcelForDispatch(input),
      estimatorTimeoutMs,
    );
  } catch {
    estimate = createLocalEstimatorResponse(input);
  }

  return NextResponse.json<ParcelEstimatorResponse>(estimate);
}
