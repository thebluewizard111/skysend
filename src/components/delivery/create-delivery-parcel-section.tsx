"use client";

import { memo } from "react";
import { Box, PackageSearch, Sparkles } from "lucide-react";
import { AppButton } from "@/components/shared/app-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  droneClassLabels,
  getParcelGuidanceTone,
  parcelCategoryDescriptions,
  parcelCategoryOptions,
  parcelFragileLevelLabels,
  parcelPackagingOptions,
  parcelSizeOptions,
} from "@/lib/create-delivery-parcel";
import type { CreateDeliveryParcelDraft } from "@/lib/create-delivery-parcel";
import type { ParcelAssistantResult } from "@/types/parcel-assistant";

type CreateDeliveryParcelSectionProps = {
  parcel: CreateDeliveryParcelDraft;
  guidance: ParcelAssistantResult;
  onChange: <K extends keyof CreateDeliveryParcelDraft>(
    field: K,
    value: CreateDeliveryParcelDraft[K],
  ) => void;
  onOpenAssistant: () => void;
};

export const CreateDeliveryParcelSection = memo(function CreateDeliveryParcelSection({
  parcel,
  guidance,
  onChange,
  onOpenAssistant,
}: CreateDeliveryParcelSectionProps) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Parcel category
            </span>
            <select
              value={parcel.category}
              className="h-12 rounded-2xl border border-input bg-card px-4 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary/15 focus-visible:ring-4 focus-visible:ring-ring"
              onChange={(event) =>
                onChange("category", event.target.value as CreateDeliveryParcelDraft["category"])
              }
            >
              {parcelCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm leading-6 text-muted-foreground">
              {parcelCategoryDescriptions[parcel.category]}
            </p>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Packaging type
              </span>
              <select
                value={parcel.packaging}
                className="h-12 rounded-2xl border border-input bg-card px-4 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary/15 focus-visible:ring-4 focus-visible:ring-ring"
                onChange={(event) =>
                  onChange(
                    "packaging",
                    event.target.value as CreateDeliveryParcelDraft["packaging"],
                  )
                }
              >
                {parcelPackagingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Approximate size
              </span>
              <select
                value={parcel.approximateSize}
                className="h-12 rounded-2xl border border-input bg-card px-4 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary/15 focus-visible:ring-4 focus-visible:ring-ring"
                onChange={(event) =>
                  onChange(
                    "approximateSize",
                    event.target.value as CreateDeliveryParcelDraft["approximateSize"],
                  )
                }
              >
                {parcelSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Optional content description
            </span>
            <textarea
              value={parcel.contentDescription}
              aria-label="Parcel content description"
              rows={5}
              placeholder="Briefly describe what is inside, without trying to be overly technical."
              onChange={(event) => onChange("contentDescription", event.target.value)}
              className="min-h-32 rounded-[var(--ui-radius-card)] border border-input bg-card px-4 py-3 text-sm leading-6 outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/90 focus-visible:border-primary/15 focus-visible:ring-4 focus-visible:ring-ring"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <AppButton type="button" onClick={onOpenAssistant}>
              <Sparkles className="size-4" />
              Open Parcel Assistant
            </AppButton>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <PackageSearch className="size-4" />
              The assistant adds structured guidance, not absolute certainty.
            </p>
          </div>
        </div>

        <Card size="sm" className="rounded-[calc(var(--radius)+0.5rem)] shadow-none">
          <CardContent className="grid gap-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Parcel Assistant result</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  A calm, first-pass recommendation based on the current parcel inputs.
                </p>
              </div>
              <StatusBadge
                label={parcelFragileLevelLabels[guidance.fragileLevel]}
                tone={getParcelGuidanceTone(guidance.fragileLevel)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
              <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/45 px-4 py-4">
                <p className="text-sm text-muted-foreground">Estimated weight range</p>
                <p className="mt-2 font-heading text-xl tracking-tight">
                  {guidance.estimatedWeightRange}
                </p>
              </div>

              <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/45 px-4 py-4">
                <p className="text-sm text-muted-foreground">Suggested drone class</p>
                <p className="mt-2 font-heading text-xl tracking-tight">
                  {droneClassLabels[guidance.suggestedDroneClass]}
                </p>
              </div>
            </div>

            <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-background px-4 py-4">
              <div className="flex items-center gap-2">
                <Box className="size-4 text-foreground" />
                <p className="font-medium text-foreground">Confidence note</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {guidance.confidenceNote}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

CreateDeliveryParcelSection.displayName = "CreateDeliveryParcelSection";
