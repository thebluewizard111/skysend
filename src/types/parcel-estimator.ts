import type { DroneClass } from "@/types/domain";
import type {
  ParcelFragileLevel,
  ParcelPackagingType,
  ParcelSizeOption,
} from "@/types/parcel-assistant";

export type ParcelEstimatorRequest = {
  contentDescription: string;
  packaging: ParcelPackagingType;
  approximateSize: ParcelSizeOption;
};

export type ParcelEstimatorSource = "ai_assisted" | "local_fallback";

export type ParcelEstimatorResponse = {
  source: ParcelEstimatorSource;
  detectedItems: string[];
  estimatedWeightMin: number;
  estimatedWeightMax: number;
  confidence: number;
  fragileLevel: ParcelFragileLevel;
  recommendedDroneClass: DroneClass;
  explanation: string;
  safetyNote: "Final weight will be confirmed at pickup";
};

export type ParcelEstimatorErrorResponse = {
  error: string;
};
