import {
  isPointInServiceArea,
  getServiceAreaUnavailableMessage,
  getDistanceKm,
} from "@/lib/service-area";
import type { CreateDeliveryAddressField } from "@/lib/create-delivery-addresses";
import type {
  CandidatePoint,
  CandidatePointEligibilityState,
  CandidatePointRecommendationState,
  CandidatePointType,
} from "@/types/candidate-points";
import type { GeocodedAddress, GeoPoint } from "@/types/service-area";

const METERS_PER_DEGREE_LATITUDE = 111_320;

const candidatePointBlueprints: ReadonlyArray<{
  type: CandidatePointType;
  label: string;
  description: string;
  offsetNorthMeters: number;
  offsetEastMeters: number;
  baseScore: number;
}> = [
  {
    type: "entrance",
    label: "Main entrance",
    description: "Closest handoff point with the clearest pedestrian access.",
    offsetNorthMeters: 14,
    offsetEastMeters: -8,
    baseScore: 92,
  },
  {
    type: "curbside",
    label: "Curbside handoff",
    description: "Fast street-facing option for short stop handovers.",
    offsetNorthMeters: -12,
    offsetEastMeters: 18,
    baseScore: 88,
  },
  {
    type: "parking",
    label: "Parking edge",
    description: "Open approach area suited for predictable pickup timing.",
    offsetNorthMeters: 24,
    offsetEastMeters: 26,
    baseScore: 83,
  },
  {
    type: "public_point",
    label: "Public meeting point",
    description: "Visible fallback point near the selected address context.",
    offsetNorthMeters: -20,
    offsetEastMeters: -20,
    baseScore: 79,
  },
] as const;

export const candidatePointTypeLabels: Record<CandidatePointType, string> = {
  curbside: "Curbside",
  entrance: "Entrance",
  parking: "Parking",
  public_point: "Public point",
};

export const candidatePointEligibilityLabels: Record<
  CandidatePointEligibilityState,
  string
> = {
  eligible: "Eligible",
  review: "Review",
  outside: "Outside area",
};

export const candidatePointRecommendationLabels: Record<
  CandidatePointRecommendationState,
  string
> = {
  recommended: "Recommended",
  alternative: "Alternative",
  unavailable: "Unavailable",
};

const fieldTypeBonuses: Record<
  CreateDeliveryAddressField,
  Record<CandidatePointType, number>
