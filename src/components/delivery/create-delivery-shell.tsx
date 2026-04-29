"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  MapPinned,
  MoveRight,
  Package2,
  ReceiptText,
  ScanSearch,
  Zap,
} from "lucide-react";
import { CreateDeliveryAddressSection } from "@/components/delivery/create-delivery-address-section";
import { CreateDeliveryParcelSection } from "@/components/delivery/create-delivery-parcel-section";
import { LazyMapContainer } from "@/components/maps/lazy-map-container";
import { LazyParcelAssistantPanel } from "@/components/parcel-assistant/lazy-parcel-assistant-panel";
import { RecipientTrackingLinkCard } from "@/components/recipient/recipient-tracking-link-card";
import { AppButton } from "@/components/shared/app-button";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  candidatePointRecommendationLabels,
  candidatePointTypeLabels,
  generateCandidatePointsForAddress,
  getDefaultSelectedCandidatePoint,
  hasSelectableCandidatePoints,
} from "@/lib/candidate-points";
import {
  createDeliveryAddressDraftFromGeocodedAddress,
  createDeliveryAddressDraftFromSuggestion,
  defaultCreateDeliveryAddressDrafts,
  getCreateDeliveryCoverageSummary,
  validateCreateDeliveryAddress,
  type CreateDeliveryAddressField,
} from "@/lib/create-delivery-addresses";
import {
  defaultCreateDeliveryParcelDraft,
  droneClassLabels,
  fromParcelAssistantInput,
  getCreateDeliveryParcelGuidance,
  parcelCategoryLabels,
  parcelPackagingLabels,
  parcelSizeLabels,
  toParcelAssistantInput,
  type CreateDeliveryParcelDraft,
} from "@/lib/create-delivery-parcel";
import { fetchGeoapifyReverseGeocodedSuggestion } from "@/lib/geoapify";
import {
  getMarkerDrivenViewport,
  getServiceAreaMapOverlay,
} from "@/lib/map";
import { submitCreateDeliveryMock } from "@/lib/create-delivery-submit";
import { cn } from "@/lib/utils";
import type { CandidatePoint } from "@/types/candidate-points";
import type {
  CreatedDeliveryOrder,
  CreateDeliveryPayload,
  CreateDeliverySubmitStatus,
} from "@/types/create-delivery";
import type { GeoapifyAddressSuggestion } from "@/types/geoapify";
import type { MapMarkerDefinition, MapSelectionMode } from "@/types/map";
import type { ParcelAssistantInput } from "@/types/parcel-assistant";
import type { ParcelAssistantResult } from "@/types/parcel-assistant";
import type { GeoPoint } from "@/types/service-area";
import {
  toCreateDeliveryAddressPayload,
  toCreateDeliverySelectedPointPayload,
} from "@/types/create-delivery";

const flowSteps = [
  {
    id: "route",
    label: "Route",
    description: "Pickup and drop-off inside Pitesti",
  },
  {
    id: "parcel",
    label: "Parcel",
    description: "Package profile and handling",
  },
  {
    id: "urgency",
    label: "Urgency",
    description: "Dispatch timing and priority",
  },
  {
    id: "summary",
    label: "Summary",
    description: "Review before confirmation",
  },
] as const;

const urgencyOptions = [
  {
    value: "standard",
    label: "Standard",
    note: "Balanced same-hour dispatch inside the active city zone.",
  },
  {
    value: "priority",
    label: "Priority",
    note: "Move earlier in the dispatch queue with tighter timing.",
  },
  {
    value: "scheduled",
    label: "Scheduled",
    note: "Reserve a future handoff window for a known route.",
  },
] as const;

const serviceAreaOverlay = getServiceAreaMapOverlay();
const serviceAreaOverlays = [serviceAreaOverlay] as const;

type MapSelectionFeedback = {
  tone: "info" | "success" | "warning" | "destructive";
  title: string;
  description: string;
};

type CandidatePointCollection = Record<
  CreateDeliveryAddressField,
  CandidatePoint[]
>;

type SelectedCandidatePointCollection = Record<
  CreateDeliveryAddressField,
  CandidatePoint | null
>;

type CreateDeliveryFlowStep = "details" | "review" | "success";

type SummaryReadinessItem = {
  id: string;
  label: string;
  met: boolean;
  message: string;
  tone: "success" | "warning" | "destructive" | "info";
};

type ReviewDeliverySnapshot = {
  pickupAddress: string;
  pickupPoint: CandidatePoint | null;
  dropoffAddress: string;
  dropoffPoint: CandidatePoint | null;
  parcelSummary: string;
  parcelContent: string;
  estimatedWeightRange: string;
  urgencyLabel: string;
  urgencyNote: string;
  recommendedDroneClass: string;
  droneConfidenceNote: string;
  estimatedPriceLabel: string;
  fallbackNote: string;
  estimatedWindowLabel: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 0,
  }).format(value);
}

function getSubmittedStatusLabel(status: CreateDeliverySubmitStatus) {
  return status === "pending_review" ? "Pending review" : "Scheduled";
}

function getSubmittedStatusTone(status: CreateDeliverySubmitStatus) {
  return status === "pending_review" ? ("warning" as const) : ("success" as const);
}

function formatPointCoordinates(candidatePoint: CandidatePoint | null) {
  if (!candidatePoint) {
    return "No handoff point selected";
  }

  return `${candidatePoint.point.latitude.toFixed(5)}, ${candidatePoint.point.longitude.toFixed(5)}`;
}

function getFallbackNote(
  pickupPoint: CandidatePoint | null,
  dropoffPoint: CandidatePoint | null,
) {
  if (!pickupPoint || !dropoffPoint) {
    return "Default fallback is operator review before dispatch if a compliant handoff point is missing.";
  }

  if (
    pickupPoint.recommendationState === "recommended" &&
    dropoffPoint.recommendationState === "recommended"
  ) {
    return "Default fallback: keep the recommended points, then ask operations to reroute to the next eligible candidate if weather or access changes.";
  }

  return "Fallback preference: respect the manually selected handoff points first, then use the best eligible candidate point before cancellation.";
}

function getEstimatedWindowMinutes(
  urgency: (typeof urgencyOptions)[number]["value"],
  coverageState: "ready" | "inside" | "review" | "outside",
) {
  const baseMinutes =
    urgency === "priority" ? 18 : urgency === "scheduled" ? 34 : 24;

  if (coverageState === "review") {
    return {
      min: baseMinutes + 4,
      max: baseMinutes + 10,
    };
  }

  return {
    min: baseMinutes,
    max: baseMinutes + 6,
  };
}

function getMarkerToneForAddress(
  state: "empty" | "ready" | "inside" | "review" | "outside",
  defaultTone: "primary" | "success",
) {
  if (state === "outside") {
    return "destructive" as const;
  }

  if (state === "review") {
    return "warning" as const;
  }

  return defaultTone;
}

function getMarkerToneForCandidatePoint(
  candidatePoint: CandidatePoint,
  defaultTone: "primary" | "success",
) {
  if (candidatePoint.eligibilityState === "outside") {
    return "destructive" as const;
  }

  if (candidatePoint.eligibilityState === "review") {
    return "warning" as const;
  }

  return defaultTone;
}

function getMarkerVariantForCandidatePoint(candidatePoint: CandidatePoint) {
  return candidatePoint.recommendationState === "recommended"
    ? ("recommended" as const)
    : ("candidate" as const);
}

