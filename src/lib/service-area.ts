import { serviceAreaConfig } from "@/constants/service-area";
import type {
  GeoPoint,
  GeocodedAddress,
  PolygonServiceArea,
  ServiceAreaCheckResult,
  ServiceAreaConfig,
} from "@/types/service-area";

const EARTH_RADIUS_KM = 6371;
const REVIEW_MARGIN_KM = 0.35;

function normalizeLocationValue(value?: string | null) {
  return value
    ?.trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("ro-RO");
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceKm(from: GeoPoint, to: GeoPoint) {
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const startLatitude = toRadians(from.latitude);
  const endLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  const angularDistance =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_KM * angularDistance;
}

function isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]) {
  let isInside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const current = polygon[i];
    const previous = polygon[j];

    const intersects =
      current.longitude > point.longitude !== previous.longitude > point.longitude &&
      point.latitude <
        ((previous.latitude - current.latitude) *
          (point.longitude - current.longitude)) /
          (previous.longitude - current.longitude) +
          current.latitude;

    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function getPolygonDistanceKm(point: GeoPoint, area: PolygonServiceArea) {
  return area.polygon.reduce((closestDistance, vertex) => {
    return Math.min(closestDistance, getDistanceKm(point, vertex));
  }, Number.POSITIVE_INFINITY);
}

export function getServiceAreaUnavailableMessage(
  config: ServiceAreaConfig = serviceAreaConfig,
) {
  return config.statusMessages.outside;
}

export function isPointInServiceArea(
  point: GeoPoint,
  config: ServiceAreaConfig = serviceAreaConfig,
): ServiceAreaCheckResult {
  if (config.area.mode === "polygon") {
    const isCovered = isPointInPolygon(point, config.area.polygon);
    const distanceKm = getPolygonDistanceKm(point, config.area);

    return {
      isCovered,
      modeUsed: "polygon",
      distanceKm,
      message: isCovered
        ? config.statusMessages.available
        : config.statusMessages.outside,
    };
  }

  const distanceKm = getDistanceKm(point, config.area.center);
  const isCovered = distanceKm <= config.area.radiusKm;

  return {
    isCovered,
    modeUsed: "radius",
    distanceKm,
    message: isCovered
      ? config.statusMessages.available
      : config.statusMessages.outside,
  };
}

export function isGeocodedAddressEligible(
  address: GeocodedAddress,
  config: ServiceAreaConfig = serviceAreaConfig,
) {
  const coverage = isPointInServiceArea(address.location, config);
  const cityMatches =
    normalizeLocationValue(address.city) === normalizeLocationValue(config.cityName);
  const countyMatches =
    normalizeLocationValue(address.county) === normalizeLocationValue(config.county);
  const countryMatches =
    normalizeLocationValue(address.country) === normalizeLocationValue(config.country);

  const needsManualReview =
    coverage.distanceKm >= config.coverageRadiusKm - REVIEW_MARGIN_KM ||
    !cityMatches ||
    !countyMatches ||
    !countryMatches;

  return {
    isEligible: coverage.isCovered && cityMatches && countyMatches && countryMatches,
    needsManualReview: coverage.isCovered && needsManualReview,
    coverage,
    message:
      coverage.isCovered && needsManualReview
        ? config.statusMessages.review
        : coverage.message,
  };
}
