import type { GeocodedAddress } from "@/types/service-area";

export type GeoapifyAutocompleteResult = {
  place_id: string;
  formatted: string;
  lat: number;
  lon: number;
  housenumber?: string;
  street?: string;
  suburb?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  country_code?: string;
  postcode?: string;
  result_type?: string;
};

export type GeoapifyAutocompleteResponse = {
  results: GeoapifyAutocompleteResult[];
};

export type GeoapifyAddressSuggestion = {
  id: string;
  label: string;
  secondaryLabel?: string;
  geocodedAddress: GeocodedAddress;
};