function isCandidatePointEligibleForContinue(candidatePoint: CandidatePoint | null) {
  return Boolean(
    candidatePoint && candidatePoint.eligibilityState !== "outside",
  );
}

function getCandidateSelectionTone(candidatePoint: CandidatePoint | null) {
  if (!candidatePoint) {
    return "info" as const;
  }

  if (candidatePoint.eligibilityState === "outside") {
    return "destructive" as const;
  }

  if (candidatePoint.recommendationState === "recommended") {
    return "success" as const;
  }

  return "warning" as const;
}

function getCandidateSelectionLabel(
  candidatePoint: CandidatePoint | null,
  recommendedCandidatePoint: CandidatePoint | null,
) {
  if (!candidatePoint) {
    return "Point needed";
  }

  if (candidatePoint.eligibilityState === "outside") {
    return "Unavailable";
  }

  if (!recommendedCandidatePoint || candidatePoint.id === recommendedCandidatePoint.id) {
    return "Recommended point";
  }

  return "Manual selection";
}

function buildCandidatePointState(
  drafts: Record<CreateDeliveryAddressField, typeof defaultCreateDeliveryAddressDrafts.pickup>,
): {
  points: CandidatePointCollection;
  selected: SelectedCandidatePointCollection;
} {
  const pickupValidation = validateCreateDeliveryAddress(drafts.pickup);
  const dropoffValidation = validateCreateDeliveryAddress(drafts.dropoff);
  const pickupPoints = pickupValidation.geocodedAddress
    ? generateCandidatePointsForAddress(
        "pickup",
        pickupValidation.geocodedAddress,
        pickupValidation.isEligible,
      )
    : [];
  const dropoffPoints = dropoffValidation.geocodedAddress
    ? generateCandidatePointsForAddress(
        "dropoff",
        dropoffValidation.geocodedAddress,
        dropoffValidation.isEligible,
      )
    : [];

  return {
    points: {
      pickup: pickupPoints,
      dropoff: dropoffPoints,
    },
    selected: {
      pickup: getDefaultSelectedCandidatePoint(pickupPoints),
      dropoff: getDefaultSelectedCandidatePoint(dropoffPoints),
    },
  };
}

