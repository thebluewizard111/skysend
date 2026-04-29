import type { DroneConfig } from "@/types/drone";

export const droneFleet: readonly DroneConfig[] = [
  {
    id: "light_express",
    name: "Light Express",
    shortDescription:
      "Fast-response drone optimized for compact same-hour urban deliveries.",
    maxPayloadKg: 1.5,
    maxParcelDimensionsCm: {
      lengthCm: 22,
      widthCm: 18,
      heightCm: 10,
    },
    estimatedRangeKm: 12,
    estimatedSpeedKph: 68,
    suitabilityTags: ["dense_urban", "high_priority", "same_hour"],
    recommendedUseCases: [
      "Small retail orders in dense city cores",
      "Urgent document and key delivery",
      "Rapid dispatch for compact consumer parcels",
    ],
  },
  {
    id: "standard_courier",
    name: "Standard Courier",
    shortDescription:
      "Balanced fleet default for routine last-mile commercial deliveries.",
    maxPayloadKg: 3,
    maxParcelDimensionsCm: {
      lengthCm: 35,
      widthCm: 28,
      heightCm: 18,
    },
    estimatedRangeKm: 20,
    estimatedSpeedKph: 58,
    suitabilityTags: ["dense_urban", "same_hour", "weather_resilient"],
    recommendedUseCases: [
      "Restaurant and pharmacy deliveries",
      "Standard e-commerce parcel fulfillment",
      "Recurring B2B neighborhood dispatches",
    ],
  },
  {
    id: "fragile_care",
    name: "Fragile Care",
    shortDescription:
      "Stabilized handling profile for sensitive, fragile, or medical payloads.",
    maxPayloadKg: 2.5,
    maxParcelDimensionsCm: {
      lengthCm: 30,
      widthCm: 24,
      heightCm: 16,
    },
    estimatedRangeKm: 16,
    estimatedSpeedKph: 46,
    suitabilityTags: ["fragile_goods", "medical", "high_priority"],
    recommendedUseCases: [
      "Lab packs and medical kits",
      "Delicate electronics or precision components",
      "Temperature-controlled or shock-sensitive parcels",
    ],
  },
  {
    id: "long_range",
    name: "Long Range",
    shortDescription:
      "Extended-autonomy drone for suburban corridors and distributed service zones.",
    maxPayloadKg: 2.2,
    maxParcelDimensionsCm: {
      lengthCm: 32,
      widthCm: 24,
      heightCm: 15,
    },
    estimatedRangeKm: 38,
    estimatedSpeedKph: 54,
    suitabilityTags: ["long_distance", "weather_resilient", "same_hour"],
    recommendedUseCases: [
      "Cross-district parcel movement",
      "Suburban delivery routes",
      "Service expansion beyond the urban core",
    ],
  },
  {
    id: "heavy_cargo",
    name: "Heavy Cargo",
    shortDescription:
      "High-capacity drone for oversized payloads and consolidated logistics runs.",
    maxPayloadKg: 8,
    maxParcelDimensionsCm: {
      lengthCm: 55,
      widthCm: 42,
      heightCm: 30,
    },
    estimatedRangeKm: 24,
    estimatedSpeedKph: 40,
    suitabilityTags: ["heavy_payload", "weather_resilient", "long_distance"],
    recommendedUseCases: [
      "Bulk commercial deliveries",
      "Industrial spare parts and maintenance loads",
      "Heavier grocery or healthcare supply drops",
    ],
  },
] as const;

export const droneFleetById = Object.fromEntries(
  droneFleet.map((drone) => [drone.id, drone]),
) as Record<DroneConfig["id"], DroneConfig>;
