import type { ServiceAreaConfig } from "@/types/service-area";

export const serviceAreaConfig: ServiceAreaConfig = {
  cityName: "Pitesti",
  county: "Arges",
  country: "Romania",
  center: {
    latitude: 44.8565,
    longitude: 24.8692,
  },
  coverageRadiusKm: 6,
  activeMode: "radius",
  fallbackMode: "radius",
  area: {
    mode: "radius",
    center: {
      latitude: 44.8565,
      longitude: 24.8692,
    },
    radiusKm: 6,
  },
  futurePolygonArea: null,
  statusMessages: {
    available: "Adresa este in zona activa SkySend pentru Pitesti.",
    outside:
      "Serviciul este momentan disponibil doar in zona activa Pitesti. Vom reveni cand extindem acoperirea.",
    unsupported:
      "Serviciul este activ momentan doar in municipiul Pitesti, judetul Arges.",
    review:
      "Adresa pare aproape de limita zonei active din Pitesti. O verificare suplimentara poate fi facuta inainte de dispatch.",
  },
};
