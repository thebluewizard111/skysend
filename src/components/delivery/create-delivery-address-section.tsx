"use client";

import { memo, useMemo } from "react";
import { MapPin, MapPinOff, Navigation } from "lucide-react";
import { AddressAutocompleteInput } from "@/components/maps/address-autocomplete-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  candidatePointEligibilityLabels,
  candidatePointRecommendationLabels,
  candidatePointTypeLabels,
  hasSelectableCandidatePoints,
} from "@/lib/candidate-points";
import { cn } from "@/lib/utils";
import type {
  CreateDeliveryAddressDraft,
  CreateDeliveryAddressField,
  CreateDeliveryAddressValidation,
  CreateDeliveryCoverageSummary,
} from "@/lib/create-delivery-addresses";
import type { CandidatePoint } from "@/types/candidate-points";
import type { GeoapifyAddressSuggestion } from "@/types/geoapify";

type CreateDeliveryAddressSectionProps = {
  pickup: CreateDeliveryAddressDraft;
  dropoff: CreateDeliveryAddressDraft;
  pickupValidation: CreateDeliveryAddressValidation;
  dropoffValidation: CreateDeliveryAddressValidation;
  coverageSummary: CreateDeliveryCoverageSummary;
  pickupCandidatePoints: readonly CandidatePoint[];
  dropoffCandidatePoints: readonly CandidatePoint[];
  selectedPickupCandidatePointId: string | null;
  selectedDropoffCandidatePointId: string | null;
  onAddressChange: (field: CreateDeliveryAddressField, value: string) => void;
  onAddressSelect: (
    field: CreateDeliveryAddressField,
    suggestion: GeoapifyAddressSuggestion,
  ) => void;
  onNotesChange: (field: CreateDeliveryAddressField, value: string) => void;
  onCandidatePointSelect: (
    field: CreateDeliveryAddressField,
    candidatePointId: string,
  ) => void;
};

type AddressFieldCardProps = {
  field: CreateDeliveryAddressField;
  title: string;
  description: string;
  value: CreateDeliveryAddressDraft;
  validation: CreateDeliveryAddressValidation;
  candidatePoints: readonly CandidatePoint[];
  selectedCandidatePointId: string | null;
  onAddressChange: (field: CreateDeliveryAddressField, value: string) => void;
  onAddressSelect: (
    field: CreateDeliveryAddressField,
    suggestion: GeoapifyAddressSuggestion,
  ) => void;
  onNotesChange: (field: CreateDeliveryAddressField, value: string) => void;
  onCandidatePointSelect: (
    field: CreateDeliveryAddressField,
    candidatePointId: string,
  ) => void;
};

const coverageStateClassNames = {
  ready: "border-border/80 bg-secondary/45",
  inside: "border-emerald-200/70 bg-emerald-50/80",
  review: "border-amber-200/80 bg-amber-50/85",
  outside: "border-destructive/15 bg-destructive/5",
} as const;

