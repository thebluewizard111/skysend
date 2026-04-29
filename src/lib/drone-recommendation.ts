import { droneFleet } from "@/constants/drone-fleet";
import type { DroneRecommendationCriteria } from "@/types/drone";

function fitsParcel(
  criteria: DroneRecommendationCriteria,
  drone: (typeof droneFleet)[number],
) {
  return (
    criteria.payloadKg <= drone.maxPayloadKg &&
    criteria.parcelDimensionsCm.lengthCm <=
      drone.maxParcelDimensionsCm.lengthCm &&
    criteria.parcelDimensionsCm.widthCm <=
      drone.maxParcelDimensionsCm.widthCm &&
    criteria.parcelDimensionsCm.heightCm <=
      drone.maxParcelDimensionsCm.heightCm &&
    criteria.deliveryDistanceKm <= drone.estimatedRangeKm
  );
}

function scoreDrone(
  criteria: DroneRecommendationCriteria,
  drone: (typeof droneFleet)[number],
) {
  let score = 0;

  if (criteria.requiresFragileHandling && drone.id === "fragile_care") {
    score += 50;
  }

  if (criteria.urgency === "critical" && drone.id === "light_express") {
    score += 35;
  }

  if (
    criteria.deliveryDistanceKm > 20 &&
    drone.suitabilityTags.includes("long_distance")
  ) {
    score += 30;
  }

  if (criteria.payloadKg > 3 && drone.id === "heavy_cargo") {
    score += 40;
  }

  if (criteria.urgency === "priority" && drone.suitabilityTags.includes("high_priority")) {
    score += 20;
  }

  score += Math.max(0, drone.maxPayloadKg - criteria.payloadKg);
  score += Math.max(0, drone.estimatedRangeKm - criteria.deliveryDistanceKm) / 5;

  return score;
}

export function getRecommendedDrone(criteria: DroneRecommendationCriteria) {
  const eligibleDrones = droneFleet.filter((drone) => fitsParcel(criteria, drone));

  if (eligibleDrones.length === 0) {
    return null;
  }

  return eligibleDrones.sort((left, right) => {
    return scoreDrone(criteria, right) - scoreDrone(criteria, left);
  })[0];
}
