import type { StyleSpecification } from "maplibre-gl";
import { serviceAreaConfig } from "@/constants/service-area";
import { geoapifyConfig } from "@/lib/geoapify";
import type { MapProvider } from "@/types/map";

const defaultTileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const defaultGeocodingUrl = "https://nominatim.openstreetmap.org/search";
const defaultAutocompleteUrl = "https://nominatim.openstreetmap.org/search";
const fallbackTileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? defaultTileUrl;
const preferredMapProvider: MapProvider = geoapifyConfig.hasApiKey
  ? "geoapify"
  : process.env.NEXT_PUBLIC_MAP_PROVIDER === "openstreetmap"
    ? "openstreetmap"
    : "custom";

export const mapConfig = {
  provider: preferredMapProvider,
  geoapifyApiKey: process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY,
  publicToken: process.env.NEXT_PUBLIC_MAP_PUBLIC_TOKEN,
  tileUrl: preferredMapProvider === "geoapify" ? undefined : fallbackTileUrl,
  styleUrl: geoapifyConfig.styleUrl,
  geocodingUrl:
    process.env.NEXT_PUBLIC_MAP_GEOCODING_URL ??
    geoapifyConfig.forwardGeocodingBaseUrl ??
    defaultGeocodingUrl,
  autocompleteUrl:
    geoapifyConfig.autocompleteBaseUrl ?? defaultAutocompleteUrl,
  reverseGeocodingUrl: geoapifyConfig.reverseGeocodingBaseUrl,
  defaultCenter: serviceAreaConfig.center,
  defaultZoom: 12.8,
  minZoom: 10,
  maxZoom: 18,
  maxPitch: 0,
  supportsPointSelection: true,
  supportsAutocomplete: geoapifyConfig.hasApiKey,
  attribution:
    preferredMapProvider === "geoapify"
      ? "(c) Geoapify, OpenMapTiles, OpenStreetMap contributors"
      : "(c) OpenStreetMap contributors",
} as const;

export const fallbackMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    "skysend-raster-tiles": {
      type: "raster",
      tiles: [fallbackTileUrl],
      tileSize: 256,
      attribution: mapConfig.attribution,
    },
  },
  layers: [
    {
      id: "skysend-background",
      type: "background",
      paint: {
        "background-color": "#f4f7fb",
      },
    },
    {
      id: "skysend-raster-layer",
      type: "raster",
      source: "skysend-raster-tiles",
      paint: {
        "raster-opacity": 0.95,
        "raster-brightness-max": 0.96,
        "raster-saturation": -0.55,
        "raster-contrast": 0.08,
      },
    },
  ],
};

export const defaultMapStyle: StyleSpecification | string =
  mapConfig.styleUrl ?? fallbackMapStyle;
