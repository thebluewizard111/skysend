import type { GeoPoint } from "@/types/service-area";

export type CandidatePointType =
  | "curbside"
  | "entrance"
  | "parking"
  | "public_point";

export type CandidatePointEligibilityState =
  | "eligible"
  | "review"
  | "outside";

export type CandidatePointRecommendationState =
  | "recommended"
  | "alternative"
  | "unavailable";

export type CandidatePoint = {
  id: string;
  label: string;
  point: GeoPoint;
  type: CandidatePointType;
  description: string;
  suitabilityScore: number;
  eligibilityState: CandidatePointEligibilityState;
  smartScore: number;
  distanceFromOriginMeters: number;
  recommendationState: CandidatePointRecommendationState;
};
