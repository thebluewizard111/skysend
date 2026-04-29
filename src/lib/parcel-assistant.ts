import { droneClassLabels } from "@/constants/domain";
import {
  parcelFragileLevelLabels,
  parcelSizeDimensions,
  parcelSizeWeightRanges,
} from "@/constants/parcel-assistant";
import { getRecommendedDrone } from "@/lib/drone-recommendation";
import type {
  ParcelAssistantInput,
  ParcelAssistantResult,
  ParcelFragileLevel,
  ParcelPackagingType,
  ParcelSizeOption,
} from "@/types/parcel-assistant";

const sizeOrder: readonly ParcelSizeOption[] = [
  "extra_small",
  "small",
  "medium",
  "large",
] as const;

const fragileLevelPriority: readonly ParcelFragileLevel[] = [
  "low",
  "moderate",
  "high",
] as const;

const sizeProfiles: Record<
  ParcelSizeOption,
  {
    midpointKg: number;
    distanceKm: number;
  }
> = {
  extra_small: {
    midpointKg: 0.5,
    distanceKm: 6,
  },
  small: {
    midpointKg: 1.2,
    distanceKm: 8,
  },
  medium: {
    midpointKg: 2.7,
    distanceKm: 11,
  },
  large: {
    midpointKg: 5.8,
    distanceKm: 16,
  },
};

const packagingProfiles: Record<
  ParcelPackagingType,
  {
    payloadDeltaKg: number;
    fragileFloor: ParcelFragileLevel;
    confidenceHint: string;
  }
> = {
  soft_pouch: {
    payloadDeltaKg: -0.1,
    fragileFloor: "low",
    confidenceHint: "Flexible packaging usually fits lighter everyday parcels.",
  },
  boxed: {
    payloadDeltaKg: 0,
    fragileFloor: "low",
    confidenceHint: "A standard box is neutral and keeps the estimate conservative.",
  },
  insulated: {
    payloadDeltaKg: 0.35,
    fragileFloor: "moderate",
    confidenceHint:
      "Insulated packaging usually implies food, pharmacy or temperature-aware contents.",
  },
  fragile_protective: {
    payloadDeltaKg: 0.45,
    fragileFloor: "high",
    confidenceHint:
      "Protective packaging is treated as a strong fragile-handling signal.",
  },
  heavy_duty: {
    payloadDeltaKg: 1.15,
    fragileFloor: "low",
    confidenceHint:
      "Heavy-duty packaging usually means denser loads or reinforced handling needs.",
  },
};

const fragileKeywordGroups = {
  high: [
    "glass",
    "ceramic",
    "vial",
    "medical",
    "medicine",
    "sample",
    "lab",
    "device",
    "monitor",
    "screen",
    "camera",
    "lens",
  ],
  moderate: [
    "electronics",
    "electronic",
    "pharmacy",
    "food",
    "meal",
    "dessert",
    "cake",
    "pastry",
    "bottle",
    "cosmetic",
  ],
} as const;

const weightKeywordGroups = {
  heavy: [
    "tool",
    "tools",
    "metal",
    "parts",
    "hardware",
    "books",
    "documents box",
    "catering",
    "equipment",
    "printer",
    "battery",
  ],
  light: [
    "documents",
    "badge",
    "accessories",
    "samples",
    "letters",
    "paperwork",
    "prescription",
    "gift card",
  ],
} as const;

