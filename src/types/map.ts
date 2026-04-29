import type { ReactNode } from "react";
import type { GeoPoint } from "@/types/service-area";

export type MapProvider = "geoapify" | "openstreetmap" | "custom";
export type MapSelectionMode = "preview" | "pickup" | "dropoff";

export type MapMarkerTone = "primary" | "success" | "warning" | "destructive";
export type MapMarkerVariant = "default" | "candidate" | "recommended" | "drone";

export type MapMarkerDefinition = {
  id: string;
  point: GeoPoint;
  label?: string;
  description?: string;
  tone?: MapMarkerTone;
  emphasized?: boolean;
  variant?: MapMarkerVariant;
  headingDegrees?: number;
};

export type MapOverlayDefinition = {
  id: string;
  data: GeoJSON.FeatureCollection<GeoJSON.Polygon, GeoJSON.GeoJsonProperties>;
  fillColor?: string;
  fillOpacity?: number;
  lineColor?: string;
  lineWidth?: number;
};

export type MapLineDefinition = {
  id: string;
  data: GeoJSON.FeatureCollection<GeoJSON.LineString, GeoJSON.GeoJsonProperties>;
  lineColor?: string;
  lineOpacity?: number;
  lineWidth?: number;
  lineDasharray?: number[];
};

export type MapContainerProps = {
  className?: string;
  ariaLabel?: string;
  center?: GeoPoint;
  zoom?: number;
  interactive?: boolean;
  showNavigation?: boolean;
  selectionMode?: MapSelectionMode;
  markers?: readonly MapMarkerDefinition[];
  overlays?: readonly MapOverlayDefinition[];
  lines?: readonly MapLineDefinition[];
  selectedPoint?: GeoPoint | null;
  onPointSelect?: (point: GeoPoint) => void;
  overlayContent?: ReactNode;
};

export type MapAutocompleteSuggestion = {
  id: string;
  label: string;
  secondaryLabel?: string;
  point: GeoPoint;
};

export type MapViewport = {
  center: GeoPoint;
  zoom: number;
};
