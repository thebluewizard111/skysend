import { mapConfig } from "@/constants/map";
import {
  createGeoapifyAutocompleteUrl,
  createGeoapifyForwardGeocodingUrl,
  createGeoapifyReverseGeocodingUrl,
} from "@/lib/geoapify";
import { serviceAreaConfig } from "@/constants/service-area";
import type { MapMarkerDefinition, MapOverlayDefinition, MapViewport } from "@/types/map";
import type { GeoPoint } from "@/types/service-area";
import { getDistanceKm } from "@/lib/service-area";

const EARTH_RADIUS_KM = 6371;
const DEFAULT_CIRCLE_STEPS = 48;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function projectPoint(center: GeoPoint, radiusKm: number, bearingDegrees: number) {
  const angularDistance = radiusKm / EARTH_RADIUS_KM;
  const bearing = toRadians(bearingDegrees);
  const latitude = toRadians(center.latitude);
  const longitude = toRadians(center.longitude);

  const projectedLatitude = Math.asin(
    Math.sin(latitude) * Math.cos(angularDistance) +
      Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
  );

  const projectedLongitude =
    longitude +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
      Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(projectedLatitude),
    );

  return {
    latitude: toDegrees(projectedLatitude),
    longitude: toDegrees(projectedLongitude),
  };
}

function toGeoJsonPolygon(
  points: GeoPoint[],
): GeoJSON.FeatureCollection<GeoJSON.Polygon, GeoJSON.GeoJsonProperties> {
  const coordinates = points.map<[number, number]>((point) => [
    point.longitude,
    point.latitude,
  ]);

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
        properties: {
          label: "Service area",
        },
      },
    ],
  };
}

export function createRadiusPolygon(
  center: GeoPoint,
  radiusKm: number,
  steps = DEFAULT_CIRCLE_STEPS,
) {
  const points = Array.from({ length: steps }, (_, index) => {
    const bearing = (index / steps) * 360;
    return projectPoint(center, radiusKm, bearing);
  });

  return [...points, points[0]];
}

export function getServiceAreaMapOverlay(): MapOverlayDefinition {
  const polygon =
    serviceAreaConfig.area.mode === "polygon"
      ? [...serviceAreaConfig.area.polygon, serviceAreaConfig.area.polygon[0]]
      : createRadiusPolygon(
          serviceAreaConfig.area.center,
          serviceAreaConfig.area.radiusKm,
        );

  return {
    id: "pitesti-service-area",
    data: toGeoJsonPolygon(polygon),
    fillColor: "#8ba7ca",
    fillOpacity: 0.16,
    lineColor: "#1c2940",
    lineWidth: 2,
  };
}

export function getDefaultMapView() {
  return {
    center: mapConfig.defaultCenter,
    zoom: mapConfig.defaultZoom,
  };
}

function getZoomForDistance(distanceKm: number) {
  if (distanceKm <= 0.7) {
    return 15.4;
  }

  if (distanceKm <= 1.5) {
    return 14.6;
  }

  if (distanceKm <= 3) {
    return 13.9;
  }

  if (distanceKm <= 6) {
    return 13.1;
  }

  if (distanceKm <= 10) {
    return 12.4;
  }

  return 11.6;
}

export function getMarkerDrivenViewport(
  markers: readonly MapMarkerDefinition[],
): MapViewport {
  if (markers.length === 0) {
    return getDefaultMapView();
  }

  if (markers.length === 1) {
    return {
      center: markers[0].point,
      zoom: 14.6,
    };
  }

  const latitudes = markers.map((marker) => marker.point.latitude);
  const longitudes = markers.map((marker) => marker.point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const southwest = {
    latitude: minLatitude,
    longitude: minLongitude,
  };
  const northeast = {
    latitude: maxLatitude,
    longitude: maxLongitude,
  };
  const distanceKm = getDistanceKm(southwest, northeast);

  return {
    center: {
      latitude: (minLatitude + maxLatitude) / 2,
      longitude: (minLongitude + maxLongitude) / 2,
    },
    zoom: getZoomForDistance(distanceKm),
  };
}

export function getMapInteractionCapabilities() {
  return {
    supportsPointSelection: mapConfig.supportsPointSelection,
    supportsAutocomplete: mapConfig.supportsAutocomplete,
    geocodingUrl: mapConfig.geocodingUrl,
    autocompleteUrl: mapConfig.autocompleteUrl,
    reverseGeocodingUrl: mapConfig.reverseGeocodingUrl,
  };
}

export function getPickupPointSelectionConfig() {
  return {
    selectionMode: "pickup" as const,
    title: "Pickup point selection",
    helperText:
      "Select the pickup point on the map or by address search once geocoding is connected.",
  };
}

export function getDropoffPointSelectionConfig() {
  return {
    selectionMode: "dropoff" as const,
    title: "Drop-off point selection",
    helperText:
      "Select the drop-off point on the map or from autocomplete results after geocoding is enabled.",
  };
}

export function getFutureMapSearchEndpoints(query: string, point?: GeoPoint) {
  return {
    autocompleteUrl: createGeoapifyAutocompleteUrl(query),
    geocodingUrl: createGeoapifyForwardGeocodingUrl(query),
    reverseGeocodingUrl: point
      ? createGeoapifyReverseGeocodingUrl(point)
      : null,
  };
}
