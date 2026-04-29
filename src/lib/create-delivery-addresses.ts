import {
  getServiceAreaUnavailableMessage,
  isGeocodedAddressEligible,
} from "@/lib/service-area";
import type { GeocodedAddress } from "@/types/service-area";
import type { GeoapifyAddressSuggestion } from "@/types/geoapify";

export type CreateDeliveryAddressField = "pickup" | "dropoff";

export type CreateDeliveryAddressDraft = {
  address: string;
  notes: string;
  selectedAddress: GeocodedAddress | null;
};

export type CreateDeliveryAddressValidationState =
  | "empty"
  | "ready"
  | "inside"
  | "review"
  | "outside";

export type CreateDeliveryAddressValidationTone =
  | "neutral"
  | "success"
  | "warning"
  | "destructive"
  | "info";

export type CreateDeliveryAddressValidation = {
  state: CreateDeliveryAddressValidationState;
  tone: CreateDeliveryAddressValidationTone;
  badgeLabel: string;
  helperText: string;
  geocodedAddress: GeocodedAddress | null;
  isEligible: boolean;
  needsManualReview: boolean;
};

export type CreateDeliveryCoverageSummary = {
  state: "ready" | "inside" | "review" | "outside";
  tone: CreateDeliveryAddressValidationTone;
  title: string;
  description: string;
};

export const defaultCreateDeliveryAddressDrafts: Record<
  CreateDeliveryAddressField,
  CreateDeliveryAddressDraft
> = {
  pickup: {
    address: "Strada Victoriei 24, Pitesti",
    notes: "Office reception, level 1. Call on arrival.",
    selectedAddress: {
      formattedAddress: "Strada Victoriei 24, Pitesti",
      location: {
        latitude: 44.8569,
        longitude: 24.8725,
      },
      city: "Pitesti",
      county: "Arges",
      country: "Romania",
    },
  },
  dropoff: {
    address: "Bulevardul Republicii 148, Pitesti",
    notes: "Front desk handoff near the main entrance.",
    selectedAddress: {
      formattedAddress: "Bulevardul Republicii 148, Pitesti",
      location: {
        latitude: 44.8593,
        longitude: 24.8721,
      },
      city: "Pitesti",
      county: "Arges",
      country: "Romania",
    },
  },
};

export function validateCreateDeliveryAddress(
  draft: CreateDeliveryAddressDraft,
): CreateDeliveryAddressValidation {
  const trimmedValue = draft.address.trim();

  if (!trimmedValue) {
    return {
      state: "empty",
      tone: "neutral",
      badgeLabel: "Address needed",
      helperText:
        "Add the street address first. Coverage checks appear as soon as the route is specific enough.",
      geocodedAddress: null,
      isEligible: false,
      needsManualReview: false,
    };
  }

  const geocodedAddress =
    draft.selectedAddress?.formattedAddress === trimmedValue
      ? draft.selectedAddress
      : null;

  if (!geocodedAddress) {
    return {
      state: "ready",
      tone: "info",
      badgeLabel: "Select a suggestion",
      helperText:
        "Choose one of the address suggestions to confirm the exact location and validate coverage inside the active Pitesti zone.",
      geocodedAddress: null,
      isEligible: false,
      needsManualReview: false,
    };
  }

  const eligibility = isGeocodedAddressEligible(geocodedAddress);

  if (!eligibility.isEligible) {
    return {
      state: "outside",
      tone: "destructive",
      badgeLabel: "Outside coverage",
      helperText: getServiceAreaUnavailableMessage(),
      geocodedAddress,
      isEligible: false,
      needsManualReview: false,
    };
  }

  if (eligibility.needsManualReview) {
    return {
      state: "review",
      tone: "warning",
      badgeLabel: "Boundary review",
      helperText: eligibility.message,
      geocodedAddress,
      isEligible: true,
      needsManualReview: true,
    };
  }

  return {
    state: "inside",
    tone: "success",
    badgeLabel: "Inside active area",
    helperText: eligibility.message,
    geocodedAddress,
    isEligible: true,
    needsManualReview: false,
  };
}

export function createDeliveryAddressDraftFromSuggestion(
  currentValue: CreateDeliveryAddressDraft,
  suggestion: GeoapifyAddressSuggestion,
): CreateDeliveryAddressDraft {
  return {
    ...currentValue,
    address: suggestion.label,
    selectedAddress: suggestion.geocodedAddress,
  };
}

export function createDeliveryAddressDraftFromGeocodedAddress(
  currentValue: CreateDeliveryAddressDraft,
  geocodedAddress: GeocodedAddress,
): CreateDeliveryAddressDraft {
  return {
    ...currentValue,
    address: geocodedAddress.formattedAddress,
    selectedAddress: geocodedAddress,
  };
}

export function getCreateDeliveryCoverageSummary(
  pickup: CreateDeliveryAddressValidation,
  dropoff: CreateDeliveryAddressValidation,
): CreateDeliveryCoverageSummary {
  if (pickup.state === "outside" || dropoff.state === "outside") {
    return {
      state: "outside",
      tone: "destructive",
      title: "Route outside current coverage",
      description: getServiceAreaUnavailableMessage(),
    };
  }

  if (pickup.state === "review" || dropoff.state === "review") {
    return {
      state: "review",
      tone: "warning",
      title: "Route close to the active boundary",
      description:
        "One route point sits close to the Pitesti service edge. Final feasibility can confirm the route before dispatch.",
    };
  }

  if (pickup.state === "inside" && dropoff.state === "inside") {
    return {
      state: "inside",
      tone: "success",
      title: "Route inside active Pitesti coverage",
      description:
        "Pickup and drop-off are both inside the current city zone and ready for the next step in the flow.",
    };
  }

  return {
    state: "ready",
    tone: "info",
    title: "Coverage check becomes visible as you type",
    description:
      "The route is validated against the active Pitesti area as soon as both addresses are specific enough for geocoded verification.",
  };
}
