import type { DroneClass } from "@/types/domain";

export type ParcelPackagingType =
  | "soft_pouch"
  | "boxed"
  | "insulated"
  | "fragile_protective"
  | "heavy_duty";

export type ParcelSizeOption =
  | "extra_small"
  | "small"
  | "medium"
  | "large";

export type ParcelFragileLevel = "low" | "moderate" | "high";

export type ParcelAssistantInput = {
  contents: string;
  packaging: ParcelPackagingType;
  approximateSize: ParcelSizeOption;
};

export type ParcelAssistantResult = {
  estimatedWeightRange: string;
  fragileLevel: ParcelFragileLevel;
  suggestedDroneClass: DroneClass;
  confidenceNote: string;
};
