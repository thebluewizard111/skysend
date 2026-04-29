import { serviceAreaConfig } from "@/constants/service-area";
import type { MapMarkerDefinition } from "@/types/map";

export const coveragePreviewMarkers = [
  {
    id: "hub-central",
    point: serviceAreaConfig.center,
    label: "Pitesti Central Hub",
    description: "Primary dispatch hub for active same-hour missions.",
    tone: "primary",
    emphasized: true,
  },
  {
    id: "service-north",
    point: {
      latitude: 44.8726,
      longitude: 24.8624,
    },
    label: "Trivale Service Point",
    description: "Service point for residential handoff density.",
    tone: "success",
  },
  {
    id: "service-east",
    point: {
      latitude: 44.8509,
      longitude: 24.8948,
    },
    label: "Prundu Service Point",
    description: "Service point for scheduled courier windows.",
    tone: "success",
  },
  {
    id: "service-south",
    point: {
      latitude: 44.8385,
      longitude: 24.8709,
    },
    label: "South Corridor Checkpoint",
    description: "Corridor checkpoint for controlled route planning.",
    tone: "warning",
  },
] as const satisfies readonly MapMarkerDefinition[];

export const coveragePreviewStats = [
  {
    label: "Live zone",
    value: "Pitesti",
    hint: "Single-city launch footprint with controlled service density.",
  },
  {
    label: "Service points",
    value: "4",
    hint: "Network nodes shown for live coverage context.",
  },
  {
    label: "Coverage mode",
    value: "Radius",
    hint: "Prepared to upgrade later to polygon-based municipal boundaries.",
  },
] as const;