function normalizeContents(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function countKeywordMatches(contents: string, keywords: readonly string[]) {
  return keywords.reduce((count, keyword) => {
    return count + (contents.includes(keyword) ? 1 : 0);
  }, 0);
}

function getHigherFragilityLevel(
  left: ParcelFragileLevel,
  right: ParcelFragileLevel,
) {
  return fragileLevelPriority.indexOf(left) >= fragileLevelPriority.indexOf(right)
    ? left
    : right;
}

function shiftSize(size: ParcelSizeOption, delta: number) {
  const index = sizeOrder.indexOf(size);
  const nextIndex = Math.min(Math.max(index + delta, 0), sizeOrder.length - 1);

  return sizeOrder[nextIndex];
}

function inferFragileLevel(
  contents: string,
  packaging: ParcelPackagingType,
): ParcelFragileLevel {
  const normalizedContents = normalizeContents(contents);
  const packagingFloor = packagingProfiles[packaging].fragileFloor;
  const highFragilityMatches = countKeywordMatches(
    normalizedContents,
    fragileKeywordGroups.high,
  );
  const moderateFragilityMatches = countKeywordMatches(
    normalizedContents,
    fragileKeywordGroups.moderate,
  );

  if (highFragilityMatches > 0) {
    return getHigherFragilityLevel(packagingFloor, "high");
  }

  if (moderateFragilityMatches > 0) {
    return getHigherFragilityLevel(packagingFloor, "moderate");
  }

  return packagingFloor;
}

function inferEstimatedPayloadKg(input: ParcelAssistantInput) {
  const normalizedContents = normalizeContents(input.contents);
  const heavyKeywordMatches = countKeywordMatches(
    normalizedContents,
    weightKeywordGroups.heavy,
  );
  const lightKeywordMatches = countKeywordMatches(
    normalizedContents,
    weightKeywordGroups.light,
  );

  const basePayloadKg =
    sizeProfiles[input.approximateSize].midpointKg +
    packagingProfiles[input.packaging].payloadDeltaKg;

  const heavySignalDelta = heavyKeywordMatches * 0.55;
  const lightSignalDelta =
    lightKeywordMatches > 0 ? Math.min(lightKeywordMatches * 0.18, 0.35) : 0;

  return Math.max(0.2, Number((basePayloadKg + heavySignalDelta - lightSignalDelta).toFixed(2)));
}

function inferWeightRange(input: ParcelAssistantInput) {
  const normalizedContents = normalizeContents(input.contents);
  const heavyKeywordMatches = countKeywordMatches(
    normalizedContents,
    weightKeywordGroups.heavy,
  );
  const lightKeywordMatches = countKeywordMatches(
    normalizedContents,
    weightKeywordGroups.light,
  );

  let resolvedSize = input.approximateSize;

  if (
    input.packaging === "heavy_duty" ||
    heavyKeywordMatches >= 2
  ) {
    resolvedSize = shiftSize(resolvedSize, 1);
  } else if (
    input.packaging === "soft_pouch" &&
    lightKeywordMatches > 0 &&
    resolvedSize !== "extra_small"
  ) {
    resolvedSize = shiftSize(resolvedSize, -1);
  }

  return parcelSizeWeightRanges[resolvedSize];
}

function inferConfidenceNote(
  input: ParcelAssistantInput,
  result: Omit<ParcelAssistantResult, "confidenceNote">,
) {
  const normalizedContents = normalizeContents(input.contents);
  const fragileMatches =
    countKeywordMatches(normalizedContents, fragileKeywordGroups.high) +
    countKeywordMatches(normalizedContents, fragileKeywordGroups.moderate);
  const weightMatches =
    countKeywordMatches(normalizedContents, weightKeywordGroups.heavy) +
    countKeywordMatches(normalizedContents, weightKeywordGroups.light);
  const signalCount = fragileMatches + weightMatches;

  const packagingHint = packagingProfiles[input.packaging].confidenceHint;
  const droneLabel = droneClassLabels[result.suggestedDroneClass];

  if (normalizedContents.length < 6) {
    return `Lower confidence estimate because the contents description is very short. ${packagingHint} ${droneLabel} is the current safe default.`;
  }

  if (signalCount >= 2 || result.fragileLevel === "high") {
    return `Higher confidence estimate based on matching content signals, packaging type and approximate size. ${packagingHint} ${droneLabel} is the recommended fit.`;
  }

  return `Medium confidence estimate based on size, packaging and a limited set of keyword rules. ${packagingHint} ${droneLabel} is the current suggested class.`;
}

export const parcelAssistantMockRuleSummary = {
  fragileEstimation:
    "Fragility is inferred from packaging first, then elevated by sensitive keywords such as medical, glass, lab, camera or electronics.",
  weightEstimation:
    "Weight starts from the selected size profile, then shifts slightly based on packaging and simple heavy or light content keywords.",
  droneRecommendation:
    "The suggested drone comes from deterministic fleet matching using the estimated payload, parcel dimensions, delivery distance and fragile handling flag.",
  confidenceModel:
    "Confidence is higher when packaging and contents tell a consistent story, and lower when the description is vague or too short.",
} as const;

export function getParcelAssistantMockResult(
  input: ParcelAssistantInput,
): ParcelAssistantResult {
  const fragileLevel = inferFragileLevel(input.contents, input.packaging);
  const estimatedPayloadKg = inferEstimatedPayloadKg(input);
  const recommendedDrone =
    getRecommendedDrone({
      payloadKg: estimatedPayloadKg,
      parcelDimensionsCm: parcelSizeDimensions[input.approximateSize],
      deliveryDistanceKm: sizeProfiles[input.approximateSize].distanceKm,
      urgency:
        fragileLevel === "high"
          ? "priority"
          : input.approximateSize === "extra_small"
            ? "critical"
            : "standard",
      requiresFragileHandling: fragileLevel === "high",
    }) ?? null;

  const suggestedDroneClass = recommendedDrone?.id ?? "standard_courier";

  const result: Omit<ParcelAssistantResult, "confidenceNote"> = {
    estimatedWeightRange: inferWeightRange(input),
    fragileLevel,
    suggestedDroneClass,
  };

  return {
    ...result,
    confidenceNote: inferConfidenceNote(input, result),
  };
}

export { parcelFragileLevelLabels };