export function CreateDeliveryShell() {
  const { user } = useUser();
  const initialCandidatePointState = useMemo(() => {
    return buildCandidatePointState({
      pickup: { ...defaultCreateDeliveryAddressDrafts.pickup },
      dropoff: { ...defaultCreateDeliveryAddressDrafts.dropoff },
    });
  }, []);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mapSelectionMode, setMapSelectionMode] =
    useState<Exclude<MapSelectionMode, "preview"> | null>(null);
  const [pendingMapPoint, setPendingMapPoint] = useState<GeoPoint | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [mapSelectionFeedback, setMapSelectionFeedback] =
    useState<MapSelectionFeedback | null>(null);
  const [urgency, setUrgency] = useState<(typeof urgencyOptions)[number]["value"]>(
    "priority",
  );
  const [routeAddresses, setRouteAddresses] = useState(() => ({
    pickup: { ...defaultCreateDeliveryAddressDrafts.pickup },
    dropoff: { ...defaultCreateDeliveryAddressDrafts.dropoff },
  }));
  const [candidatePoints, setCandidatePoints] = useState<CandidatePointCollection>(
    () => initialCandidatePointState.points,
  );
  const [selectedCandidatePoints, setSelectedCandidatePoints] =
    useState<SelectedCandidatePointCollection>(
      () => initialCandidatePointState.selected,
    );
  const [parcelDraft, setParcelDraft] = useState<CreateDeliveryParcelDraft>(() => ({
    ...defaultCreateDeliveryParcelDraft,
  }));
  const [flowStep, setFlowStep] = useState<CreateDeliveryFlowStep>("details");
  const [reviewGateMessage, setReviewGateMessage] = useState<string | null>(null);
  const [deliveryPrepared, setDeliveryPrepared] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedDeliveryOrder | null>(null);

  const selectedUrgency = urgencyOptions.find((option) => option.value === urgency);
  const pickupValidation = useMemo(() => {
    return validateCreateDeliveryAddress(routeAddresses.pickup);
  }, [routeAddresses.pickup]);
  const dropoffValidation = useMemo(() => {
    return validateCreateDeliveryAddress(routeAddresses.dropoff);
  }, [routeAddresses.dropoff]);
  const coverageSummary = useMemo(() => {
    return getCreateDeliveryCoverageSummary(pickupValidation, dropoffValidation);
  }, [dropoffValidation, pickupValidation]);
  const parcelGuidance = useMemo(() => {
    return getCreateDeliveryParcelGuidance(parcelDraft);
  }, [parcelDraft]);
  const estimatedWindow = useMemo(() => {
    return getEstimatedWindowMinutes(urgency, coverageSummary.state);
  }, [coverageSummary.state, urgency]);
  const estimatedPrice = useMemo(() => {
    const basePrice =
      urgency === "priority" ? 39 : urgency === "scheduled" ? 34 : 29;
    const sizeAdjustment =
      parcelDraft.approximateSize === "large"
        ? 12
        : parcelDraft.approximateSize === "medium"
          ? 6
          : parcelDraft.approximateSize === "small"
            ? 2
            : 0;
    const packagingAdjustment =
      parcelDraft.packaging === "fragile_protective"
        ? 5
        : parcelDraft.packaging === "insulated"
          ? 3
          : parcelDraft.packaging === "heavy_duty"
            ? 7
            : 0;
    const coverageAdjustment = coverageSummary.state === "review" ? 2 : 0;

    return basePrice + sizeAdjustment + packagingAdjustment + coverageAdjustment;
  }, [
    coverageSummary.state,
    parcelDraft.approximateSize,
    parcelDraft.packaging,
    urgency,
  ]);
  const parcelReady =
    Boolean(parcelDraft.category) &&
    Boolean(parcelDraft.packaging) &&
    Boolean(parcelDraft.approximateSize);
  const urgencyReady = Boolean(selectedUrgency);
  const canContinue = useMemo(() => {
    return (
      pickupValidation.isEligible &&
      dropoffValidation.isEligible &&
      isCandidatePointEligibleForContinue(selectedCandidatePoints.pickup) &&
      isCandidatePointEligibleForContinue(selectedCandidatePoints.dropoff) &&
      routeAddresses.pickup.address.trim().length >= 8 &&
      routeAddresses.dropoff.address.trim().length >= 8 &&
      parcelReady &&
      urgencyReady
    );
  }, [
    dropoffValidation.isEligible,
    parcelReady,
    pickupValidation.isEligible,
    routeAddresses.dropoff.address,
    routeAddresses.pickup.address,
    selectedCandidatePoints.dropoff,
    selectedCandidatePoints.pickup,
    urgencyReady,
  ]);
  const pickupSummary = pickupValidation.geocodedAddress?.formattedAddress
    ? pickupValidation.geocodedAddress.formattedAddress
    : routeAddresses.pickup.address.trim() || "Pickup address pending";
  const dropoffSummary = dropoffValidation.geocodedAddress?.formattedAddress
    ? dropoffValidation.geocodedAddress.formattedAddress
    : routeAddresses.dropoff.address.trim() || "Drop-off address pending";
  const pickupRecommendedPoint = useMemo(() => {
    return (
      candidatePoints.pickup.find(
        (candidatePoint) => candidatePoint.recommendationState === "recommended",
      ) ?? null
    );
  }, [candidatePoints.pickup]);
  const dropoffRecommendedPoint = useMemo(() => {
    return (
      candidatePoints.dropoff.find(
        (candidatePoint) => candidatePoint.recommendationState === "recommended",
      ) ?? null
    );
  }, [candidatePoints.dropoff]);
  const pickupHasSelectablePoints = hasSelectableCandidatePoints(
    candidatePoints.pickup,
  );
  const dropoffHasSelectablePoints = hasSelectableCandidatePoints(
    candidatePoints.dropoff,
  );
  const readinessItems = useMemo<SummaryReadinessItem[]>(() => {
    return [
      {
        id: "pickup-address",
        label: "Pickup address",
        met: pickupValidation.isEligible,
        message: pickupValidation.isEligible
          ? "Pickup address is confirmed inside the active Pitesti service flow."
          : pickupValidation.state === "outside"
            ? "Pickup sits outside the active Pitesti area."
            : "Select a precise pickup address from search or map.",
        tone: pickupValidation.isEligible
          ? "success"
          : pickupValidation.state === "outside"
            ? "destructive"
            : "info",
      },
      {
        id: "dropoff-address",
        label: "Drop-off address",
        met: dropoffValidation.isEligible,
        message: dropoffValidation.isEligible
          ? "Drop-off address is confirmed and ready for handoff planning."
          : dropoffValidation.state === "outside"
            ? "Drop-off sits outside the active Pitesti area."
            : "Select a precise drop-off address from search or map.",
        tone: dropoffValidation.isEligible
          ? "success"
          : dropoffValidation.state === "outside"
            ? "destructive"
            : "info",
      },
      {
        id: "pickup-point",
        label: "Pickup point",
        met: isCandidatePointEligibleForContinue(selectedCandidatePoints.pickup),
        message: selectedCandidatePoints.pickup
          ? selectedCandidatePoints.pickup.id === pickupRecommendedPoint?.id
            ? "Pickup uses the current recommended handoff point."
            : "Pickup point was changed manually and remains eligible."
          : pickupHasSelectablePoints
            ? "Select a pickup handoff point before review."
            : "No eligible pickup point is available for the current address.",
        tone: isCandidatePointEligibleForContinue(selectedCandidatePoints.pickup)
          ? selectedCandidatePoints.pickup?.id === pickupRecommendedPoint?.id
            ? "success"
            : "warning"
          : pickupHasSelectablePoints
            ? "info"
            : "destructive",
      },
      {
        id: "dropoff-point",
        label: "Drop-off point",
        met: isCandidatePointEligibleForContinue(selectedCandidatePoints.dropoff),
        message: selectedCandidatePoints.dropoff
          ? selectedCandidatePoints.dropoff.id === dropoffRecommendedPoint?.id
            ? "Drop-off uses the current recommended handoff point."
            : "Drop-off point was changed manually and remains eligible."
          : dropoffHasSelectablePoints
            ? "Select a drop-off handoff point before review."
            : "No eligible drop-off point is available for the current address.",
        tone: isCandidatePointEligibleForContinue(selectedCandidatePoints.dropoff)
          ? selectedCandidatePoints.dropoff?.id === dropoffRecommendedPoint?.id
            ? "success"
            : "warning"
          : dropoffHasSelectablePoints
            ? "info"
            : "destructive",
      },
      {
        id: "parcel",
        label: "Parcel details",
        met: parcelReady,
        message: parcelReady
          ? "Parcel profile is complete enough for fare and drone guidance."
          : "Add the parcel category, packaging and approximate size first.",
        tone: parcelReady ? "success" : "info",
      },
      {
        id: "urgency",
        label: "Urgency",
        met: urgencyReady,
        message: urgencyReady
          ? `${selectedUrgency?.label ?? "Dispatch"} timing is selected.`
          : "Choose the dispatch timing before review.",
        tone: urgencyReady ? "success" : "info",
      },
    ];
  }, [
    dropoffHasSelectablePoints,
    dropoffRecommendedPoint?.id,
    dropoffValidation.isEligible,
    dropoffValidation.state,
    parcelReady,
    pickupHasSelectablePoints,
    pickupRecommendedPoint?.id,
    pickupValidation.isEligible,
    pickupValidation.state,
    selectedCandidatePoints.dropoff,
    selectedCandidatePoints.pickup,
    selectedUrgency?.label,
    urgencyReady,
  ]);
  const missingReadinessItems = readinessItems.filter((item) => !item.met);
  const primaryCtaLabel = canContinue ? "Review delivery" : "Continue";
  const primaryCtaStatusLabel = canContinue
    ? "Ready for review"
    : missingReadinessItems.length === 1
      ? `Waiting for ${missingReadinessItems[0].label.toLowerCase()}`
      : `Waiting for ${missingReadinessItems.length} items`;
  const reviewSnapshot = useMemo<ReviewDeliverySnapshot>(() => {
    return {
      pickupAddress: pickupSummary,
      pickupPoint: selectedCandidatePoints.pickup,
      dropoffAddress: dropoffSummary,
      dropoffPoint: selectedCandidatePoints.dropoff,
      parcelSummary: `${parcelCategoryLabels[parcelDraft.category]} / ${parcelSizeLabels[
        parcelDraft.approximateSize
      ].toLocaleLowerCase("en-US")} / ${parcelPackagingLabels[
        parcelDraft.packaging
      ].toLocaleLowerCase("en-US")}`,
      parcelContent: parcelDraft.contentDescription.trim() || "No content note provided.",
      estimatedWeightRange: parcelGuidance.estimatedWeightRange,
      urgencyLabel: selectedUrgency?.label ?? "Not selected",
      urgencyNote: selectedUrgency?.note ?? "Choose dispatch timing before confirmation.",
      recommendedDroneClass: droneClassLabels[parcelGuidance.suggestedDroneClass],
      droneConfidenceNote: parcelGuidance.confidenceNote,
      estimatedPriceLabel: formatCurrency(estimatedPrice),
      fallbackNote: getFallbackNote(
        selectedCandidatePoints.pickup,
        selectedCandidatePoints.dropoff,
      ),
      estimatedWindowLabel: `${estimatedWindow.min} to ${estimatedWindow.max} min`,
    };
  }, [
    dropoffSummary,
    estimatedPrice,
    estimatedWindow.max,
    estimatedWindow.min,
    parcelDraft.approximateSize,
    parcelDraft.category,
    parcelDraft.contentDescription,
    parcelDraft.packaging,
    parcelGuidance.confidenceNote,
    parcelGuidance.estimatedWeightRange,
    parcelGuidance.suggestedDroneClass,
    pickupSummary,
    selectedCandidatePoints.dropoff,
    selectedCandidatePoints.pickup,
    selectedUrgency?.label,
    selectedUrgency?.note,
  ]);

  const syncResolvedAddress = useCallback((
    field: CreateDeliveryAddressField,
    nextDraft: (typeof routeAddresses)[CreateDeliveryAddressField],
    feedback: MapSelectionFeedback,
  ) => {
    const nextValidation = validateCreateDeliveryAddress(nextDraft);
    const nextCandidatePoints = nextValidation.geocodedAddress
      ? generateCandidatePointsForAddress(
          field,
          nextValidation.geocodedAddress,
          nextValidation.isEligible,
        )
      : [];

    setRouteAddresses((currentValue) => ({
      ...currentValue,
      [field]: nextDraft,
    }));
    setCandidatePoints((currentValue) => ({
      ...currentValue,
      [field]: nextCandidatePoints,
    }));
    setSelectedCandidatePoints((currentValue) => ({
      ...currentValue,
      [field]: getDefaultSelectedCandidatePoint(nextCandidatePoints),
    }));
    setPendingMapPoint(null);
    setMapSelectionFeedback(feedback);
  }, []);

  const handleAddressChange = useCallback((field: CreateDeliveryAddressField, value: string) => {
    setRouteAddresses((currentValue) => ({
      ...currentValue,
      [field]: {
        ...currentValue[field],
        address: value,
        selectedAddress: null,
      },
    }));
    setCandidatePoints((currentValue) => ({
      ...currentValue,
      [field]: [],
    }));
    setSelectedCandidatePoints((currentValue) => ({
      ...currentValue,
      [field]: null,
    }));
  }, []);

  const handleAddressSelect = useCallback((
    field: CreateDeliveryAddressField,
    suggestion: GeoapifyAddressSuggestion,
  ) => {
    const nextDraft = createDeliveryAddressDraftFromSuggestion(
      routeAddresses[field],
      suggestion,
    );

    syncResolvedAddress(field, nextDraft, {
      tone: "success",
      title: field === "pickup" ? "Pickup updated from search" : "Drop-off updated from search",
      description:
        "The selected address is now synced with the route preview and coverage validation.",
    });
  }, [routeAddresses, syncResolvedAddress]);

  const handleNotesChange = useCallback((field: CreateDeliveryAddressField, value: string) => {
    setRouteAddresses((currentValue) => ({
      ...currentValue,
      [field]: {
        ...currentValue[field],
        notes: value,
      },
    }));
  }, []);

  const handleCandidatePointSelect = useCallback((
    field: CreateDeliveryAddressField,
    candidatePointId: string,
  ) => {
    setSelectedCandidatePoints((currentValue) => ({
      ...currentValue,
      [field]:
        candidatePoints[field].find(
          (candidatePoint) => candidatePoint.id === candidatePointId,
        ) ?? null,
    }));
  }, [candidatePoints]);

  const handleParcelChange = useCallback(<K extends keyof CreateDeliveryParcelDraft>(
    field: K,
    value: CreateDeliveryParcelDraft[K],
  ) => {
    setParcelDraft((currentValue) => ({
      ...currentValue,
      [field]: value,
      assistantResult: null,
    }));
  }, []);

  const handleOpenAssistant = useCallback(() => {
    setAssistantOpen(true);
  }, []);

  const handleCloseAssistant = useCallback(() => {
    setAssistantOpen(false);
  }, []);

  const handlePickupMapSelectionMode = useCallback(() => {
    setMapSelectionMode((currentValue) =>
      currentValue === "pickup" ? null : "pickup",
    );
    setMapSelectionFeedback({
      tone: "info",
      title: "Pickup selection mode",
      description:
        "Click on the map to set the pickup point and resolve it into an address.",
    });
  }, []);

  const handleDropoffMapSelectionMode = useCallback(() => {
    setMapSelectionMode((currentValue) =>
      currentValue === "dropoff" ? null : "dropoff",
    );
    setMapSelectionFeedback({
      tone: "info",
      title: "Drop-off selection mode",
      description:
        "Click on the map to set the drop-off point and resolve it into an address.",
    });
  }, []);

  const handleMapPointSelection = useCallback(async (point: GeoPoint) => {
    if (!mapSelectionMode || isReverseGeocoding) {
      return;
    }

    setPendingMapPoint(point);
    setIsReverseGeocoding(true);
    setMapSelectionFeedback({
      tone: "info",
      title:
        mapSelectionMode === "pickup"
          ? "Resolving pickup point"
          : "Resolving drop-off point",
      description:
        "SkySend is converting the clicked point into a usable address for the current delivery flow.",
    });

    try {
      const suggestion = await fetchGeoapifyReverseGeocodedSuggestion(point);

      if (!suggestion) {
        setMapSelectionFeedback({
          tone: "warning",
          title: "Address not precise enough",
          description:
            "We could not build a reliable address from that map point. Try a nearby street-facing point or use autocomplete.",
        });
        return;
      }

      const activeField = mapSelectionMode;
      const nextDraft = createDeliveryAddressDraftFromGeocodedAddress(
        routeAddresses[activeField],
        suggestion.geocodedAddress,
      );

      syncResolvedAddress(activeField, nextDraft, {
        tone: "success",
        title:
          activeField === "pickup"
            ? "Pickup selected on map"
            : "Drop-off selected on map",
        description:
          "The clicked point was resolved into an address, candidate handoff points and coverage validation.",
      });
      setMapSelectionMode(null);
      setPendingMapPoint(null);
    } catch {
      setMapSelectionFeedback({
        tone: "destructive",
        title: "Map selection unavailable for a moment",
        description:
          "Reverse geocoding could not complete right now. Try again or use the address search field above.",
      });
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [
    isReverseGeocoding,
    mapSelectionMode,
    routeAddresses,
    syncResolvedAddress,
  ]);

  function handleReviewDelivery() {
    if (!canContinue) {
      setFlowStep("details");
      setReviewGateMessage(
        "Review opens after the route, handoff points, parcel and urgency are complete.",
      );
      return;
    }

    setReviewGateMessage(null);
    setDeliveryPrepared(false);
    setCreatedOrder(null);
    setFlowStep("review");
  }

  function handleEditDetails() {
    setDeliveryPrepared(false);
    setCreatedOrder(null);
    setSubmitError(null);
    setFlowStep("details");
  }

  function handleCreateAnotherDelivery() {
    const nextCandidatePointState = buildCandidatePointState({
      pickup: { ...defaultCreateDeliveryAddressDrafts.pickup },
      dropoff: { ...defaultCreateDeliveryAddressDrafts.dropoff },
    });

    setUrgency("priority");
    setRouteAddresses({
      pickup: { ...defaultCreateDeliveryAddressDrafts.pickup },
      dropoff: { ...defaultCreateDeliveryAddressDrafts.dropoff },
    });
    setCandidatePoints(nextCandidatePointState.points);
    setSelectedCandidatePoints(nextCandidatePointState.selected);
    setParcelDraft({ ...defaultCreateDeliveryParcelDraft });
    setMapSelectionMode(null);
    setPendingMapPoint(null);
    setMapSelectionFeedback(null);
    setDeliveryPrepared(false);
    setCreatedOrder(null);
    setSubmitError(null);
    setReviewGateMessage(null);
    setFlowStep("details");
  }

  function buildCreateDeliveryPayload(): CreateDeliveryPayload | null {
    const pickupAddressPayload = toCreateDeliveryAddressPayload(
      routeAddresses.pickup,
    );
    const dropoffAddressPayload = toCreateDeliveryAddressPayload(
      routeAddresses.dropoff,
    );
    const selectedPickupPointPayload = toCreateDeliverySelectedPointPayload(
      selectedCandidatePoints.pickup,
    );
    const selectedDropoffPointPayload = toCreateDeliverySelectedPointPayload(
      selectedCandidatePoints.dropoff,
    );

    if (
      !pickupAddressPayload ||
      !dropoffAddressPayload ||
      !selectedPickupPointPayload ||
      !selectedDropoffPointPayload
    ) {
      return null;
    }

    return {
      userId: user?.id ?? null,
      pickupAddress: pickupAddressPayload,
      dropoffAddress: dropoffAddressPayload,
      selectedPickupPoint: selectedPickupPointPayload,
      selectedDropoffPoint: selectedDropoffPointPayload,
      parcel: {
        category: parcelDraft.category,
        packaging: parcelDraft.packaging,
        approximateSize: parcelDraft.approximateSize,
        contentDescription: parcelDraft.contentDescription,
        estimatedWeightRange: parcelGuidance.estimatedWeightRange,
      },
      urgency,
      recommendedDroneClass: parcelGuidance.suggestedDroneClass,
      estimatedPrice: {
        amountMinor: estimatedPrice * 100,
        currency: "RON",
      },
      estimatedEcoMetrics: {
        estimatedCo2SavedGrams: 0,
        estimatedRoadDistanceSavedKm: 0,
        estimatedEnergyUseKwh: 0,
      },
      estimatedEta: {
        minMinutes: estimatedWindow.min,
        maxMinutes: estimatedWindow.max,
      },
      coverageStatus: coverageSummary.state,
      coverageSummary,
      createdAt: new Date().toISOString(),
    };
  }

  async function handleConfirmDelivery() {
    if (!canContinue || isSubmittingOrder) {
      setSubmitError(
        "The delivery cannot be confirmed until the review data is complete.",
      );
      return;
    }

    const payload = buildCreateDeliveryPayload();

    if (!payload) {
      setSubmitError(
        "Some route details are missing. Go back and refresh the selected addresses or handoff points.",
      );
      return;
    }

    setIsSubmittingOrder(true);
    setSubmitError(null);

    try {
      const createdOrder = await submitCreateDeliveryMock(payload);

      setCreatedOrder(createdOrder);
      setDeliveryPrepared(true);
      setFlowStep("success");
    } catch {
      setSubmitError(
        "SkySend could not prepare the order right now. No payment was started.",
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  const mapMarkers = useMemo<readonly MapMarkerDefinition[]>(
    () => {
      const nextMarkers: MapMarkerDefinition[] = [];

      if (pickupValidation.geocodedAddress) {
        nextMarkers.push({
          id: "pickup",
          point: pickupValidation.geocodedAddress.location,
          label: "Pickup point",
          description: routeAddresses.pickup.address.trim() || "Pickup point",
          tone: getMarkerToneForAddress(pickupValidation.state, "primary"),
          emphasized: true,
        });
      }

      candidatePoints.pickup.forEach((candidatePoint) => {
        nextMarkers.push({
          id: candidatePoint.id,
          point: candidatePoint.point,
          label: `Pickup ${candidatePoint.label}`,
          description: candidatePoint.description,
          tone: getMarkerToneForCandidatePoint(candidatePoint, "primary"),
          emphasized: selectedCandidatePoints.pickup?.id === candidatePoint.id,
          variant: getMarkerVariantForCandidatePoint(candidatePoint),
        });
      });

      if (dropoffValidation.geocodedAddress) {
        nextMarkers.push({
          id: "dropoff",
          point: dropoffValidation.geocodedAddress.location,
          label: "Drop-off point",
          description: routeAddresses.dropoff.address.trim() || "Drop-off point",
          tone: getMarkerToneForAddress(dropoffValidation.state, "success"),
          emphasized: true,
        });
      }

      candidatePoints.dropoff.forEach((candidatePoint) => {
        nextMarkers.push({
          id: candidatePoint.id,
          point: candidatePoint.point,
          label: `Drop-off ${candidatePoint.label}`,
          description: candidatePoint.description,
          tone: getMarkerToneForCandidatePoint(candidatePoint, "success"),
          emphasized: selectedCandidatePoints.dropoff?.id === candidatePoint.id,
          variant: getMarkerVariantForCandidatePoint(candidatePoint),
        });
      });

      return nextMarkers;
    },
    [
      candidatePoints.dropoff,
      candidatePoints.pickup,
      dropoffValidation.geocodedAddress,
      dropoffValidation.state,
      pickupValidation.geocodedAddress,
      pickupValidation.state,
      routeAddresses.dropoff.address,
      routeAddresses.pickup.address,
      selectedCandidatePoints.dropoff,
      selectedCandidatePoints.pickup,
    ],
  );
  const mapViewport = useMemo(() => {
    if (pendingMapPoint) {
      return {
        center: pendingMapPoint,
        zoom: 15,
      };
    }

    return getMarkerDrivenViewport(mapMarkers);
  }, [mapMarkers, pendingMapPoint]);
  const selectedRoutePointCount =
    Number(Boolean(pickupValidation.geocodedAddress)) +
    Number(Boolean(dropoffValidation.geocodedAddress));
  const candidatePointCount =
    candidatePoints.pickup.length + candidatePoints.dropoff.length;
  const mapOverlayContent = useMemo(
    () => (
      <div className="map-overlay-card max-w-sm">
        <p className="type-caption">Active zone</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge
            label={
              coverageSummary.state === "outside"
                ? "Coverage update needed"
                : coverageSummary.state === "review"
                  ? "Boundary review"
                  : "Pitesti only"
            }
            tone={coverageSummary.tone}
          />
          <StatusBadge
            label={
              selectedRoutePointCount === 2
                ? "Both points visible"
                : selectedRoutePointCount === 1
                  ? "One point visible"
                  : "Waiting for points"
            }
            tone="info"
          />
          <StatusBadge
            label={
              candidatePointCount > 0
                ? `${candidatePointCount} candidate points`
                : "Candidate points pending"
            }
            tone="info"
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {isReverseGeocoding
            ? "The clicked map point is being converted into a structured address."
            : selectedRoutePointCount === 0
              ? "Select a pickup or drop-off address and the map will recenter automatically on the chosen location."
              : selectedRoutePointCount === 1
                ? "The map is centered on the selected address. Add the second point to preview the full route context."
                : coverageSummary.description}
        </p>
      </div>
    ),
    [
      candidatePointCount,
      coverageSummary.description,
      coverageSummary.state,
      coverageSummary.tone,
      isReverseGeocoding,
      selectedRoutePointCount,
    ],
  );
  const assistantPanelKey = useMemo(
    () =>
      [
        parcelDraft.category,
        parcelDraft.packaging,
        parcelDraft.approximateSize,
        parcelDraft.contentDescription,
      ].join("|"),
    [
      parcelDraft.approximateSize,
      parcelDraft.category,
      parcelDraft.contentDescription,
      parcelDraft.packaging,
    ],
  );
  const assistantInitialInput = useMemo(
    () => toParcelAssistantInput(parcelDraft),
    [parcelDraft],
  );
  const handleApplyAssistant = useCallback((
    input: ParcelAssistantInput,
    result: ParcelAssistantResult,
  ) => {
    setParcelDraft((currentValue) =>
      fromParcelAssistantInput(input, currentValue.category, result),
    );
  }, []);

  if (flowStep === "success" && createdOrder) {
    const payload = createdOrder.payload;
    const etaLabel = `${payload.estimatedEta.minMinutes} to ${payload.estimatedEta.maxMinutes} min`;
    const priceLabel = new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: payload.estimatedPrice.currency,
      maximumFractionDigits: 2,
    }).format(payload.estimatedPrice.amountMinor / 100);
    return (
      <section className="app-container flex flex-col gap-6">
        <PageHeader
          eyebrow="Delivery Registered"
          title="SkySend has prepared the order for payment."
          description="Complete secure card payment before the live mission starts."
        />

        <Card className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]">
          <CardContent className="grid gap-6 p-5 sm:p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={getSubmittedStatusLabel(createdOrder.status)}
                    tone={getSubmittedStatusTone(createdOrder.status)}
                  />
                  <StatusBadge label="Session order" tone="info" />
                </div>
                <h1 className="font-heading text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
                  {createdOrder.id}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  The delivery is registered with route, parcel, drone and price attached. Payment is required before dispatch.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[calc(var(--radius)+0.5rem)] border border-border/80 bg-secondary/45 p-4">
                <div className="flex items-center gap-3">
                  <MapPinned className="size-4 text-foreground" />
                  <p className="font-medium text-foreground">Pickup</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {payload.pickupAddress.formattedAddress}
                  <br />
                  {payload.selectedPickupPoint.label}
                </p>
              </div>

              <div className="rounded-[calc(var(--radius)+0.5rem)] border border-border/80 bg-secondary/45 p-4">
                <div className="flex items-center gap-3">
                  <MoveRight className="size-4 text-foreground" />
                  <p className="font-medium text-foreground">Drop-off</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {payload.dropoffAddress.formattedAddress}
                  <br />
                  {payload.selectedDropoffPoint.label}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[calc(var(--radius)+0.5rem)] border border-border/80 bg-background p-4">
                <div className="flex items-center gap-3">
                  <Clock3 className="size-4 text-foreground" />
                  <p className="font-medium text-foreground">Estimated ETA</p>
                </div>
                <p className="mt-3 font-heading text-2xl tracking-tight">
                  {etaLabel}
                </p>
              </div>

              <div className="rounded-[calc(var(--radius)+0.5rem)] border border-border/80 bg-background p-4">
                <div className="flex items-center gap-3">
                  <ReceiptText className="size-4 text-foreground" />
                  <p className="font-medium text-foreground">Estimated price</p>
                </div>
                <p className="mt-3 font-heading text-2xl tracking-tight">
                  {priceLabel}
                </p>
              </div>

            </div>

            <RecipientTrackingLinkCard orderId={createdOrder.id} />

            <div className="grid gap-3 sm:grid-cols-3">
              <AppButton asChild size="lg">
                <Link href={`/client/checkout/${createdOrder.id}`}>
                  Continue to payment
                  <ArrowRight className="size-4" />
                </Link>
              </AppButton>
              <AppButton asChild variant="outline" size="lg">
                <Link href={createdOrder.href}>View order details</Link>
              </AppButton>
              <AppButton
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleCreateAnotherDelivery}
              >
                Create another delivery
              </AppButton>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (flowStep === "review" && canContinue) {
    return (
      <section className="app-container flex flex-col gap-6">
        <PageHeader
          eyebrow="Review delivery"
          title="Confirm the order before dispatch preparation."
          description="A final, compact check of the route, handoff points, parcel profile, timing, price and operational fallback before the order is prepared."
        />

        <div className="grid gap-2 md:grid-cols-4">
          {flowSteps.map((step, index) => (
            <Card
              key={step.id}
              className={cn(
                "rounded-[calc(var(--radius)+0.5rem)]",
                step.id === "summary" ? "ring-4 ring-ring" : undefined,
              )}
            >
              <CardContent className="grid gap-2 p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-xl border border-border/80 bg-secondary/45 text-xs font-medium text-foreground">
                    {index + 1}
                  </span>
                  <p className="font-medium text-foreground">{step.label}</p>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
          <div className="grid gap-6">
            <Card className="rounded-[calc(var(--radius)+0.75rem)]">
              <CardContent className="grid gap-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="grid gap-2">
                    <p className="type-caption">Route</p>
                    <h2 className="font-heading text-2xl leading-tight tracking-tight text-foreground">
                      Pickup to drop-off
                    </h2>
                  </div>
                  <StatusBadge label={coverageSummary.title} tone={coverageSummary.tone} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    {
                      label: "Pickup",
                      address: reviewSnapshot.pickupAddress,
                      point: reviewSnapshot.pickupPoint,
                      icon: MapPinned,
                    },
                    {
                      label: "Drop-off",
                      address: reviewSnapshot.dropoffAddress,
                      point: reviewSnapshot.dropoffPoint,
                      icon: MoveRight,
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className="rounded-[calc(var(--radius)+0.5rem)] border border-border/80 bg-secondary/45 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Icon className="size-4 text-foreground" />
                            <p className="font-medium text-foreground">{item.label}</p>
                          </div>
                          <StatusBadge
                            label={
                              item.point
                                ? candidatePointRecommendationLabels[
                                    item.point.recommendationState
                                  ]
                                : "Missing"
                            }
                            tone={getCandidateSelectionTone(item.point)}
                          />
                        </div>
                        <div className="mt-4 grid gap-3 text-sm leading-6">
                          <div>
                            <p className="text-muted-foreground">Address</p>
                            <p className="font-medium text-foreground">{item.address}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Selected point</p>
                            <p className="font-medium text-foreground">
                              {item.point?.label ?? "No point selected"}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {item.point
                                ? `${candidatePointTypeLabels[item.point.type]} / ${item.point.description}`
                                : "Select a handoff point before confirming."}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge
                              label={formatPointCoordinates(item.point)}
                              tone="info"
                            />
                            {item.point ? (
                              <StatusBadge
                                label={`${item.point.distanceFromOriginMeters} m from address`}
                                tone="neutral"
                              />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <Card className="rounded-[calc(var(--radius)+0.75rem)]">
                <CardContent className="grid gap-5 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Package2 className="size-4 text-foreground" />
                      <p className="font-medium text-foreground">Parcel</p>
                    </div>
                    <StatusBadge label="Ready" tone="success" />
                  </div>
                  <div className="grid gap-3 text-sm leading-6">
                    <div>
                      <p className="text-muted-foreground">Details</p>
                      <p className="font-medium text-foreground">
                        {reviewSnapshot.parcelSummary}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contents</p>
                      <p className="text-foreground">{reviewSnapshot.parcelContent}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Estimated weight range</p>
                      <p className="font-medium text-foreground">
                        {reviewSnapshot.estimatedWeightRange}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[calc(var(--radius)+0.75rem)]">
                <CardContent className="grid gap-5 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Zap className="size-4 text-foreground" />
                      <p className="font-medium text-foreground">Dispatch</p>
                    </div>
                    <StatusBadge label={reviewSnapshot.urgencyLabel} tone="success" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Urgency</p>
                      <p className="mt-1 font-medium text-foreground">
                        {reviewSnapshot.urgencyLabel}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {reviewSnapshot.urgencyNote}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Recommended drone</p>
                      <p className="mt-1 font-medium text-foreground">
                        {reviewSnapshot.recommendedDroneClass}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {reviewSnapshot.droneConfidenceNote}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-[calc(var(--radius)+0.75rem)]">
              <CardContent className="grid gap-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CircleAlert className="size-4 text-foreground" />
                    <p className="font-medium text-foreground">Fallback preference</p>
                  </div>
                  <StatusBadge label="Default rule" tone="info" />
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  {reviewSnapshot.fallbackNote}
                </p>
              </CardContent>
            </Card>
          </div>

          <aside className="grid gap-4 xl:sticky xl:top-8">
            <Card className="rounded-[calc(var(--radius)+0.75rem)]">
              <CardContent className="grid gap-5 p-5">
                <div className="grid gap-1">
                  <p className="type-caption">Estimate</p>
                  <p className="font-heading text-4xl leading-none tracking-tight text-foreground">
                    {reviewSnapshot.estimatedPriceLabel}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Prepared estimate before payment authorization.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                    <div className="flex items-center gap-3">
                      <Clock3 className="size-4 text-foreground" />
                      <p className="font-medium text-foreground">Window</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {reviewSnapshot.estimatedWindowLabel}
                    </p>
                  </div>
                </div>

                {deliveryPrepared ? (
                  <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 text-foreground" />
                      <div className="grid gap-1">
                        <p className="font-medium text-foreground">
                          Delivery prepared
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          The confirmation payload is ready for the future Stripe and Supabase submit step.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {submitError ? (
                  <div className="rounded-[calc(var(--radius)+0.375rem)] border border-destructive/25 bg-destructive/5 p-4">
                    <div className="flex items-start gap-3">
                      <CircleAlert className="mt-0.5 size-4 text-destructive" />
                      <div className="grid gap-1">
                        <p className="font-medium text-foreground">
                          Submit needs attention
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {submitError}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3">
                  <AppButton
                    type="button"
                    size="lg"
                    disabled={isSubmittingOrder}
                    onClick={handleConfirmDelivery}
                  >
                    {isSubmittingOrder ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : null}
                    {isSubmittingOrder ? "Preparing order" : "Confirm delivery"}
                    {!isSubmittingOrder ? <ArrowRight className="size-4" /> : null}
                  </AppButton>
                  <AppButton
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={isSubmittingOrder}
                    onClick={handleEditDetails}
                  >
                    <ArrowLeft className="size-4" />
                    Edit details
                  </AppButton>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="app-container flex flex-col gap-6">
        <PageHeader
          eyebrow="Create delivery"
          title="Start a new order inside the active Pitesti service flow."
          description="Set the route, parcel and timing before checkout and live mission dispatch."
        />

        <div className="grid gap-3 md:grid-cols-4">
          {flowSteps.map((step, index) => (
            <Card key={step.id} className="rounded-[calc(var(--radius)+0.25rem)] shadow-none">
              <CardContent className="grid gap-1.5 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-secondary/45 text-xs font-medium text-foreground">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium text-foreground">{step.label}</p>
                </div>
                <p className="hidden text-xs leading-5 text-muted-foreground xl:block">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {reviewGateMessage ? (
          <div className="rounded-[calc(var(--radius)+0.5rem)] border border-border/80 bg-secondary/45 p-4">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 size-4 text-foreground" />
              <div className="grid gap-1">
                <p className="font-medium text-foreground">Review is not ready yet</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {reviewGateMessage}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.72fr)] xl:items-start">
          <div className="grid gap-6">
            <SectionCard
              eyebrow="Route"
              title="Pickup and drop-off"
              description="The route is checked first so both points can stay inside the active Pitesti area before parcel handling and dispatch timing move forward."
            >
              <CreateDeliveryAddressSection
                pickup={routeAddresses.pickup}
                dropoff={routeAddresses.dropoff}
                pickupValidation={pickupValidation}
                dropoffValidation={dropoffValidation}
                coverageSummary={coverageSummary}
                pickupCandidatePoints={candidatePoints.pickup}
                dropoffCandidatePoints={candidatePoints.dropoff}
                selectedPickupCandidatePointId={selectedCandidatePoints.pickup?.id ?? null}
                selectedDropoffCandidatePointId={
                  selectedCandidatePoints.dropoff?.id ?? null
                }
                onAddressChange={handleAddressChange}
                onAddressSelect={handleAddressSelect}
                onNotesChange={handleNotesChange}
                onCandidatePointSelect={handleCandidatePointSelect}
              />
            </SectionCard>

            <SectionCard
              eyebrow="Parcel"
              title="Parcel details"
              description="Keep parcel inputs structured and explicit. The assistant can refine the weight, fragile level and drone fit without pretending to know the package with absolute precision."
            >
              <CreateDeliveryParcelSection
                parcel={parcelDraft}
                guidance={parcelGuidance}
                onChange={handleParcelChange}
                onOpenAssistant={handleOpenAssistant}
              />
            </SectionCard>

            <SectionCard
              eyebrow="Urgency"
              title="Dispatch timing"
              description="Choose the dispatch mode before review. The intent stays clear and the timing remains easy to scan on both desktop and mobile."
            >
              <div className="grid gap-3 md:grid-cols-3">
                {urgencyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setUrgency(option.value)}
                    className={cn(
                      "rounded-[calc(var(--radius)+0.5rem)] border px-4 py-4 text-left transition-colors",
                      urgency === option.value
                        ? "border-border bg-card shadow-[var(--elevation-card)] ring-4 ring-ring"
                        : "border-border/80 bg-secondary/45 hover:bg-secondary/65",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">{option.label}</p>
                      {urgency === option.value ? (
                        <StatusBadge label="Selected" tone="info" />
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {option.note}
                    </p>
                  </button>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-5 xl:sticky xl:top-8">
            <SectionCard
              eyebrow="Map Preview"
              title="Coverage and route preview"
              description="The map rail keeps the Pitesti service area visible while the client shapes the order."
            >
              <div className="grid gap-2">
                <div className="flex flex-wrap gap-2">
                  <AppButton
                    type="button"
                    variant={mapSelectionMode === "pickup" ? "default" : "outline"}
                    size="xs"
                    onClick={handlePickupMapSelectionMode}
                  >
                    <ScanSearch className="size-3.5" />
                    Select pickup on map
                  </AppButton>
                  <AppButton
                    type="button"
                    variant={mapSelectionMode === "dropoff" ? "default" : "outline"}
                    size="xs"
                    onClick={handleDropoffMapSelectionMode}
                  >
                    <ScanSearch className="size-3.5" />
                    Select drop-off on map
                  </AppButton>
                </div>

                {mapSelectionFeedback ? (
                  <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 px-3 py-2.5">
                    <div className="flex items-start gap-3">
                      {isReverseGeocoding ? (
                        <LoaderCircle className="mt-0.5 size-4 animate-spin text-foreground" />
                      ) : (
                        <MapPinned className="mt-0.5 size-4 text-foreground" />
                      )}
                      <div className="grid gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">
                            {mapSelectionFeedback.title}
                          </p>
                          <StatusBadge
                            label={
                              mapSelectionFeedback.tone === "success"
                                ? "Synced"
                                : mapSelectionFeedback.tone === "warning"
                                  ? "Needs retry"
                                  : mapSelectionFeedback.tone === "destructive"
                                    ? "Unavailable"
                                    : "Map input"
                            }
                            tone={mapSelectionFeedback.tone}
                          />
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {mapSelectionFeedback.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <LazyMapContainer
                className="min-h-[30rem] md:min-h-[36rem] xl:min-h-[38rem]"
                ariaLabel="Create delivery route preview"
                center={mapViewport.center}
                zoom={mapViewport.zoom}
                interactive={Boolean(mapSelectionMode)}
                selectionMode={mapSelectionMode ?? "preview"}
                markers={mapMarkers}
                selectedPoint={pendingMapPoint}
                onPointSelect={mapSelectionMode ? handleMapPointSelection : undefined}
                overlays={serviceAreaOverlays}
                overlayContent={mapOverlayContent}
              />
            </SectionCard>

            <SectionCard
              eyebrow="Order Summary"
              title="Delivery state before review"
              description="The summary reflects the real state of the flow: route validity, selected handoff points, parcel profile, timing and price."
            >
              <div className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <MapPinned className="size-4 text-foreground" />
                        <p className="font-medium text-foreground">Pickup</p>
                      </div>
                      <StatusBadge
                        label={pickupValidation.badgeLabel}
                        tone={pickupValidation.tone}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      <span className="font-medium text-foreground">Address:</span>{" "}
                      {pickupSummary}
                      <br />
                      <span className="font-medium text-foreground">Point:</span>{" "}
                      {selectedCandidatePoints.pickup?.label ?? "No pickup point selected yet"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge
                        label={getCandidateSelectionLabel(
                          selectedCandidatePoints.pickup,
                          pickupRecommendedPoint,
                        )}
                        tone={getCandidateSelectionTone(selectedCandidatePoints.pickup)}
                      />
                      {selectedCandidatePoints.pickup ? (
                        <StatusBadge
                          label={
                            candidatePointRecommendationLabels[
                              selectedCandidatePoints.pickup.recommendationState
                            ]
                          }
                          tone={getCandidateSelectionTone(selectedCandidatePoints.pickup)}
                        />
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {readinessItems.find((item) => item.id === "pickup-point")?.message}
                    </p>
                  </div>

                  <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <MoveRight className="size-4 text-foreground" />
                        <p className="font-medium text-foreground">Drop-off</p>
                      </div>
                      <StatusBadge
                        label={dropoffValidation.badgeLabel}
                        tone={dropoffValidation.tone}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      <span className="font-medium text-foreground">Address:</span>{" "}
                      {dropoffSummary}
                      <br />
                      <span className="font-medium text-foreground">Point:</span>{" "}
                      {selectedCandidatePoints.dropoff?.label ??
                        "No drop-off point selected yet"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge
                        label={getCandidateSelectionLabel(
                          selectedCandidatePoints.dropoff,
                          dropoffRecommendedPoint,
                        )}
                        tone={getCandidateSelectionTone(selectedCandidatePoints.dropoff)}
                      />
                      {selectedCandidatePoints.dropoff ? (
                        <StatusBadge
                          label={
                            candidatePointRecommendationLabels[
                              selectedCandidatePoints.dropoff.recommendationState
                            ]
                          }
                          tone={getCandidateSelectionTone(selectedCandidatePoints.dropoff)}
                        />
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {readinessItems.find((item) => item.id === "dropoff-point")?.message}
                    </p>
                  </div>
                </div>

                <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Package2 className="size-4 text-foreground" />
                      <p className="font-medium text-foreground">Parcel</p>
                    </div>
                    <StatusBadge
                      label={parcelReady ? "Ready" : "Needs detail"}
                      tone={parcelReady ? "success" : "info"}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {parcelCategoryLabels[parcelDraft.category]},{" "}
                    {parcelSizeLabels[parcelDraft.approximateSize].toLocaleLowerCase("en-US")}{" "}
                    size,{" "}
                    {parcelPackagingLabels[parcelDraft.packaging].toLocaleLowerCase("en-US")}{" "}
                    packaging.
                    <br />
                    Estimated weight {parcelGuidance.estimatedWeightRange}.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Zap className="size-4 text-foreground" />
                        <p className="font-medium text-foreground">Urgency</p>
                      </div>
                      <StatusBadge
                        label={selectedUrgency?.label ?? "Missing"}
                        tone={urgencyReady ? "success" : "info"}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {selectedUrgency?.note ??
                        "Choose the dispatch timing before moving to review."}
                    </p>
                  </div>

                  <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Package2 className="size-4 text-foreground" />
                        <p className="font-medium text-foreground">Drone class</p>
                      </div>
                      <StatusBadge label="Recommended" tone="info" />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {droneClassLabels[parcelGuidance.suggestedDroneClass]}
                      <br />
                      {parcelGuidance.confidenceNote}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-4">
                    <div className="flex items-center gap-3">
                      <Clock3 className="size-4 text-foreground" />
                      <p className="font-medium text-foreground">Estimated window</p>
                    </div>
                    <p className="mt-3 font-heading text-2xl tracking-tight">
                      {estimatedWindow.min} to {estimatedWindow.max} min
                    </p>
                  </div>

                  <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-4">
                    <div className="flex items-center gap-3">
                      <ReceiptText className="size-4 text-foreground" />
                      <p className="font-medium text-foreground">Estimated price</p>
                    </div>
                    <p className="mt-3 font-heading text-2xl tracking-tight">
                      {formatCurrency(estimatedPrice)}
                    </p>
                  </div>

                </div>

                <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <MapPinned className="size-4 text-foreground" />
                      <p className="font-medium text-foreground">Coverage</p>
                    </div>
                    <StatusBadge label={coverageSummary.title} tone={coverageSummary.tone} />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {coverageSummary.description}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Final Step"
              title="Continue when the route is ready"
              description="The main action opens only when the route, handoff points, parcel profile and timing are all ready for review."
              footer={
                <div className="flex flex-wrap gap-3">
                  <AppButton
                    type="button"
                    size="lg"
                    disabled={!canContinue}
                    onClick={handleReviewDelivery}
                  >
                    {primaryCtaLabel}
                    <ArrowRight className="size-4" />
                  </AppButton>
                  <StatusBadge
                    label={primaryCtaStatusLabel}
                    tone={canContinue ? "success" : "info"}
                  />
                </div>
              }
            >
              <div className="grid gap-3">
                {canContinue ? (
                  <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 text-foreground" />
                      <div className="grid gap-1">
                        <p className="font-medium text-foreground">
                          The order is ready for review
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          Route validation, point selection, parcel details and urgency are aligned. You can move forward to the review step.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                    <div className="flex items-start gap-3">
                      <CircleAlert className="mt-0.5 size-4 text-foreground" />
                      <div className="grid gap-3">
                        <div className="grid gap-1">
                          <p className="font-medium text-foreground">
                            A few details still need attention
                          </p>
                          <p className="text-sm leading-6 text-muted-foreground">
                            The flow stays light, but review opens only after the route and parcel inputs are coherent end to end.
                          </p>
                        </div>
                        <div className="grid gap-2">
                          {missingReadinessItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3"
                            >
                              <div className="grid gap-1">
                                <p className="font-medium text-foreground">{item.label}</p>
                                <p className="text-sm leading-6 text-muted-foreground">
                                  {item.message}
                                </p>
                              </div>
                              <StatusBadge label="Pending" tone={item.tone} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </section>

      {assistantOpen ? (
        <LazyParcelAssistantPanel
          key={assistantPanelKey}
          open={assistantOpen}
          onClose={handleCloseAssistant}
          initialInput={assistantInitialInput}
          onApply={handleApplyAssistant}
        />
      ) : null}
    </>
  );
}
