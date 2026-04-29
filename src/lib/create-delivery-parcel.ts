import { droneClassLabels } from "@/constants/domain";
import {
  parcelFragileLevelLabels,
  parcelPackagingLabels,
  parcelPackagingOptions,
  parcelSizeLabels,
  parcelSizeOptions,
} from "@/constants/parcel-assistant";
import { getParcelAssistantMockResult } from "@/lib/parcel-assistant";
import type {
  ParcelAssistantInput,
  ParcelAssistantResult,
  ParcelPackagingType,
  ParcelSizeOption,
} from "@/types/parcel-assistant";
import type { Option } from "@/types/ui";

export type ParcelCategory =
  | "documents"
  | "retail"
  | "food"
  | "medical"
  | "electronics"
  | "special";

export type CreateDeliveryParcelDraft = {
  category: ParcelCategory;
  packaging: ParcelPackagingType;
  approximateSize: ParcelSizeOption;
  contentDescription: string;
  assistantResult?: ParcelAssistantResult | null;
};

export const parcelCategoryLabels: Record<ParcelCategory, string> = {
  documents: "Documents",
  retail: "Retail Parcel",
  food: "Food Delivery",
  medical: "Medical",
  electronics: "Electronics",
  special: "Special Handling",
};

export const parcelCategoryDescriptions: Record<ParcelCategory, string> = {
  documents: "Paperwork, contracts, IDs or light administrative handoffs.",
  retail: "Everyday store orders, product packs or compact customer parcels.",
  food: "Prepared meals, grocery kits or temperature-aware handoffs.",
  medical: "Pharmacy refills, lab packs or controlled sensitive items.",
  electronics: "Device accessories, peripherals or compact tech parcels.",
  special: "Atypical loads that need extra context before dispatch.",
};

export const parcelCategoryOptions: Option<ParcelCategory>[] = [
  { label: parcelCategoryLabels.documents, value: "documents" },
  { label: parcelCategoryLabels.retail, value: "retail" },
  { label: parcelCategoryLabels.food, value: "food" },
  { label: parcelCategoryLabels.medical, value: "medical" },
  { label: parcelCategoryLabels.electronics, value: "electronics" },
  { label: parcelCategoryLabels.special, value: "special" },
];

export const defaultCreateDeliveryParcelDraft: CreateDeliveryParcelDraft = {
  category: "food",
  packaging: "insulated",
  approximateSize: "medium",
  contentDescription:
    "Fresh meal kits in insulated packaging for same-hour office drop-off.",
};

export function toParcelAssistantInput(
  draft: CreateDeliveryParcelDraft,
): ParcelAssistantInput {
  return {
    contents: draft.contentDescription,
    packaging: draft.packaging,
    approximateSize: draft.approximateSize,
  };
}

export function fromParcelAssistantInput(
  input: ParcelAssistantInput,
  currentCategory: ParcelCategory,
  assistantResult?: ParcelAssistantResult | null,
): CreateDeliveryParcelDraft {
  return {
    category: currentCategory,
    packaging: input.packaging,
    approximateSize: input.approximateSize,
    contentDescription: input.contents,
    assistantResult: assistantResult ?? null,
  };
}

export function getCreateDeliveryParcelGuidance(
  draft: CreateDeliveryParcelDraft,
): ParcelAssistantResult {
  if (draft.assistantResult) {
    return draft.assistantResult;
  }

  return getParcelAssistantMockResult(toParcelAssistantInput(draft));
}

export function getParcelGuidanceTone(
  fragileLevel: ParcelAssistantResult["fragileLevel"],
) {
  if (fragileLevel === "high") {
    return "warning" as const;
  }

  if (fragileLevel === "moderate") {
    return "info" as const;
  }

  return "success" as const;
}

export function getParcelGuidanceSummaryLines(
  draft: CreateDeliveryParcelDraft,
  result: ParcelAssistantResult,
) {
  return [
    `Category: ${parcelCategoryLabels[draft.category]}`,
    `Packaging: ${parcelPackagingLabels[draft.packaging]}`,
    `Size: ${parcelSizeLabels[draft.approximateSize]}`,
    `Estimated weight: ${result.estimatedWeightRange}`,
    `Fragile level: ${parcelFragileLevelLabels[result.fragileLevel]}`,
    `Suggested drone: ${droneClassLabels[result.suggestedDroneClass]}`,
  ];
}

export {
  droneClassLabels,
  parcelFragileLevelLabels,
  parcelPackagingLabels,
  parcelPackagingOptions,
  parcelSizeLabels,
  parcelSizeOptions,
};