const CandidatePointSelector = memo(function CandidatePointSelector({
  field,
  candidatePoints,
  selectedCandidatePointId,
  onCandidatePointSelect,
}: {
  field: CreateDeliveryAddressField;
  candidatePoints: readonly CandidatePoint[];
  selectedCandidatePointId: string | null;
  onCandidatePointSelect: (
    field: CreateDeliveryAddressField,
    candidatePointId: string,
  ) => void;
}) {
  const sortedCandidatePoints = useMemo(() => {
    const recommendationOrder = {
      recommended: 0,
      alternative: 1,
      unavailable: 2,
    } as const;

    return [...candidatePoints].sort((left, right) => {
      if (
        recommendationOrder[left.recommendationState] !==
        recommendationOrder[right.recommendationState]
      ) {
        return (
          recommendationOrder[left.recommendationState] -
          recommendationOrder[right.recommendationState]
        );
      }

      return right.smartScore - left.smartScore;
    });
  }, [candidatePoints]);

  if (candidatePoints.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-background/70 px-4 py-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Candidate handoff points appear as soon as the exact address is confirmed
          from autocomplete or map selection.
        </p>
      </div>
    );
  }

  const hasSelectablePoints = hasSelectableCandidatePoints(candidatePoints);

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Candidate points
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Select the preferred {field === "pickup" ? "pickup" : "drop-off"} handoff
            point.
          </p>
        </div>
        <StatusBadge
          label={`${candidatePoints.length} options`}
          tone="info"
        />
      </div>

      <div className="grid gap-3">
        {sortedCandidatePoints.map((candidatePoint) => {
          const isSelected = selectedCandidatePointId === candidatePoint.id;
          const isUnavailable =
            candidatePoint.recommendationState === "unavailable";
          const tone =
            candidatePoint.eligibilityState === "outside"
              ? "destructive"
              : candidatePoint.eligibilityState === "review"
                ? "warning"
                : "success";

          return (
            <button
              key={candidatePoint.id}
              type="button"
              disabled={isUnavailable}
              onClick={() => onCandidatePointSelect(field, candidatePoint.id)}
              className={cn(
                "rounded-[calc(var(--radius)+0.375rem)] border px-4 py-4 text-left transition-colors",
                isSelected
                  ? "border-border bg-card shadow-[var(--elevation-card)] ring-4 ring-ring"
                  : isUnavailable
                    ? "border-border/80 bg-background/70 opacity-80"
                    : "border-border/80 bg-background hover:bg-secondary/45",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{candidatePoint.label}</p>
                    <StatusBadge
                      label={
                        candidatePointRecommendationLabels[
                          candidatePoint.recommendationState
                        ]
                      }
                      tone={
                        candidatePoint.recommendationState === "recommended"
                          ? "info"
                          : candidatePoint.recommendationState === "alternative"
                            ? "success"
                            : "destructive"
                      }
                    />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {candidatePoint.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    label={candidatePointTypeLabels[candidatePoint.type]}
                    tone="info"
                  />
                  <StatusBadge
                    label={
                      candidatePointEligibilityLabels[
                        candidatePoint.eligibilityState
                      ]
                    }
                    tone={tone}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm leading-6 text-muted-foreground">
                <span>Smart score {candidatePoint.smartScore}/100</span>
                <span>{candidatePoint.distanceFromOriginMeters} m from selected address</span>
                {isSelected ? (
                  <StatusBadge label="Selected" tone="info" />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {!hasSelectablePoints ? (
        <div className="rounded-2xl border border-border/80 bg-background/80 px-4 py-4">
          <p className="font-medium text-foreground">
            No selectable point is available yet
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This address sits outside the active Pitesti zone, so the flow cannot
            continue for this route point until a covered location is selected.
          </p>
        </div>
      ) : null}
    </div>
  );
});

const AddressFieldCard = memo(function AddressFieldCard({
  field,
  title,
  description,
  value,
  validation,
  candidatePoints,
  selectedCandidatePointId,
  onAddressChange,
  onAddressSelect,
  onNotesChange,
  onCandidatePointSelect,
}: AddressFieldCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "rounded-[calc(var(--radius)+0.5rem)]",
        coverageStateClassNames[
          validation.state === "empty" ? "ready" : validation.state
        ],
      )}
    >
      <CardContent className="grid gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="font-medium text-foreground">{title}</p>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <StatusBadge label={validation.badgeLabel} tone={validation.tone} />
        </div>

        <AddressAutocompleteInput
          label="Address"
          value={value.address}
          placeholder="Street, number, area"
          ariaInvalid={validation.state === "outside"}
          hasResolvedSelection={
            value.selectedAddress?.formattedAddress === value.address.trim()
          }
          onChange={(nextValue) => onAddressChange(field, nextValue)}
          onSelect={(suggestion) => onAddressSelect(field, suggestion)}
        />

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Location notes
          </span>
          <textarea
            value={value.notes}
            rows={3}
            aria-label={`${title} notes`}
            placeholder="Entrance, floor, reception or a short handoff note"
            onChange={(event) => onNotesChange(field, event.target.value)}
            className="min-h-24 rounded-[var(--ui-radius-card)] border border-input bg-card px-4 py-3 text-sm leading-6 outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/90 focus-visible:border-primary/15 focus-visible:ring-4 focus-visible:ring-ring"
          />
        </label>

        <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
          <Navigation className="mt-0.5 size-4 text-foreground" />
          <p className="text-sm leading-6 text-muted-foreground">
            {validation.helperText}
          </p>
        </div>

        <CandidatePointSelector
          field={field}
          candidatePoints={candidatePoints}
          selectedCandidatePointId={selectedCandidatePointId}
          onCandidatePointSelect={onCandidatePointSelect}
        />
      </CardContent>
    </Card>
  );
});

export const CreateDeliveryAddressSection = memo(function CreateDeliveryAddressSection({
  pickup,
  dropoff,
  pickupValidation,
  dropoffValidation,
  coverageSummary,
  pickupCandidatePoints,
  dropoffCandidatePoints,
  selectedPickupCandidatePointId,
  selectedDropoffCandidatePointId,
  onAddressChange,
  onAddressSelect,
  onNotesChange,
  onCandidatePointSelect,
}: CreateDeliveryAddressSectionProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <AddressFieldCard
          field="pickup"
          title="Pickup address"
          description="Set the collection point inside the active Pitesti zone."
          value={pickup}
          validation={pickupValidation}
          candidatePoints={pickupCandidatePoints}
          selectedCandidatePointId={selectedPickupCandidatePointId}
          onAddressChange={onAddressChange}
          onAddressSelect={onAddressSelect}
          onNotesChange={onNotesChange}
          onCandidatePointSelect={onCandidatePointSelect}
        />

        <AddressFieldCard
          field="dropoff"
          title="Drop-off address"
          description="Add the final handoff point for the current order."
          value={dropoff}
          validation={dropoffValidation}
          candidatePoints={dropoffCandidatePoints}
          selectedCandidatePointId={selectedDropoffCandidatePointId}
          onAddressChange={onAddressChange}
          onAddressSelect={onAddressSelect}
          onNotesChange={onNotesChange}
          onCandidatePointSelect={onCandidatePointSelect}
        />
      </div>

      <div
        className={cn(
          "rounded-[calc(var(--radius)+0.5rem)] border px-5 py-4",
          coverageStateClassNames[coverageSummary.state],
        )}
      >
        <div className="flex items-start gap-3">
          {coverageSummary.state === "outside" ? (
            <MapPinOff className="mt-0.5 size-4 text-foreground" />
          ) : (
            <MapPin className="mt-0.5 size-4 text-foreground" />
          )}
          <div className="grid gap-1">
            <p className="font-medium text-foreground">{coverageSummary.title}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {coverageSummary.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

CandidatePointSelector.displayName = "CandidatePointSelector";
AddressFieldCard.displayName = "AddressFieldCard";
CreateDeliveryAddressSection.displayName = "CreateDeliveryAddressSection";