> = {
  pickup: {
    entrance: 12,
    curbside: 9,
    parking: 5,
    public_point: 6,
  },
  dropoff: {
    entrance: 10,
    curbside: 7,
    parking: 4,
    public_point: 9,
  },
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function offsetPoint(
  point: GeoPoint,
  offsetNorthMeters: number,
  offsetEastMeters: number,
): GeoPoint {
  const latitudeDelta = offsetNorthMeters / METERS_PER_DEGREE_LATITUDE;
  const longitudeDelta =
    offsetEastMeters /
    (METERS_PER_DEGREE_LATITUDE * Math.cos(toRadians(point.latitude)));

  return {
    latitude: point.latitude + latitudeDelta,
    longitude: point.longitude + longitudeDelta,
  };
}

function getCandidatePointEligibility(
  originalAddressEligible: boolean,
  point: GeoPoint,
): CandidatePointEligibilityState {
  if (!originalAddressEligible) {
    return "outside";
  }

  const eligibility = isPointInServiceArea(point);

  if (!eligibility.isCovered) {
    return "outside";
  }

  return eligibility.distanceKm >= 5.5 ? "review" : "eligible";
}

function getScoreAdjustmentForEligibility(
  eligibilityState: CandidatePointEligibilityState,
) {
  if (eligibilityState === "review") {
    return -7;
  }

  if (eligibilityState === "outside") {
    return -28;
  }

  return 0;
}

function getEligibilityBonus(eligibilityState: CandidatePointEligibilityState) {
  if (eligibilityState === "outside") {
    return -70;
  }

  if (eligibilityState === "review") {
    return 10;
  }

  return 22;
}

function getProximityBonus(distanceFromOriginMeters: number) {
  if (distanceFromOriginMeters <= 18) {
    return 18;
  }

  if (distanceFromOriginMeters <= 28) {
    return 13;
  }

  if (distanceFromOriginMeters <= 40) {
    return 8;
  }

  return 4;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function withSmartScoring(
  field: CreateDeliveryAddressField,
  origin: GeoPoint,
  points: CandidatePoint[],
) {
  const scoredPoints = points.map((point) => {
    const distanceFromOriginMeters = Math.round(
      getDistanceKm(origin, point.point) * 1000,
    );
    const smartScore = clampScore(
      Math.round(
        point.suitabilityScore * 0.58 +
          getEligibilityBonus(point.eligibilityState) +
          fieldTypeBonuses[field][point.type] +
          getProximityBonus(distanceFromOriginMeters),
      ),
    );

    return {
      ...point,
      smartScore,
      distanceFromOriginMeters,
      recommendationState:
        point.eligibilityState === "outside" ? "unavailable" : "alternative",
    } satisfies CandidatePoint;
  });

  const selectablePoints = [...scoredPoints]
    .filter((point) => point.eligibilityState !== "outside")
    .sort((left, right) => right.smartScore - left.smartScore);
  const recommendedPointId = selectablePoints[0]?.id ?? null;
  const alternativePointIds = new Set(
    selectablePoints.slice(1, 3).map((point) => point.id),
  );

  return scoredPoints.map((point) => {
    if (point.id === recommendedPointId) {
      return {
        ...point,
        recommendationState: "recommended",
      } satisfies CandidatePoint;
    }

    if (alternativePointIds.has(point.id)) {
      return {
        ...point,
        recommendationState: "alternative",
      } satisfies CandidatePoint;
    }

    return {
      ...point,
      recommendationState:
        point.eligibilityState === "outside" ? "unavailable" : "alternative",
    } satisfies CandidatePoint;
  });
}

export function generateCandidatePointsForAddress(
  field: CreateDeliveryAddressField,
  address: GeocodedAddress,
  isAddressEligible: boolean,
): CandidatePoint[] {
  const candidatePoints: CandidatePoint[] = candidatePointBlueprints.map(
    (blueprint, index) => {
    const point = offsetPoint(
      address.location,
      blueprint.offsetNorthMeters,
      blueprint.offsetEastMeters,
    );
    const eligibilityState = getCandidatePointEligibility(isAddressEligible, point);
    const fieldPrefix = field === "pickup" ? "pickup" : "dropoff";

    return {
      id: `${fieldPrefix}-${blueprint.type}-${index + 1}`,
      label: blueprint.label,
      point,
      type: blueprint.type,
      description:
        eligibilityState === "outside"
          ? getServiceAreaUnavailableMessage()
          : blueprint.description,
      suitabilityScore: Math.max(
        48,
        blueprint.baseScore + getScoreAdjustmentForEligibility(eligibilityState),
      ),
      eligibilityState,
      smartScore: 0,
      distanceFromOriginMeters: 0,
      recommendationState:
        eligibilityState === "outside"
          ? ("unavailable" as const)
          : ("alternative" as const),
    };
  });

  return withSmartScoring(field, address.location, candidatePoints);
}

export function getDefaultSelectedCandidatePoint(
  points: readonly CandidatePoint[],
): CandidatePoint | null {
  return (
    points.find((point) => point.recommendationState === "recommended") ??
    points.find((point) => point.eligibilityState === "eligible") ??
    points.find((point) => point.eligibilityState === "review") ??
    null
  );
}

export function hasSelectableCandidatePoints(points: readonly CandidatePoint[]) {
  return points.some((point) => point.eligibilityState !== "outside");
}
