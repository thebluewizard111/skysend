import type { DeliveryUrgency, DroneClass } from "@/types/domain";

export type DroneSuitabilityTag =
  | "dense_urban"
  | "fragile_goods"
  | "high_priority"
  | "heavy_payload"
  | "long_distance"
  | "medical"
  | "same_hour"
  | "weather_resilient";

export type ParcelDimensions = {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export type DroneConfig = {
  id: DroneClass;
  name: string;
  shortDescription: string;
  maxPayloadKg: number;
  maxParcelDimensionsCm: ParcelDimensions;
  estimatedRangeKm: number;
  estimatedSpeedKph: number;
  suitabilityTags: DroneSuitabilityTag[];
  recommendedUseCases: string[];
};

export type DroneRecommendationCriteria = {
  payloadKg: number;
  parcelDimensionsCm: ParcelDimensions;
  deliveryDistanceKm: number;
  urgency?: DeliveryUrgency;
  requiresFragileHandling?: boolean;
};
